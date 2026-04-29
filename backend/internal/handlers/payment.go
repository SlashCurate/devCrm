package handlers

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"
	"university-erp-backend/internal/db"
	"university-erp-backend/internal/middleware"
	"university-erp-backend/internal/models"
	"university-erp-backend/internal/utils"

	"github.com/gorilla/mux"
	razorpay "github.com/razorpay/razorpay-go"
)

// ==================== CREATE RAZORPAY ORDER ====================
func CreatePaymentOrder(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)

	var req struct {
		InvoiceID uint `json:"invoice_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Get student
	var student models.Student
	if err := db.DB.Where("user_id = ?", claims.UserID).First(&student).Error; err != nil {
		utils.ErrorResponse(w, http.StatusNotFound, "Student not found")
		return
	}

	// Get invoice
	var invoice models.StudentFeeInvoice
	if err := db.DB.First(&invoice, req.InvoiceID).Error; err != nil {
		utils.ErrorResponse(w, http.StatusNotFound, "Invoice not found")
		return
	}

	// Check if already paid
	var existingPayment models.Payment
	if err := db.DB.Where("student_id = ? AND invoice_id = ? AND status = ?",
		student.ID, invoice.ID, models.PaymentSuccess).First(&existingPayment).Error; err == nil {
		utils.ErrorResponse(w, http.StatusConflict, "Fee already paid")
		return
	}

	// Create Razorpay client
	client := razorpay.NewClient(
		os.Getenv("RAZORPAY_KEY_ID"),
		os.Getenv("RAZORPAY_KEY_SECRET"),
	)

	receipt := utils.GenerateReceiptNumber()
	amountInPaise := int(invoice.NetAmount * 100)

	data := map[string]interface{}{
		"amount":   amountInPaise,
		"currency": "INR",
		"receipt":  receipt,
		"notes": map[string]interface{}{
			"student_id": student.ID,
			"invoice_id": invoice.ID,
		},
	}

	order, err := client.Order.Create(data, nil)
	if err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, fmt.Sprintf("Failed to create order: %v", err))
		return
	}

	orderID, ok := order["id"].(string)
	if !ok {
		utils.ErrorResponse(w, http.StatusInternalServerError, "Invalid Razorpay response")
		return
	}

	// Save payment record
	payment := models.Payment{
		StudentID:       student.ID,
		InvoiceID:       invoice.ID,
		RazorpayOrderID: orderID,
		AmountPaid:      invoice.NetAmount,
		Currency:        "INR",
		Status:          models.PaymentPending,
		ReceiptNumber:   receipt,
		PaymentDate:     time.Now(),
		PaymentMode:     "Online",
		Gateway:         "Razorpay",
	}

	if err := db.DB.Create(&payment).Error; err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to create payment record")
		return
	}

	utils.JSONResponse(w, http.StatusOK, true, "Order created", map[string]interface{}{
		"order_id":   orderID,
		"amount":     amountInPaise,
		"currency":   "INR",
		"receipt":    receipt,
		"key_id":     os.Getenv("RAZORPAY_KEY_ID"),
		"fee_amount": invoice.NetAmount,
	})
}

// ==================== VERIFY PAYMENT ====================
func VerifyPayment(w http.ResponseWriter, r *http.Request) {
	var req struct {
		RazorpayOrderID   string `json:"razorpay_order_id"`
		RazorpayPaymentID string `json:"razorpay_payment_id"`
		RazorpaySignature string `json:"razorpay_signature"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Verify signature
	secret := os.Getenv("RAZORPAY_KEY_SECRET")
	data := req.RazorpayOrderID + "|" + req.RazorpayPaymentID

	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(data))
	expectedSignature := hex.EncodeToString(mac.Sum(nil))

	if expectedSignature != req.RazorpaySignature {
		utils.ErrorResponse(w, http.StatusBadRequest, "Signature verification failed")
		return
	}

	var payment models.Payment
	if err := db.DB.Where("razorpay_order_id = ?", req.RazorpayOrderID).
		First(&payment).Error; err != nil {
		utils.ErrorResponse(w, http.StatusNotFound, "Payment not found")
		return
	}

	// Prevent duplicate updates
	if payment.Status == models.PaymentSuccess {
		utils.JSONResponse(w, http.StatusOK, true, "Already verified", payment)
		return
	}

	now := time.Now()

	if err := db.DB.Model(&payment).Updates(map[string]interface{}{
		"razorpay_payment_id": req.RazorpayPaymentID,
		"razorpay_signature":  req.RazorpaySignature,
		"status":              models.PaymentSuccess,
		"payment_method":      "online",
		"paid_at":             now,
	}).Error; err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to update payment")
		return
	}

	// Notify student
	var student models.Student
	db.DB.First(&student, payment.StudentID)

	// Get user email for notification
	var user models.User
	db.DB.First(&user, student.UserID)

	db.DB.Create(&models.Notification{
		UserID:  student.UserID,
		Title:   "Payment Successful ✅",
		Message: fmt.Sprintf("Payment of ₹%.2f received. Receipt: %s", payment.AmountPaid, payment.ReceiptNumber),
		Type:    "success",
	})

	go utils.SendNotificationEmail(
		user.Email,
		"Payment Successful",
		fmt.Sprintf("Payment of ₹%.2f received. Receipt: %s", payment.AmountPaid, payment.ReceiptNumber),
	)

	utils.JSONResponse(w, http.StatusOK, true, "Payment verified successfully", payment)
}

// ==================== PAYMENT FAILURE ====================
func PaymentFailure(w http.ResponseWriter, r *http.Request) {
	var req struct {
		RazorpayOrderID string `json:"razorpay_order_id"`
		FailureReason   string `json:"failure_reason"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	var payment models.Payment
	if err := db.DB.Where("razorpay_order_id = ?", req.RazorpayOrderID).
		First(&payment).Error; err != nil {
		utils.ErrorResponse(w, http.StatusNotFound, "Payment not found")
		return
	}

	// Prevent overwrite
	if payment.Status == models.PaymentSuccess {
		utils.JSONResponse(w, http.StatusOK, true, "Already successful", nil)
		return
	}

	if err := db.DB.Model(&payment).Updates(map[string]interface{}{
		"status":         models.PaymentFailed,
		"failure_reason": req.FailureReason,
	}).Error; err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to update failure")
		return
	}

	utils.JSONResponse(w, http.StatusOK, true, "Payment failure recorded", nil)
}

// ==================== GET MY PAYMENTS ====================
func GetMyPayments(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)

	var student models.Student
	if err := db.DB.Where("user_id = ?", claims.UserID).First(&student).Error; err != nil {
		utils.ErrorResponse(w, http.StatusNotFound, "Student not found")
		return
	}

	var payments []models.Payment
	if err := db.DB.
		Preload("Student.User").
		Preload("Invoice").
		Where("student_id = ?", student.ID).
		Order("created_at desc").
		Find(&payments).Error; err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to fetch payments")
		return
	}

	utils.JSONResponse(w, http.StatusOK, true, "Payments fetched", payments)
}

// ==================== GET PENDING FEES ====================
func GetPendingFees(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)

	var student models.Student
	if err := db.DB.Where("user_id = ?", claims.UserID).First(&student).Error; err != nil {
		utils.ErrorResponse(w, http.StatusNotFound, "Student not found")
		return
	}

	if student.ProgramID == nil {
		utils.JSONResponse(w, http.StatusOK, true, "No program assigned", []interface{}{})
		return
	}

	// Get all pending invoices for student
	var allInvoices []models.StudentFeeInvoice
	db.DB.Where("student_id = ? AND status != ?", student.ID, "Paid").Find(&allInvoices)

	var paid []models.Payment
	db.DB.Where("student_id = ? AND status = ?", student.ID, models.PaymentSuccess).Find(&paid)

	paidMap := make(map[uint]bool)
	for _, p := range paid {
		if p.InvoiceID > 0 {
			paidMap[p.InvoiceID] = true
		}
	}

	var pending []models.StudentFeeInvoice
	for _, inv := range allInvoices {
		if !paidMap[inv.ID] {
			pending = append(pending, inv)
		}
	}

	utils.JSONResponse(w, http.StatusOK, true, "Pending fees fetched", pending)
}

// ==================== GET RECEIPT ====================
func GetPaymentReceipt(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	claims := middleware.GetClaims(r)

	var payment models.Payment
	query := db.DB.
		Preload("Student.User").
		Preload("Invoice")

	if claims.Role == models.RoleStudent {
		var student models.Student
		db.DB.Where("user_id = ?", claims.UserID).First(&student)
		query = query.Where("id = ? AND student_id = ?", id, student.ID)
	} else {
		query = query.Where("id = ?", id)
	}

	if err := query.First(&payment).Error; err != nil {
		utils.ErrorResponse(w, http.StatusNotFound, "Payment not found")
		return
	}

	utils.JSONResponse(w, http.StatusOK, true, "Receipt fetched", payment)
}
