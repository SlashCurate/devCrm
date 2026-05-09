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
// ==================== APPLICANT APPLICATION FEE PAYMENT ====================
// ==================== INITIATE APPLICANT APPLICATION FEE ====================
func InitiateApplicantApplicationFee(w http.ResponseWriter, r *http.Request) {
	var req struct {
		ApplicationID string `json:"application_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate Application ID
	if req.ApplicationID == "" {
		utils.ErrorResponse(w, http.StatusBadRequest, "Application ID is required")
		return
	}

	// ==================== FETCH APPLICANT ====================
	var applicant models.Applicant
	if err := db.DB.Where("application_id = ?", req.ApplicationID).
		Preload("AdmissionCycle").
		First(&applicant).Error; err != nil {
		fmt.Printf("❌ Applicant not found: %s\n", req.ApplicationID)
		utils.ErrorResponse(w, http.StatusNotFound, "Application not found")
		return
	}

	// Validate Fee
	if applicant.ApplicationFee <= 0 {
		utils.JSONResponse(w, http.StatusBadRequest, false, "No application fee required for this applicant", nil)
		return
	}

	if applicant.ApplicationFeePaid {
		utils.JSONResponse(w, http.StatusBadRequest, false, "Application fee already paid", nil)
		return
	}

	// ==================== GET RAZORPAY CREDENTIALS ====================
	razorpayKeyID := os.Getenv("RAZORPAY_KEY_ID")
	razorpayKeySecret := os.Getenv("RAZORPAY_KEY_SECRET")

	if razorpayKeyID == "" || razorpayKeySecret == "" {
		utils.ErrorResponse(w, http.StatusInternalServerError, "Payment gateway not configured")
		return
	}

	// ==================== CREATE RAZORPAY ORDER ====================
	client := razorpay.NewClient(razorpayKeyID, razorpayKeySecret)
	if client == nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, "Payment gateway initialization failed")
		return
	}

	receipt := "APP-" + utils.GenerateReceiptNumber()
	amountInPaise := int64(applicant.ApplicationFee * 100)

	orderData := map[string]interface{}{
		"amount":   amountInPaise,
		"currency": "INR",
		"receipt":  receipt,
		"notes": map[string]interface{}{
			"application_id": applicant.ApplicationID,
			"purpose":        "application_fee",
			"applicant_name": applicant.FirstName + " " + applicant.LastName,
			"applicant_email": applicant.Email,
			"phone":           applicant.Phone,
		},
	}

	order, err := client.Order.Create(orderData, nil)
	if err != nil {
		fmt.Printf("❌ Razorpay Error: %v\n", err)
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to create payment order")
		return
	}

	orderID, ok := order["id"].(string)
	if !ok || orderID == "" {
		utils.ErrorResponse(w, http.StatusInternalServerError, "Invalid payment response")
		return
	}

	// ==================== UPDATE APPLICANT STATUS ====================
	db.DB.Model(&applicant).
		Update("application_fee_payment_id", orderID).
		Update("status", "payment_pending")

	fmt.Printf("✅ Payment Order Created: %s | Application: %s\n", orderID, applicant.ApplicationID)

	// ==================== RETURN RESPONSE ====================
	utils.JSONResponse(w, http.StatusOK, true, "Payment order created successfully", map[string]interface{}{
		"order_id":            orderID,
		"amount":              amountInPaise,
		"amount_in_rupees":    applicant.ApplicationFee,
		"currency":            "INR",
		"key_id":              razorpayKeyID,
		"applicant_name":      applicant.FirstName + " " + applicant.LastName,
		"applicant_email":     applicant.Email,
		"receipt_number":      receipt,
	})
}

// ==================== VERIFY APPLICANT APPLICATION FEE ====================
func VerifyApplicantApplicationFee(w http.ResponseWriter, r *http.Request) {
	var req struct {
		ApplicationID     string `json:"application_id"`
		RazorpayOrderID   string `json:"razorpay_order_id"`
		RazorpayPaymentID string `json:"razorpay_payment_id"`
		RazorpaySignature string `json:"razorpay_signature"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate required fields
	if req.ApplicationID == "" || req.RazorpayOrderID == "" || 
	   req.RazorpayPaymentID == "" || req.RazorpaySignature == "" {
		utils.ErrorResponse(w, http.StatusBadRequest, "Missing required payment fields")
		return
	}

	fmt.Printf("🔍 Verifying: Order=%s | Payment=%s\n", req.RazorpayOrderID, req.RazorpayPaymentID)

	// ==================== VERIFY SIGNATURE ====================
	razorpayKeySecret := os.Getenv("RAZORPAY_KEY_SECRET")
	signatureData := req.RazorpayOrderID + "|" + req.RazorpayPaymentID
	
	mac := hmac.New(sha256.New, []byte(razorpayKeySecret))
	mac.Write([]byte(signatureData))
	expectedSignature := hex.EncodeToString(mac.Sum(nil))

	if expectedSignature != req.RazorpaySignature {
		fmt.Printf("❌ Signature Verification Failed\n")
		utils.ErrorResponse(w, http.StatusBadRequest, "Payment signature verification failed")
		return
	}

	fmt.Printf("✅ Signature Verified\n")

	// ==================== FETCH APPLICANT ====================
	var applicant models.Applicant
	if err := db.DB.Where("application_id = ?", req.ApplicationID).First(&applicant).Error; err != nil {
		utils.ErrorResponse(w, http.StatusNotFound, "Application not found")
		return
	}

	// Check if already paid
	if applicant.ApplicationFeePaid {
		utils.JSONResponse(w, http.StatusBadRequest, false, "Application fee already paid", nil)
		return
	}

	// ==================== UPDATE APPLICANT ====================
	now := time.Now()
	if err := db.DB.Model(&applicant).Updates(map[string]interface{}{
		"application_fee_paid":       true,
		"application_fee_payment_id": req.RazorpayPaymentID,
		"payment_completed_at":       &now,
	}).Error; err != nil {
		fmt.Printf("❌ Failed to update applicant: %v\n", err)
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to update application")
		return
	}

	fmt.Printf("✅ Applicant Updated\n")

	// ==================== CREATE APPLICANT PAYMENT RECORD ====================
	applicantPayment := models.ApplicantPayment{
		ApplicationID:     req.ApplicationID,
		AmountPaid:        applicant.ApplicationFee,
		Currency:          "INR",
		PaymentMode:       "Online",
		TransactionID:     req.RazorpayPaymentID,
		Gateway:           "Razorpay",
		ReceiptNumber:     "APP-" + req.RazorpayPaymentID[:8],
		RazorpayOrderID:   req.RazorpayOrderID,
		RazorpayPaymentID: req.RazorpayPaymentID,
		RazorpaySignature: req.RazorpaySignature,
		Status:            "success",
		IsVerified:        true,
		PaymentDate:       now,
		PaidAt:            &now,
		PaymentFor:        "application_fee",
	}

	if err := db.DB.Create(&applicantPayment).Error; err != nil {
		fmt.Printf("⚠️ Failed to create applicant payment record: %v (Non-critical)\n", err)
		// Non-blocking error - applicant already updated
	} else {
		fmt.Printf("✅ Applicant Payment Record Created: ID=%d\n", applicantPayment.ID)
	}

	// ==================== RETURN RESPONSE ====================
	fmt.Printf("✅ Payment Verification Complete for: %s\n", req.ApplicationID)

	utils.JSONResponse(w, http.StatusOK, true, "Payment verified successfully", map[string]interface{}{
		"application_id": req.ApplicationID,
		"payment_id":     req.RazorpayPaymentID,
		"order_id":       req.RazorpayOrderID,
		"amount":         applicant.ApplicationFee,
		"status":         "payment_verified",
		"verified_at":    now,
	})
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
