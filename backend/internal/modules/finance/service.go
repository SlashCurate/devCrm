package financemod

import (
	"context"
	"encoding/json"
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
	s := &Service{repo: repo, bus: bus, outbox: ob, db: db}
	
	// REGISTER EVENT LISTENER
	s.bus.Subscribe(eventbus.EventStudentEnrolled, s.HandleStudentEnrolled)
	
	return s
}

// ─── Event Handlers ──────────────────────────────────────────────────────────

// HandleStudentEnrolled is triggered asynchronously by the Outbox Worker.
// This implements the choreographed saga / event-driven architecture.
func (s *Service) HandleStudentEnrolled(ctx context.Context, evt eventbus.Event) error {
	log.Printf("💰 FinanceMod: Received StudentEnrolled event for AggregateID: %s", evt.AggregateID)

	payloadBytes, _ := evt.Payload.(string)
	var payload eventbus.StudentEnrolledPayload
	if err := json.Unmarshal([]byte(payloadBytes), &payload); err != nil {
		return fmt.Errorf("failed to unmarshal payload: %w", err)
	}

	// 1. Fetch fee structure for the program
	structures, err := s.repo.GetFeeStructuresForProgram(payload.ProgramID)
	if err != nil || len(structures) == 0 {
		log.Printf("⚠️  FinanceMod: No fee structure found for Program %d", payload.ProgramID)
		return nil // Not an error to retry, just missing config
	}

	// 2. Calculate totals and create items
	var totalAmount float64
	var items []domain.InvoiceItem

	for _, fs := range structures {
		head, _ := s.repo.GetFeeHead(fs.FeeHeadID)
		desc := "Fee"
		if head != nil {
			desc = head.Name
		}
		items = append(items, domain.InvoiceItem{
			FeeHeadID:   fs.FeeHeadID,
			Description: desc,
			Quantity:    1,
			UnitAmount:  fs.Amount,
			Amount:      fs.Amount,
		})
		totalAmount += fs.Amount
	}

	// 3. Get UNPAID status code
	var unPaidStatus domain.StatusCode
	s.db.Where("module = ? AND code = ?", "finance", "UNPAID").First(&unPaidStatus)

	// 4. Generate Invoice Number
	invNo := fmt.Sprintf("INV-%d-%s", time.Now().Year(), payload.RollNumber)

	// 5. Create Invoice
	invoice := domain.Invoice{
		StudentID:      payload.StudentID,
		InvoiceNumber:  invNo,
		AcademicTermID: payload.TermID,
		DueDate:        time.Now().AddDate(0, 1, 0), // 1 month from now
		TotalAmount:    totalAmount,
		PaidAmount:     0,
		StatusID:       &unPaidStatus.ID,
	}

	// Transactional: Create Invoice + emit outbox event
	err = s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&invoice).Error; err != nil {
			return err
		}
		for i := range items {
			items[i].InvoiceID = invoice.ID
			if err := tx.Create(&items[i]).Error; err != nil {
				return err
			}
		}

		// Emit InvoiceGenerated event
		return s.outbox.WriteEvent(tx, "Invoice", fmt.Sprintf("%d", invoice.ID),
			eventbus.EventInvoiceGenerated,
			eventbus.InvoiceGeneratedPayload{
				InvoiceID:     invoice.ID,
				StudentID:     invoice.StudentID,
				TotalAmount:   invoice.TotalAmount,
				InvoiceNumber: invoice.InvoiceNumber,
			},
		)
	})

	if err != nil {
		log.Printf("❌ FinanceMod: Failed to generate invoice for student %d: %v", payload.StudentID, err)
		return err
	}

	log.Printf("✅ FinanceMod: Successfully generated Invoice %s for Student %d", invNo, payload.StudentID)
	return nil
}

// ─── Business Logic ──────────────────────────────────────────────────────────

func (s *Service) GetStudentInvoices(ctx context.Context, studentID uint) ([]domain.Invoice, error) {
	return s.repo.GetStudentInvoices(studentID)
}

type PaymentRequest struct {
	InvoiceID     uint    `json:"invoice_id"`
	StudentID     uint    `json:"student_id"`
	Amount        float64 `json:"amount"`
	TransactionID string  `json:"transaction_id"`
	PaymentModeID *uint   `json:"payment_mode_id"`
}

func (s *Service) ProcessPayment(ctx context.Context, req PaymentRequest) (*domain.Payment, error) {
	invoice, err := s.repo.GetInvoiceByID(req.InvoiceID)
	if err != nil {
		return nil, apperrors.NotFound("invoice")
	}

	if invoice.PaidAmount+req.Amount > invoice.TotalAmount {
		return nil, apperrors.BadRequest("payment amount exceeds total invoice amount")
	}

	payment := &domain.Payment{
		InvoiceID:     req.InvoiceID,
		StudentID:     req.StudentID,
		Amount:        req.Amount,
		TransactionID: req.TransactionID,
		PaymentModeID: req.PaymentModeID,
	}

	txErr := s.db.Transaction(func(tx *gorm.DB) error {
		// Replace standard s.repo.CreatePayment with transactional logic
		// to ensure outbox event is also captured.
		
		if err := tx.Create(payment).Error; err != nil { return err }

		invoice.PaidAmount += payment.Amount
		var status string
		if invoice.PaidAmount >= invoice.TotalAmount {
			status = "PAID"
		} else {
			status = "PARTIAL"
		}

		var statusCode domain.StatusCode
		if err := tx.Where("module = ? AND code = ?", "finance", status).First(&statusCode).Error; err == nil {
			invoice.StatusID = &statusCode.ID
		}

		if err := tx.Save(invoice).Error; err != nil { return err }

		alloc := domain.PaymentAllocation{
			PaymentID:       payment.ID,
			InvoiceID:       payment.InvoiceID,
			AllocatedAmount: payment.Amount,
		}
		if err := tx.Create(&alloc).Error; err != nil { return err }

		// Emit Payment Completed Event
		return s.outbox.WriteEvent(tx, "Payment", fmt.Sprintf("%d", payment.ID),
			eventbus.EventPaymentCompleted,
			eventbus.PaymentCompletedPayload{
				PaymentID:     payment.ID,
				InvoiceID:     payment.InvoiceID,
				StudentID:     payment.StudentID,
				Amount:        payment.Amount,
				TransactionID: payment.TransactionID,
			},
		)
	})

	if txErr != nil {
		return nil, apperrors.Internal("failed to process payment", txErr)
	}

	return payment, nil
}
