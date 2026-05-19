package librarymod

import (
	"time"

	"university-erp-backend/internal/domain"

	"gorm.io/gorm"
)

type Repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) *Repository {
	return &Repository{db: db}
}

// Authors
func (r *Repository) ListAuthors() ([]domain.Author, error) {
	var authors []domain.Author
	err := r.db.Order("name ASC").Find(&authors).Error
	return authors, err
}

func (r *Repository) CreateAuthor(a *domain.Author) error {
	return r.db.Create(a).Error
}

// Books
func (r *Repository) ListBooks(search string, page, pageSize int) ([]domain.Book, int64, error) {
	var books []domain.Book
	var total int64
	offset := (page - 1) * pageSize
	q := r.db.Model(&domain.Book{})
	if search != "" {
		q = q.Where("title ILIKE ? OR isbn ILIKE ?", "%"+search+"%", "%"+search+"%")
	}
	q.Count(&total)
	err := q.Offset(offset).Limit(pageSize).Order("title ASC").Find(&books).Error
	return books, total, err
}

func (r *Repository) GetBook(id uint) (*domain.Book, error) {
	var book domain.Book
	err := r.db.First(&book, id).Error
	return &book, err
}

func (r *Repository) CreateBook(b *domain.Book) error {
	return r.db.Create(b).Error
}

func (r *Repository) UpdateBook(b *domain.Book) error {
	return r.db.Save(b).Error
}

func (r *Repository) GetBookCopies(bookID uint) ([]domain.BookCopy, error) {
	var copies []domain.BookCopy
	err := r.db.Where("book_id = ?", bookID).Find(&copies).Error
	return copies, err
}

func (r *Repository) CreateBookCopy(bc *domain.BookCopy) error {
	return r.db.Create(bc).Error
}

func (r *Repository) GetAvailableCopy(bookID uint) (*domain.BookCopy, error) {
	var copy domain.BookCopy
	// find a copy that's not currently issued
	err := r.db.Where("book_id = ?", bookID).
		Where("id NOT IN (SELECT book_copy_id FROM library.circulations WHERE returned_date IS NULL)").
		First(&copy).Error
	return &copy, err
}

// Circulation (issue / return)
func (r *Repository) IssueBook(c *domain.Circulation) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(c).Error; err != nil {
			return err
		}
		// Decrement available copies
		return tx.Model(&domain.Book{}).Where("id = (SELECT book_id FROM library.book_copies WHERE id = ?)", c.BookCopyID).
			UpdateColumn("available_copies", gorm.Expr("available_copies - 1")).Error
	})
}

func (r *Repository) GetCirculation(id uint) (*domain.Circulation, error) {
	var c domain.Circulation
	err := r.db.First(&c, id).Error
	return &c, err
}

func (r *Repository) GetActiveCirculationForCopy(bookCopyID uint) (*domain.Circulation, error) {
	var c domain.Circulation
	err := r.db.Where("book_copy_id = ? AND returned_date IS NULL", bookCopyID).First(&c).Error
	return &c, err
}

func (r *Repository) ReturnBook(c *domain.Circulation) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(c).Error; err != nil {
			return err
		}
		return tx.Model(&domain.Book{}).Where("id = (SELECT book_id FROM library.book_copies WHERE id = ?)", c.BookCopyID).
			UpdateColumn("available_copies", gorm.Expr("available_copies + 1")).Error
	})
}

func (r *Repository) ListStudentCirculations(studentID uint) ([]domain.Circulation, error) {
	var circs []domain.Circulation
	err := r.db.Where("student_id = ?", studentID).Order("issued_date DESC").Find(&circs).Error
	return circs, err
}

func (r *Repository) ListActiveCirculations() ([]domain.Circulation, error) {
	var circs []domain.Circulation
	err := r.db.Where("returned_date IS NULL").Find(&circs).Error
	return circs, err
}

func (r *Repository) ListOverdueCirculations() ([]domain.Circulation, error) {
	var circs []domain.Circulation
	now := time.Now()
	err := r.db.Where("returned_date IS NULL AND due_date < ?", now).Find(&circs).Error
	return circs, err
}

// Fines
func (r *Repository) CreateFine(f *domain.LibraryFine) error {
	return r.db.Create(f).Error
}

func (r *Repository) GetFine(id uint) (*domain.LibraryFine, error) {
	var f domain.LibraryFine
	err := r.db.First(&f, id).Error
	return &f, err
}

func (r *Repository) ListStudentFines(studentID uint) ([]LibraryFineDetail, error) {
	var fines []LibraryFineDetail
	err := r.db.Table("library.fines f").
		Select("f.*, c.student_id, c.due_date, c.issued_date").
		Joins("JOIN library.circulations c ON c.id = f.circulation_id").
		Where("c.student_id = ?", studentID).
		Order("f.created_at DESC").
		Scan(&fines).Error
	return fines, err
}

func (r *Repository) PayFine(fineID uint) error {
	now := time.Now()
	return r.db.Model(&domain.LibraryFine{}).Where("id = ?", fineID).
		Updates(map[string]interface{}{"paid_date": now}).Error
}

// Reservations
func (r *Repository) CreateReservation(res *domain.Reservation) error {
	return r.db.Create(res).Error
}

func (r *Repository) GetStudentReservations(studentID uint) ([]domain.Reservation, error) {
	var reservations []domain.Reservation
	err := r.db.Where("student_id = ?", studentID).Order("reserved_from DESC").Find(&reservations).Error
	return reservations, err
}

func (r *Repository) CancelReservation(id, studentID uint) error {
	return r.db.Where("id = ? AND student_id = ?", id, studentID).Delete(&domain.Reservation{}).Error
}

// Digital Resources
func (r *Repository) ListDigitalResources(resourceType string) ([]domain.DigitalResource, error) {
	var resources []domain.DigitalResource
	q := r.db.Model(&domain.DigitalResource{})
	if resourceType != "" {
		q = q.Where("resource_type = ?", resourceType)
	}
	err := q.Order("title ASC").Find(&resources).Error
	return resources, err
}

func (r *Repository) CreateDigitalResource(dr *domain.DigitalResource) error {
	return r.db.Create(dr).Error
}

// Purchase Requests
func (r *Repository) ListPurchaseRequests() ([]domain.PurchaseRequest, error) {
	var reqs []domain.PurchaseRequest
	err := r.db.Order("created_at DESC").Find(&reqs).Error
	return reqs, err
}

func (r *Repository) CreatePurchaseRequest(pr *domain.PurchaseRequest) error {
	return r.db.Create(pr).Error
}

func (r *Repository) ApprovePurchaseRequest(id, approvedBy uint) error {
	now := time.Now()
	return r.db.Model(&domain.PurchaseRequest{}).Where("id = ?", id).
		Updates(map[string]interface{}{"approved_by": approvedBy, "approved_at": now}).Error
}

// Stats
func (r *Repository) GetLibraryStats() (map[string]interface{}, error) {
	stats := make(map[string]interface{})
	var totalBooks int64
	r.db.Model(&domain.Book{}).Count(&totalBooks)
	stats["total_books"] = totalBooks

	var issuedCount int64
	r.db.Model(&domain.Circulation{}).Where("returned_date IS NULL").Count(&issuedCount)
	stats["currently_issued"] = issuedCount

	var overdueCount int64
	r.db.Model(&domain.Circulation{}).
		Where("returned_date IS NULL AND due_date < ?", time.Now()).Count(&overdueCount)
	stats["overdue_count"] = overdueCount

	var totalFines float64
	r.db.Table("library.fines").Select("COALESCE(SUM(amount), 0)").Scan(&totalFines)
	stats["total_fines"] = totalFines

	var pendingFines float64
	r.db.Table("library.fines").Where("paid_date IS NULL").Select("COALESCE(SUM(amount), 0)").Scan(&pendingFines)
	stats["pending_fines"] = pendingFines

	return stats, nil
}
