package handlers

import (
	"encoding/json"
	"fmt"
	"math/rand"
	"net/http"
	"time"
	"university-erp-backend/internal/db"
	"university-erp-backend/internal/middleware"
	"university-erp-backend/internal/models"
	"university-erp-backend/internal/utils"

	"github.com/gorilla/mux"
	"golang.org/x/crypto/bcrypt"
)

// ==================== PUBLIC: SUBMIT APPLICATION ====================
func PublicSubmitApplication(w http.ResponseWriter, r *http.Request) {
	var req models.Applicant
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Generate Application ID (APP-YYYY-XXXX)
	year := time.Now().Year()
	randSuffix := rand.Intn(9000) + 1000 // 4 digits
	appID := fmt.Sprintf("APP-%d-%04d", year, randSuffix)

	now := time.Now()
	req.ApplicationID = appID
	req.Status = "submitted"
	req.SubmittedAt = &now

	if err := db.DB.Create(&req).Error; err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to submit application")
		return
	}

	// Notify admins (if real-time is set up) or email student
	go utils.SendNotificationEmail(req.Email, "Application Submitted successfully", "Your application ID is: "+appID)

	utils.JSONResponse(w, http.StatusCreated, true, "Application submitted successfully", map[string]interface{}{
		"application_id": appID,
	})
}

// ==================== PUBLIC: CHECK STATUS ====================
func PublicCheckApplicationStatus(w http.ResponseWriter, r *http.Request) {
	appID := r.URL.Query().Get("application_id")
	email := r.URL.Query().Get("email")

	if appID == "" || email == "" {
		utils.ErrorResponse(w, http.StatusBadRequest, "Application ID and Email are required")
		return
	}

	var applicant models.Applicant
	if err := db.DB.Preload("Program").Preload("College").Where("application_id = ? AND email = ?", appID, email).First(&applicant).Error; err != nil {
		utils.ErrorResponse(w, http.StatusNotFound, "Application not found or email mismatch")
		return
	}

	utils.JSONResponse(w, http.StatusOK, true, "Application status fetched", applicant)
}

// ==================== GET ALL APPLICATIONS (Admin/College Admin) ====================
func GetAllApplications(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	status := r.URL.Query().Get("status")

	query := db.DB.Preload("Program").Preload("College")

	if claims.Role == models.RoleCollegeAdmin && claims.CollegeID != nil {
		query = query.Where("college_id = ?", *claims.CollegeID)
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}

	var applicants []models.Applicant
	query.Order("created_at desc").Find(&applicants)
	utils.JSONResponse(w, http.StatusOK, true, "Applications fetched", applicants)
}

// ==================== SHORTLIST APPLICATION (University Admin) ====================
func ShortlistApplication(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	id := mux.Vars(r)["id"] // Applicant ID

	var app models.Applicant
	if err := db.DB.First(&app, id).Error; err != nil {
		utils.ErrorResponse(w, http.StatusNotFound, "Application not found")
		return
	}

	now := time.Now()
	db.DB.Model(&app).Updates(map[string]interface{}{
		"status":         "shortlisted",
		"reviewed_by":    claims.UserID,
		"reviewed_at":    now,
		"shortlisted_at": now,
	})

	go utils.SendNotificationEmail(app.Email, "Application Shortlisted! 🎉", "Congratulations! Your application has been shortlisted. Please visit the college to submit your documents.")

	utils.JSONResponse(w, http.StatusOK, true, "Application shortlisted", app)
}

// ==================== REJECT APPLICATION (University/College Admin) ====================
func RejectApplication(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	id := mux.Vars(r)["id"]

	var req struct {
		Reason string `json:"reason"`
	}
	json.NewDecoder(r.Body).Decode(&req)

	var app models.Applicant
	if err := db.DB.First(&app, id).Error; err != nil {
		utils.ErrorResponse(w, http.StatusNotFound, "Application not found")
		return
	}

	now := time.Now()
	db.DB.Model(&app).Updates(map[string]interface{}{
		"status":           "rejected",
		"reviewed_by":      claims.UserID,
		"reviewed_at":      now,
		"rejection_reason": req.Reason,
	})

	go utils.SendNotificationEmail(app.Email, "Application Status Update", "Your application status has been updated. Reason: "+req.Reason)

	utils.JSONResponse(w, http.StatusOK, true, "Application rejected", app)
}

// ==================== ENROLL STUDENT (College Admin) ====================
func EnrollStudent(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"] // Applicant ID

	var app models.Applicant
	if err := db.DB.Preload("Program.Department").First(&app, id).Error; err != nil {
		utils.ErrorResponse(w, http.StatusNotFound, "Application not found")
		return
	}

	if app.Status != "shortlisted" {
		utils.ErrorResponse(w, http.StatusBadRequest, "Only shortlisted applications can be enrolled")
		return
	}

	// 1. Generate username and password
	enrollmentNum := utils.GenerateEnrollmentNumber()
	password := "Student@123"
	hashed, _ := bcrypt.GenerateFromPassword([]byte(password), 10)

	// 2. Create User account
	var role models.Role
	db.DB.Where("role_name = ?", models.RoleStudent).First(&role)

	user := models.User{
		Username:     enrollmentNum,
		Email:        app.Email,
		PasswordHash: string(hashed),
		RoleID:       role.ID,
		IsActive:     true,
	}

	tx := db.DB.Begin()

	if err := tx.Create(&user).Error; err != nil {
		tx.Rollback()
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to create user account")
		return
	}

	// 3. Create Student record
	student := models.Student{
		UserID:          user.ID,
		ProgramID:       &app.ProgramID,
		RollNumber:      enrollmentNum,
		UniversityRegNo: "REG" + enrollmentNum,
		FirstName:       app.FirstName,
		LastName:        app.LastName,
		PersonalEmail:   app.Email,
		Phone:           app.Phone,
		Gender:          app.Gender,
		DOB:             app.DOB,
		Category:        app.Category,
		City:            app.City,
		State:           app.State,
		Pincode:         app.Pincode,
		Address:         app.Address,
		AdmissionYear:   time.Now().Year(),
		CurrentSemester: 1,
		IsActive:        true,
	}

	if err := tx.Create(&student).Error; err != nil {
		tx.Rollback()
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to create student profile")
		return
	}

	// 4. Update Applicant
	now := time.Now()
	if err := tx.Model(&app).Updates(map[string]interface{}{
		"status":      "enrolled",
		"enrolled_at": now,
		"student_id":  student.ID,
	}).Error; err != nil {
		tx.Rollback()
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to update applicant")
		return
	}

	tx.Commit()

	// 5. Notify student
	msg := fmt.Sprintf("Congratulations! You have been enrolled.\nYour Username: %s\nPassword: %s\nPlease login to the student portal.", user.Username, password)
	go utils.SendNotificationEmail(app.Email, "Enrollment Confirmed & Login Credentials 🎓", msg)

	utils.JSONResponse(w, http.StatusOK, true, "Student enrolled successfully", map[string]interface{}{
		"enrollment_number": enrollmentNum,
		"username":          user.Username,
		"password":          password, // Usually wouldn't return password, but requested for admin view
	})
}
