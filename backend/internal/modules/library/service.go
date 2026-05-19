package librarymod

import (
	"context"
	"fmt"
	"log"
	"time"

	"university-erp-backend/internal/domain"
	"university-erp-backend/internal/platform/apperrors"
	"university-erp-backend/internal/platform/eventbus"
	"university-erp-backend/internal/platform/outbox"

	"gorm.io/gorm"
)

const (
	finePerDayINR  = 5.0 // ₹5 per day overdue
	maxIssueDays   = 14  // standard loan period
)

type Service struct {
	repo   *Repository
	bus    *eventbus.Bus
	outbox *outbox.Writer
	db     *gorm.DB
}

func NewService(repo *Repository, bus *eventbus.Bus, ob *outbox.Writer, db *gorm.DB) *Service {
	return &Service{repo: repo, bus: bus, outbox: ob, db: db}
}

// ─── Authors ──────────────────────────────────────────────────────────────────
func (s *Service) ListAuthors(ctx context.Context) ([]domain.Author, error) {
	return s.repo.ListAuthors()
}
func (s *Service) CreateAuthor(ctx context.Context, a *domain.Author) error {
	if a.Name == "" {
		return apperrors.BadRequest("author name is required")
	}
	return s.repo.CreateAuthor(a)
}

// ─── Books ────────────────────────────────────────────────────────────────────
func (s *Service) ListBooks(ctx context.Context, search string, page, pageSize int) ([]domain.Book, int64, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	return s.repo.ListBooks(search, page, pageSize)
}
func (s *Service) GetBook(ctx context.Context, id uint) (*domain.Book, error) {
	b, err := s.repo.GetBook(id)
	if err != nil {
		return nil, apperrors.NotFound("book not found")
	}
	return b, nil
}
func (s *Service) AddBook(ctx context.Context, b *domain.Book, copies int) error {
	if b.Title == "" {
		return apperrors.BadRequest("book title is required")
	}
	if copies < 1 {
		copies = 1
	}
	b.TotalCopies = copies
	b.AvailableCopies = copies

	return s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(b).Error; err != nil {
			return err
		}
		for i := 1; i <= copies; i++ {
			copy := domain.BookCopy{
				BookID:     b.ID,
				Barcode:    fmt.Sprintf("BC-%d-%03d", b.ID, i),
				CopyNumber: i,
				Condition:  "Good",
			}
			if err := tx.Create(&copy).Error; err != nil {
				return err
			}
		}
		return nil
	})
}
func (s *Service) UpdateBook(ctx context.Context, id uint, b *domain.Book) error {
	existing, err := s.repo.GetBook(id)
	if err != nil {
		return apperrors.NotFound("book not found")
	}
	b.ID = existing.ID
	return s.repo.UpdateBook(b)
}
func (s *Service) GetBookCopies(ctx context.Context, bookID uint) ([]domain.BookCopy, error) {
	return s.repo.GetBookCopies(bookID)
}

// ─── Circulation (Issue / Return) ─────────────────────────────────────────────
func (s *Service) IssueBook(ctx context.Context, bookID, studentID uint, issuedBy uint) (*domain.Circulation, error) {
	// Check availability
	book, err := s.repo.GetBook(bookID)
	if err != nil {
		return nil, apperrors.NotFound("book not found")
	}
	if book.AvailableCopies <= 0 {
		return nil, apperrors.BadRequest("no copies available for this book")
	}

	// Find an available copy
	copy, err := s.repo.GetAvailableCopy(bookID)
	if err != nil {
		return nil, apperrors.BadRequest("no available copy found")
	}

	// Get issued status
	var issuedStatus domain.StatusCode
	s.db.Where("module = ? AND code = ?", "library", "ISSUED").First(&issuedStatus)

	dueDate := time.Now().AddDate(0, 0, maxIssueDays)
	c := &domain.Circulation{
		BookCopyID: copy.ID,
		StudentID:  studentID,
		IssuedDate: time.Now(),
		DueDate:    dueDate,
		StatusID:   &issuedStatus.ID,
		IssuedBy:   &issuedBy,
	}

	if err := s.repo.IssueBook(c); err != nil {
		return nil, apperrors.Internal("failed to issue book", err)
	}

	// Emit event (outbox)
	s.db.Transaction(func(tx *gorm.DB) error {
		return s.outbox.WriteEvent(tx, "Circulation", fmt.Sprintf("%d", c.ID),
			eventbus.EventBookIssued,
			map[string]interface{}{
				"circulation_id": c.ID,
				"book_copy_id":   c.BookCopyID,
				"student_id":     c.StudentID,
				"due_date":       c.DueDate,
			},
		)
	})

	log.Printf("📚 LibraryMod: Book copy %d issued to Student %d (due: %s)", copy.ID, studentID, dueDate.Format("2006-01-02"))
	return c, nil
}

func (s *Service) ReturnBook(ctx context.Context, circulationID uint) (*domain.Circulation, error) {
	c, err := s.repo.GetCirculation(circulationID)
	if err != nil {
		return nil, apperrors.NotFound("circulation record not found")
	}
	if c.ReturnedDate != nil {
		return nil, apperrors.BadRequest("book already returned")
	}

	now := time.Now()
	c.ReturnedDate = &now

	// Calculate fine
	var daysOverdue int
	var fineAmount float64
	if now.After(c.DueDate) {
		daysOverdue = int(now.Sub(c.DueDate).Hours() / 24)
		fineAmount = float64(daysOverdue) * finePerDayINR
	}
	c.FineAmount = fineAmount

	// Get returned status
	var returnedStatus domain.StatusCode
	s.db.Where("module = ? AND code = ?", "library", "RETURNED").First(&returnedStatus)
	c.StatusID = &returnedStatus.ID

	txErr := s.db.Transaction(func(tx *gorm.DB) error {
		if err := s.repo.ReturnBook(c); err != nil {
			return err
		}

		if fineAmount > 0 {
			fine := &domain.LibraryFine{
				CirculationID: c.ID,
				Amount:        fineAmount,
				Reason:        fmt.Sprintf("Book returned %d day(s) late", daysOverdue),
				CreatedAt:     now,
			}
			if err := tx.Create(fine).Error; err != nil {
				return err
			}

			// Emit overdue fine event — Finance module will post it as an invoice
			if err := s.outbox.WriteEvent(tx, "Circulation", fmt.Sprintf("%d", c.ID),
				eventbus.EventBookOverdue,
				eventbus.BookOverduePayload{
					CirculationID: c.ID,
					StudentID:     c.StudentID,
					BookCopyID:    c.BookCopyID,
					DaysOverdue:   daysOverdue,
					FineAmount:    fineAmount,
				},
			); err != nil {
				return err
			}
			log.Printf("💰 LibraryMod: Overdue fine %.2f emitted for Student %d (Circulation %d)", fineAmount, c.StudentID, c.ID)
		}

		return s.outbox.WriteEvent(tx, "Circulation", fmt.Sprintf("%d", c.ID),
			eventbus.EventBookReturned,
			map[string]interface{}{
				"circulation_id": c.ID,
				"student_id":     c.StudentID,
				"fine_amount":    fineAmount,
			},
		)
	})

	if txErr != nil {
		return nil, apperrors.Internal("book return failed", txErr)
	}
	return c, nil
}

func (s *Service) GetStudentCirculations(ctx context.Context, studentID uint) ([]domain.Circulation, error) {
	return s.repo.ListStudentCirculations(studentID)
}

func (s *Service) ListActiveCirculations(ctx context.Context) ([]domain.Circulation, error) {
	return s.repo.ListActiveCirculations()
}

// ProcessOverdue scans all active circulations and emits overdue events (run by scheduler or manual trigger).
func (s *Service) ProcessOverdue(ctx context.Context) (int, error) {
	overdue, err := s.repo.ListOverdueCirculations()
	if err != nil {
		return 0, err
	}

	count := 0
	for _, c := range overdue {
		daysOverdue := int(time.Since(c.DueDate).Hours() / 24)
		if daysOverdue <= 0 {
			continue
		}
		fineAmount := float64(daysOverdue) * finePerDayINR

		s.db.Transaction(func(tx *gorm.DB) error {
			return s.outbox.WriteEvent(tx, "Circulation", fmt.Sprintf("%d", c.ID),
				eventbus.EventBookOverdue,
				eventbus.BookOverduePayload{
					CirculationID: c.ID,
					StudentID:     c.StudentID,
					BookCopyID:    c.BookCopyID,
					DaysOverdue:   daysOverdue,
					FineAmount:    fineAmount,
				},
			)
		})
		count++
	}

	log.Printf("📚 LibraryMod: Processed %d overdue circulations", count)
	return count, nil
}

// ─── Fines ────────────────────────────────────────────────────────────────────
func (s *Service) GetStudentFines(ctx context.Context, studentID uint) ([]LibraryFineDetail, error) {
	return s.repo.ListStudentFines(studentID)
}
func (s *Service) PayFine(ctx context.Context, fineID uint) error {
	fine, err := s.repo.GetFine(fineID)
	if err != nil {
		return apperrors.NotFound("fine not found")
	}
	if fine.PaidDate != nil {
		return apperrors.BadRequest("fine already paid")
	}
	return s.repo.PayFine(fineID)
}

// ─── Reservations ─────────────────────────────────────────────────────────────
func (s *Service) ReserveBook(ctx context.Context, bookID, studentID uint) (*domain.Reservation, error) {
	book, err := s.repo.GetBook(bookID)
	if err != nil {
		return nil, apperrors.NotFound("book not found")
	}
	if book.AvailableCopies > 0 {
		return nil, apperrors.BadRequest("book is available — please issue directly instead of reserving")
	}
	reservedUntil := time.Now().AddDate(0, 0, 7)
	res := &domain.Reservation{
		BookID:        bookID,
		StudentID:     studentID,
		ReservedFrom:  time.Now(),
		ReservedUntil: &reservedUntil,
	}
	if err := s.repo.CreateReservation(res); err != nil {
		return nil, err
	}
	return res, nil
}
func (s *Service) GetMyReservations(ctx context.Context, studentID uint) ([]domain.Reservation, error) {
	return s.repo.GetStudentReservations(studentID)
}
func (s *Service) CancelReservation(ctx context.Context, id, studentID uint) error {
	return s.repo.CancelReservation(id, studentID)
}

// ─── Digital Resources ────────────────────────────────────────────────────────
func (s *Service) ListDigitalResources(ctx context.Context, resourceType string) ([]domain.DigitalResource, error) {
	return s.repo.ListDigitalResources(resourceType)
}
func (s *Service) AddDigitalResource(ctx context.Context, dr *domain.DigitalResource) error {
	if dr.Title == "" || dr.URL == "" {
		return apperrors.BadRequest("title and url are required")
	}
	return s.repo.CreateDigitalResource(dr)
}

// ─── Purchase Requests ────────────────────────────────────────────────────────
func (s *Service) ListPurchaseRequests(ctx context.Context) ([]domain.PurchaseRequest, error) {
	return s.repo.ListPurchaseRequests()
}
func (s *Service) CreatePurchaseRequest(ctx context.Context, pr *domain.PurchaseRequest) error {
	if pr.Title == "" || pr.RequestedBy == 0 {
		return apperrors.BadRequest("title and requested_by are required")
	}
	return s.repo.CreatePurchaseRequest(pr)
}
func (s *Service) ApprovePurchaseRequest(ctx context.Context, id, approvedBy uint) error {
	return s.repo.ApprovePurchaseRequest(id, approvedBy)
}

// ─── Stats ────────────────────────────────────────────────────────────────────
func (s *Service) GetStats(ctx context.Context) (map[string]interface{}, error) {
	return s.repo.GetLibraryStats()
}

// ─── DTOs ─────────────────────────────────────────────────────────────────────

type LibraryFineDetail struct {
	domain.LibraryFine
	StudentID uint      `json:"student_id"`
	DueDate   time.Time `json:"due_date"`
	IssuedDate time.Time `json:"issued_date"`
}
