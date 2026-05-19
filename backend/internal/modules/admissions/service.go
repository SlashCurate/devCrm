package admissionsmod

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

type Service struct {
        repo   *Repository
        bus    *eventbus.Bus
        outbox *outbox.Writer
        db     *gorm.DB
}

func NewService(repo *Repository, bus *eventbus.Bus, ob *outbox.Writer, db *gorm.DB) *Service {
        return &Service{repo: repo, bus: bus, outbox: ob, db: db}
}

// Admission Cycles
func (s *Service) ListCycles(ctx context.Context) ([]domain.AdmissionCycle, error) {
        return s.repo.ListCycles()
}
func (s *Service) GetOpenCycles(ctx context.Context) ([]domain.AdmissionCycle, error) {
        return s.repo.GetOpenCycles()
}
func (s *Service) GetCycle(ctx context.Context, id uint) (*domain.AdmissionCycle, error) {
        c, err := s.repo.GetCycle(id)
        if err != nil {
                return nil, apperrors.NotFound("admission cycle not found")
        }
        return c, nil
}
func (s *Service) CreateCycle(ctx context.Context, c *domain.AdmissionCycle) error {
        if c.Name == "" {
                return apperrors.BadRequest("cycle name is required")
        }
        c.IsOpen = true
        return s.repo.CreateCycle(c)
}
func (s *Service) UpdateCycle(ctx context.Context, id uint, c *domain.AdmissionCycle) error {
        existing, err := s.repo.GetCycle(id)
        if err != nil {
                return apperrors.NotFound("cycle not found")
        }
        c.ID = existing.ID
        return s.repo.UpdateCycle(c)
}
func (s *Service) CloseCycle(ctx context.Context, id uint) error {
        existing, err := s.repo.GetCycle(id)
        if err != nil {
                return apperrors.NotFound("cycle not found")
        }
        existing.IsOpen = false
        return s.repo.UpdateCycle(existing)
}

// Applicants
func (s *Service) ListApplicants(ctx context.Context, cycleID uint, page, pageSize int) ([]domain.Applicant, int64, error) {
        return s.repo.ListApplicants(cycleID, page, pageSize)
}
func (s *Service) GetApplicant(ctx context.Context, id uint) (*domain.Applicant, error) {
        a, err := s.repo.GetApplicant(id)
        if err != nil {
                return nil, apperrors.NotFound("applicant not found")
        }
        return a, nil
}
func (s *Service) Submit(ctx context.Context, a *domain.Applicant) error {
        if a.FirstName == "" || a.Email == "" {
                return apperrors.BadRequest("first name and email are required")
        }
        count, _ := s.repo.CountApplicationNumber(a.CycleID)
        a.ApplicationNumber = fmt.Sprintf("APP-%d-%04d", time.Now().Year(), count+1)
        a.AppliedAt = time.Now()
        return s.repo.CreateApplicant(a)
}
func (s *Service) UpdateApplicant(ctx context.Context, id uint, a *domain.Applicant) error {
        existing, err := s.repo.GetApplicant(id)
        if err != nil {
                return apperrors.NotFound("applicant not found")
        }
        a.ID = existing.ID
        a.ApplicationNumber = existing.ApplicationNumber
        return s.repo.UpdateApplicant(a)
}

// UpdateStatus — when status changes to "approved", emit ApplicationApproved event.
// The Student module subscribes to this event to auto-create a student record.
func (s *Service) UpdateStatus(ctx context.Context, id uint, statusID uint, changedBy uint) error {
        applicant, err := s.repo.GetApplicant(id)
        if err != nil {
                return apperrors.NotFound("applicant not found")
        }

        txErr := s.db.Transaction(func(tx *gorm.DB) error {
                if err := tx.Model(&domain.Applicant{}).Where("id = ?", id).Update("status_id", statusID).Error; err != nil {
                        return err
                }
                hist := &domain.ApplicationStatusHistory{
                        ApplicantID:   id,
                        StatusID:      statusID,
                        EffectiveFrom: time.Now(),
                }
                if err := tx.Create(hist).Error; err != nil {
                        return err
                }

                // Check if new status is "APPROVED" — look up from status_codes
                var sc domain.StatusCode
                tx.Where("module = ? AND code = ?", "admissions", "APPROVED").First(&sc)
                if sc.ID > 0 && statusID == sc.ID {
                        // Emit ApplicationApproved event — Student module will auto-create student profile
                        log.Printf("🎓 AdmissionsMod: Applicant %d approved — emitting ApplicationApproved event", id)
                        var programID uint
                        if applicant.ProgramID != nil {
                                programID = *applicant.ProgramID
                        }
                        return s.outbox.WriteEvent(tx, "Applicant", fmt.Sprintf("%d", id),
                                eventbus.EventApplicationApproved,
                                eventbus.ApplicationApprovedPayload{
                                        ApplicantID: applicant.ID,
                                        ProgramID:   programID,
                                        Email:       applicant.Email,
                                        FirstName:   applicant.FirstName,
                                        LastName:    applicant.LastName,
                                        CycleID:     applicant.CycleID,
                                },
                        )
                }
                return nil
        })

        return txErr
}

func (s *Service) GetStatusHistory(ctx context.Context, id uint) ([]domain.ApplicationStatusHistory, error) {
        return s.repo.GetStatusHistory(id)
}

// Documents
func (s *Service) GetDocuments(ctx context.Context, applicantID uint) ([]domain.Document, error) {
        return s.repo.GetApplicantDocuments(applicantID)
}
func (s *Service) UploadDocument(ctx context.Context, d *domain.Document) error {
        if d.ApplicantID == 0 || d.DocumentType == "" {
                return apperrors.BadRequest("applicant_id and document_type are required")
        }
        d.UploadedAt = time.Now()
        return s.repo.CreateDocument(d)
}
func (s *Service) VerifyDocument(ctx context.Context, docID, verifiedBy uint) error {
        return s.repo.VerifyDocument(docID, verifiedBy)
}

// Seat Allocation
func (s *Service) AllocateSeat(ctx context.Context, sa *domain.SeatAllocation) error {
        if sa.ApplicantID == 0 || sa.CycleID == 0 {
                return apperrors.BadRequest("applicant_id and cycle_id are required")
        }
        sa.AllocatedAt = time.Now()

        txErr := s.db.Transaction(func(tx *gorm.DB) error {
                if err := tx.Create(sa).Error; err != nil {
                        return err
                }
                return s.outbox.WriteEvent(tx, "SeatAllocation", fmt.Sprintf("%d", sa.ID),
                        eventbus.EventSeatAllocated,
                        map[string]interface{}{
                                "seat_allocation_id": sa.ID,
                                "applicant_id":       sa.ApplicantID,
                                "cycle_id":           sa.CycleID,
                        },
                )
        })
        return txErr
}
func (s *Service) GetSeatAllocation(ctx context.Context, applicantID uint) (*domain.SeatAllocation, error) {
        sa, err := s.repo.GetSeatAllocation(applicantID)
        if err != nil {
                return nil, apperrors.NotFound("seat allocation not found")
        }
        return sa, nil
}
func (s *Service) ListSeatAllocations(ctx context.Context, cycleID uint) ([]domain.SeatAllocation, error) {
        return s.repo.ListSeatAllocations(cycleID)
}

// Waitlist
func (s *Service) AddToWaitlist(ctx context.Context, w *domain.Waitlist) error {
        return s.repo.AddToWaitlist(w)
}
func (s *Service) GetWaitlist(ctx context.Context, cycleID uint) ([]domain.Waitlist, error) {
        return s.repo.GetWaitlist(cycleID)
}

// Conversion - admission to student (manual override mapping)
func (s *Service) ConvertToStudent(ctx context.Context, applicantID, studentID uint) error {
        m := &domain.ApplicantStudentMap{
                ApplicantID: applicantID,
                StudentID:   studentID,
                MappedAt:    time.Now(),
        }
        return s.repo.CreateApplicantStudentMap(m)
}

func (s *Service) GetCycleStats(ctx context.Context, cycleID uint) (map[string]int64, error) {
        return s.repo.GetCycleStats(cycleID)
}
