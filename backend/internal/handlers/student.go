package handlers

import (
	"encoding/json"
	"net/http"
	"university-erp-backend/internal/db"
	"university-erp-backend/internal/middleware"
	"university-erp-backend/internal/models"
	"university-erp-backend/internal/utils"
)

// ==================== STUDENT DASHBOARD ====================
func StudentDashboard(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)

	var student models.Student
	if err := db.DB.
		Preload("User").
		Preload("Program").
		Preload("College").
		Where("user_id = ?", claims.UserID).
		First(&student).Error; err != nil {
		utils.ErrorResponse(w, http.StatusNotFound, "Student profile not found")
		return
	}

	// Applications
	var applications []models.Application
	db.DB.Preload("Program").Preload("College").
		Where("student_id = ?", student.ID).
		Find(&applications)

	// Payments
	var payments []models.Payment
	db.DB.Preload("Invoice").
		Where("student_id = ?", student.ID).
		Find(&payments)

	// Results
	var results []models.Result
	db.DB.Preload("Exam").
		Where("student_id = ? AND is_published = true", student.ID).
		Find(&results)

	// Pending Fees
	var pendingFees []models.StudentFeeInvoice
	// Get all pending invoices for student
	db.DB.Where("student_id = ? AND status != ?", student.ID, "Paid").Find(&pendingFees)

	// Notifications
	var notifications []models.Notification
	db.DB.Where("user_id = ? AND is_read = false", claims.UserID).
		Order("created_at desc").Limit(10).
		Find(&notifications)

	utils.JSONResponse(w, http.StatusOK, true, "Student dashboard", map[string]interface{}{
		"student":       student,
		"applications":  applications,
		"payments":      payments,
		"results":       results,
		"pending_fees":  pendingFees,
		"notifications": notifications,
	})
}

// ==================== GET STUDENT PROFILE ====================
func GetStudentProfile(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)

	var student models.Student
	if err := db.DB.
		Preload("User").
		Preload("Program").
		Preload("College").
		Where("user_id = ?", claims.UserID).
		First(&student).Error; err != nil {
		utils.ErrorResponse(w, http.StatusNotFound, "Student profile not found")
		return
	}

	utils.JSONResponse(w, http.StatusOK, true, "Profile fetched", student)
}

// ==================== UPDATE STUDENT PROFILE ====================
func UpdateStudentProfile(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)

	var student models.Student
	if err := db.DB.Where("user_id = ?", claims.UserID).First(&student).Error; err != nil {
		utils.ErrorResponse(w, http.StatusNotFound, "Student profile not found")
		return
	}

	var req struct {
		FirstName      string `json:"first_name"`
		LastName       string `json:"last_name"`
		Phone          string `json:"phone"`
		Address        string `json:"address"`
		City           string `json:"city"`
		State          string `json:"state"`
		PinCode        string `json:"pin_code"`
		PreviousSchool string `json:"previous_school"`
		PreviousGrade  string `json:"previous_grade"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	db.DB.Model(&student).Updates(map[string]interface{}{
		"first_name":      req.FirstName,
		"last_name":       req.LastName,
		"phone":           req.Phone,
		"address":         req.Address,
		"city":            req.City,
		"state":           req.State,
		"pin_code":        req.PinCode,
		"previous_school": req.PreviousSchool,
		"previous_grade":  req.PreviousGrade,
	})

	utils.JSONResponse(w, http.StatusOK, true, "Profile updated", student)
}

// ==================== GET STUDENT RESULTS ====================
func GetStudentResults(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)

	var student models.Student
	if err := db.DB.Where("user_id = ?", claims.UserID).First(&student).Error; err != nil {
		utils.ErrorResponse(w, http.StatusNotFound, "Student not found")
		return
	}

	var results []models.Result
	db.DB.Preload("Exam.Program").Preload("Exam.Subject").
		Where("student_id = ? AND is_published = true", student.ID).
		Find(&results)

	utils.JSONResponse(w, http.StatusOK, true, "Results fetched", results)
}

// ==================== GET NOTIFICATIONS ====================
func GetNotifications(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)

	var notifications []models.Notification
	db.DB.Where("user_id = ?", claims.UserID).
		Order("created_at desc").
		Find(&notifications)

	utils.JSONResponse(w, http.StatusOK, true, "Notifications fetched", notifications)
}

// ==================== MARK NOTIFICATION READ ====================
func MarkNotificationRead(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)

	db.DB.Model(&models.Notification{}).
		Where("user_id = ?", claims.UserID).
		Update("is_read", true)

	utils.JSONResponse(w, http.StatusOK, true, "All notifications marked as read", nil)
}
