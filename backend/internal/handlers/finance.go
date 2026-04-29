package handlers

import (
	"encoding/json"
	"net/http"
	"time"
	"university-erp-backend/internal/db"
	"university-erp-backend/internal/middleware"
	"university-erp-backend/internal/models"
	"university-erp-backend/internal/utils"

	"github.com/gorilla/mux"
)

// ==================== CREATE FEE STRUCTURE ====================
func CreateFeeStructure(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)

	var req struct {
		ProgramID      uint    `json:"program_id"`
		AcademicYearID uint    `json:"academic_year_id"`
		SemesterNumber int     `json:"semester_number"`
		CategoryID     uint    `json:"category_id"`
		Amount         float64 `json:"amount"`
		DueDate        string  `json:"due_date"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	dueDate, _ := time.Parse("2006-01-02", req.DueDate)

	fee := models.FeeStructure{
		ProgramID:      req.ProgramID,
		AcademicYearID: req.AcademicYearID,
		SemesterNumber: req.SemesterNumber,
		CategoryID:     req.CategoryID,
		Amount:         req.Amount,
		DueDate:        &dueDate,
		IsActive:       true,
		CreatedBy:      claims.UserID,
	}

	if err := db.DB.Create(&fee).Error; err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to create fee structure")
		return
	}

	utils.JSONResponse(w, http.StatusCreated, true, "Fee structure created", fee)
}

// ==================== LIST FEE STRUCTURES ====================
func ListFeeStructures(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)

	query := db.DB.Preload("Program").Preload("Program.Department.College").Preload("AcademicYear").Preload("Category")
	if claims.Role == models.RoleCollegeAdmin && claims.CollegeID != nil {
		query = query.Joins("JOIN academic.programs ON fee_structures.program_id = programs.id").
			Joins("JOIN core.departments ON programs.department_id = departments.id").
			Where("departments.college_id = ?", *claims.CollegeID)
	}

	var fees []models.FeeStructure
	query.Where("is_active = true").Find(&fees)
	utils.JSONResponse(w, http.StatusOK, true, "Fee structures fetched", fees)
}

// ==================== UPDATE FEE STRUCTURE ====================
func UpdateFeeStructure(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]

	var fee models.FeeStructure
	if err := db.DB.First(&fee, id).Error; err != nil {
		utils.ErrorResponse(w, http.StatusNotFound, "Fee structure not found")
		return
	}

	var req map[string]interface{}
	json.NewDecoder(r.Body).Decode(&req)
	delete(req, "id")
	delete(req, "created_by")

	db.DB.Model(&fee).Updates(req)
	utils.JSONResponse(w, http.StatusOK, true, "Fee structure updated", fee)
}

// ==================== DELETE FEE STRUCTURE ====================
func DeleteFeeStructure(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	db.DB.Model(&models.FeeStructure{}).Where("id = ?", id).Update("is_active", false)
	utils.JSONResponse(w, http.StatusOK, true, "Fee structure deactivated", nil)
}

// ==================== FINANCE DASHBOARD ====================
func FinanceDashboard(w http.ResponseWriter, r *http.Request) {
	var totalCollected, totalPending float64
	var totalPayments, successPayments, pendingPayments int64

	db.DB.Model(&models.Payment{}).Count(&totalPayments)
	db.DB.Model(&models.Payment{}).Where("status = ?", models.PaymentSuccess).Count(&successPayments)
	db.DB.Model(&models.Payment{}).Where("status = ?", models.PaymentPending).Count(&pendingPayments)

	db.DB.Model(&models.Payment{}).
		Where("status = ?", models.PaymentSuccess).
		Select("COALESCE(SUM(amount), 0)").Scan(&totalCollected)

	db.DB.Model(&models.Payment{}).
		Where("status = ?", models.PaymentPending).
		Select("COALESCE(SUM(amount), 0)").Scan(&totalPending)

	// Recent payments
	var recentPayments []models.Payment
	db.DB.Preload("Student.User").Preload("Invoice").
		Order("created_at desc").Limit(10).
		Find(&recentPayments)

	utils.JSONResponse(w, http.StatusOK, true, "Finance dashboard", map[string]interface{}{
		"total_collected":  totalCollected,
		"total_pending":    totalPending,
		"total_payments":   totalPayments,
		"success_payments": successPayments,
		"pending_payments": pendingPayments,
		"recent_payments":  recentPayments,
	})
}

// ==================== ALL PAYMENTS ====================
func GetAllPayments(w http.ResponseWriter, r *http.Request) {
	status := r.URL.Query().Get("status")
	query := db.DB.Preload("Student.User").Preload("Invoice")

	if status != "" {
		query = query.Where("status = ?", status)
	}

	var payments []models.Payment
	query.Order("created_at desc").Find(&payments)
	utils.JSONResponse(w, http.StatusOK, true, "Payments fetched", payments)
}

// ==================== GET PAYMENT BY ID ====================
func GetPaymentByID(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]

	var payment models.Payment
	if err := db.DB.
		Preload("Student.User").
		Preload("Invoice").
		First(&payment, id).Error; err != nil {
		utils.ErrorResponse(w, http.StatusNotFound, "Payment not found")
		return
	}

	utils.JSONResponse(w, http.StatusOK, true, "Payment fetched", payment)
}
