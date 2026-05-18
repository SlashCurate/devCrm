package financemod

import (
	"university-erp-backend/internal/domain"

	"gorm.io/gorm"
)

type Repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) GetFeeStructuresForProgram(programID uint) ([]domain.FeeStructure, error) {
	var structures []domain.FeeStructure
	err := r.db.Where("program_id = ? AND is_active = ?", programID, true).Find(&structures).Error
	return structures, err
}

func (r *Repository) GetFeeHead(id uint) (*domain.FeeHead, error) {
	var head domain.FeeHead
	err := r.db.First(&head, id).Error
	return &head, err
}

func (r *Repository) CreateInvoice(invoice *domain.Invoice, items []domain.InvoiceItem) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(invoice).Error; err != nil {
			return err
		}
		for i := range items {
			items[i].InvoiceID = invoice.ID
			if err := tx.Create(&items[i]).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (r *Repository) GetStudentInvoices(studentID uint) ([]domain.Invoice, error) {
	var invoices []domain.Invoice
	err := r.db.Where("student_id = ?", studentID).Order("created_at DESC").Find(&invoices).Error
	return invoices, err
}

func (r *Repository) GetInvoiceByID(id uint) (*domain.Invoice, error) {
	var invoice domain.Invoice
	err := r.db.First(&invoice, id).Error
	return &invoice, err
}

func (r *Repository) CreatePayment(payment *domain.Payment) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(payment).Error; err != nil {
			return err
		}

		// Update invoice paid amount
		var invoice domain.Invoice
		if err := tx.First(&invoice, payment.InvoiceID).Error; err != nil {
			return err
		}

		invoice.PaidAmount += payment.Amount
		
		// Determine status
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

		if err := tx.Save(&invoice).Error; err != nil {
			return err
		}

		// Create allocation
		alloc := domain.PaymentAllocation{
			PaymentID:       payment.ID,
			InvoiceID:       payment.InvoiceID,
			AllocatedAmount: payment.Amount,
		}
		if err := tx.Create(&alloc).Error; err != nil {
			return err
		}

		return nil
	})
}
