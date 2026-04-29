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

// ==================== SUBMIT APPLICATION ====================
func SubmitApplication(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)

	var req struct {
		ProgramID      uint       `json:"program_id"`
		CollegeID      uint       `json:"college_id"`
		FirstName      string     `json:"first_name"`
		LastName       string     `json:"last_name"`
		DOB            *time.Time `json:"dob"`
		Gender         string     `json:"gender"`
		Phone          string     `json:"phone"`
		Email          string     `json:"email"`
		Address        string     `json:"address"`
		City           string     `json:"city"`
		State          string     `json:"state"`
		PinCode        string     `json:"pin_code"`
		PreviousSchool string     `json:"previous_school"`
		PreviousGrade  string     `json:"previous_grade"`
		Statement      string     `json:"statement"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Find student profile
	var student models.Student
	if err := db.DB.Where("user_id = ?", claims.UserID).First(&student).Error; err != nil {
		utils.ErrorResponse(w, http.StatusNotFound, "Student profile not found")
		return
	}

	// Check if already applied for this course
	var existingApp models.Application
	if err := db.DB.Where("student_id = ? AND program_id = ?", student.ID, req.ProgramID).
		First(&existingApp).Error; err == nil {
		utils.ErrorResponse(w, http.StatusConflict, "You have already applied for this program")
		return
	}

	now := time.Now()
	app := models.Application{
		StudentID:      student.ID,
		ProgramID:      req.ProgramID,
		CollegeID:      &req.CollegeID,
		Status:         models.ApplicationSubmitted,
		FirstName:      req.FirstName,
		LastName:       req.LastName,
		DOB:            req.DOB,
		Gender:         req.Gender,
		Phone:          req.Phone,
		Email:          req.Email,
		Address:        req.Address,
		City:           req.City,
		State:          req.State,
		Pincode:        req.PinCode,
		PreviousSchool: req.PreviousSchool,
		PreviousGrade:  req.PreviousGrade,
		Statement:      req.Statement,
		SubmittedAt:    &now,
	}

	if err := db.DB.Create(&app).Error; err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to submit application")
		return
	}

	// Update student profile
	db.DB.Model(&student).Updates(map[string]interface{}{
		"first_name": req.FirstName, "last_name": req.LastName,
		"dob": req.DOB, "gender": req.Gender, "phone": req.Phone,
		"address": req.Address, "city": req.City, "state": req.State, "pin_code": req.PinCode,
		"previous_school": req.PreviousSchool, "previous_grade": req.PreviousGrade,
		"program_id": req.ProgramID, "college_id": req.CollegeID, "status": "applied",
	})

	// Notify student
	db.DB.Create(&models.Notification{
		UserID:  claims.UserID,
		Title:   "Application Submitted",
		Message: "Your application has been submitted successfully and is under review.",
		Type:    "success",
	})

	utils.JSONResponse(w, http.StatusCreated, true, "Application submitted successfully", app)
}

// ==================== GET MY APPLICATIONS (Student) ====================
func GetMyApplications(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)

	var student models.Student
	if err := db.DB.Where("user_id = ?", claims.UserID).First(&student).Error; err != nil {
		utils.ErrorResponse(w, http.StatusNotFound, "Student profile not found")
		return
	}

	var applications []models.Application
	db.DB.Preload("Program").Preload("College").Preload("Documents").
		Where("student_id = ?", student.ID).Find(&applications)

	utils.JSONResponse(w, http.StatusOK, true, "Applications fetched", applications)
}

// ==================== GET ALL APPLICATIONS (Admin/College Admin) ====================
func GetAllApplications(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	status := r.URL.Query().Get("status")

	query := db.DB.Preload("Student.User").Preload("Program").Preload("College")

	if claims.Role == models.RoleCollegeAdmin && claims.CollegeID != nil {
		query = query.Where("college_id = ?", *claims.CollegeID)
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}

	var applications []models.Application
	query.Find(&applications)
	utils.JSONResponse(w, http.StatusOK, true, "Applications fetched", applications)
}

// ==================== REVIEW APPLICATION ====================
func ReviewApplication(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	id := mux.Vars(r)["id"]

	var req struct {
		Status          string `json:"status"` // shortlisted, rejected, under_review
		RejectionReason string `json:"rejection_reason"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	var app models.Application
	if err := db.DB.Preload("Student").First(&app, id).Error; err != nil {
		utils.ErrorResponse(w, http.StatusNotFound, "Application not found")
		return
	}

	now := time.Now()
	updates := map[string]interface{}{
		"status":      req.Status,
		"reviewed_by": claims.UserID,
		"reviewed_at": now,
	}

	if req.Status == models.ApplicationRejected {
		updates["rejection_reason"] = req.RejectionReason
	}
	if req.Status == models.ApplicationShortlisted {
		updates["shortlisted_at"] = now
		// Update student status
		db.DB.Model(&models.Student{}).Where("id = ?", app.StudentID).Update("status", "shortlisted")
		// Notify student
		db.DB.Create(&models.Notification{
			UserID:  app.Student.UserID,
			Title:   "Application Shortlisted! 🎉",
			Message: "Congratulations! Your application has been shortlisted. Please visit the college to submit your documents.",
			Type:    "success",
		})
		go utils.SendNotificationEmail(app.Email, "Application Shortlisted!", "Your application has been shortlisted. Please visit the college to submit your documents.")
	}

	if req.Status == models.ApplicationRejected {
		db.DB.Create(&models.Notification{
			UserID:  app.Student.UserID,
			Title:   "Application Status Update",
			Message: "Your application status has been updated. Reason: " + req.RejectionReason,
			Type:    "warning",
		})
	}

	db.DB.Model(&app).Updates(updates)
	utils.JSONResponse(w, http.StatusOK, true, "Application reviewed", app)
}

// ==================== ENROLL STUDENT (Generate Enrollment Number) ====================
func EnrollStudent(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"] // application ID

	var app models.Application
	if err := db.DB.Preload("Student").First(&app, id).Error; err != nil {
		utils.ErrorResponse(w, http.StatusNotFound, "Application not found")
		return
	}

	if app.Status != models.ApplicationShortlisted {
		utils.ErrorResponse(w, http.StatusBadRequest, "Only shortlisted applications can be enrolled")
		return
	}

	enrollmentNum := utils.GenerateEnrollmentNumber()
	now := time.Now()

	// Update application
	db.DB.Model(&app).Updates(map[string]interface{}{
		"status":      models.ApplicationEnrolled,
		"enrolled_at": now,
	})

	// Update student
	db.DB.Model(&models.Student{}).Where("id = ?", app.StudentID).Updates(map[string]interface{}{
		"status":            "enrolled",
		"enrollment_number": enrollmentNum,
		"enrollment_date":   now,
	})

	// Notify student
	db.DB.Create(&models.Notification{
		UserID:  app.Student.UserID,
		Title:   "Enrollment Confirmed! 🎓",
		Message: "Congratulations! You have been enrolled. Your Enrollment Number is: " + enrollmentNum,
		Type:    "success",
	})

	go utils.SendNotificationEmail(app.Email, "Enrollment Confirmed!", "Your enrollment number is: "+enrollmentNum)

	utils.JSONResponse(w, http.StatusOK, true, "Student enrolled successfully", map[string]interface{}{
		"enrollment_number": enrollmentNum,
		"application_id":    app.ID,
	})
}

// ==================== UPLOAD DOCUMENT ====================
func UploadDocument(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)

	var req struct {
		ApplicationID *uint  `json:"application_id"`
		DocumentType  string `json:"document_type"`
		FileName      string `json:"file_name"`
		FileURL       string `json:"file_url"`
		FileSize      int64  `json:"file_size"`
		MimeType      string `json:"mime_type"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	var student models.Student
	if err := db.DB.Where("user_id = ?", claims.UserID).First(&student).Error; err != nil {
		utils.ErrorResponse(w, http.StatusNotFound, "Student not found")
		return
	}

	doc := models.Document{
		StudentID:     student.ID,
		ApplicationID: req.ApplicationID,
		DocumentType:  req.DocumentType,
		FileName:      req.FileName,
		FileURL:       req.FileURL,
		FileSize:      req.FileSize,
		MimeType:      req.MimeType,
		IsVerified:    false,
	}
	if err := db.DB.Create(&doc).Error; err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to upload document")
		return
	}
	utils.JSONResponse(w, http.StatusCreated, true, "Document uploaded successfully", doc)
}

// ==================== VERIFY DOCUMENT (College Admin) ====================
func VerifyDocument(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	id := mux.Vars(r)["id"]

	var req struct {
		IsVerified bool   `json:"is_verified"`
		Remarks    string `json:"remarks"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	var doc models.Document
	if err := db.DB.First(&doc, id).Error; err != nil {
		utils.ErrorResponse(w, http.StatusNotFound, "Document not found")
		return
	}

	now := time.Now()
	db.DB.Model(&doc).Updates(map[string]interface{}{
		"is_verified": req.IsVerified,
		"verified_by": claims.UserID,
		"verified_at": now,
		"remarks":     req.Remarks,
	})

	utils.JSONResponse(w, http.StatusOK, true, "Document verification updated", doc)
}

// ==================== GET DOCUMENTS (Student/Admin) ====================
func GetDocuments(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)

	var docs []models.Document
	query := db.DB

	if claims.Role == models.RoleStudent {
		var student models.Student
		if err := db.DB.Where("user_id = ?", claims.UserID).First(&student).Error; err != nil {
			utils.ErrorResponse(w, http.StatusNotFound, "Student not found")
			return
		}
		query = query.Where("student_id = ?", student.ID)
	}

	query.Find(&docs)
	utils.JSONResponse(w, http.StatusOK, true, "Documents fetched", docs)
}
