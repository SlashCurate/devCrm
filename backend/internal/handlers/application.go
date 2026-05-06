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

	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"golang.org/x/crypto/bcrypt"
	
)

// ==================== PUBLIC: SUBMIT APPLICATION ====================
func PublicSubmitApplication(w http.ResponseWriter, r *http.Request) {
	var req struct {
		models.Applicant
		CycleID uint   `json:"cycle_id"`
		UserID  string `json:"user_id"` // Optional: for authenticated users
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate required fields
	if req.Email == "" || req.FirstName == "" || req.LastName == "" {
		utils.ErrorResponse(w, http.StatusBadRequest, "Email, First Name, and Last Name are required")
		return
	}

	// Check if admission cycle is provided
	if req.CycleID == 0 && req.AdmissionCycleID == nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Admission cycle is required")
		return
	}
	
	cycleID := req.CycleID
	if cycleID == 0 && req.AdmissionCycleID != nil {
		cycleID = *req.AdmissionCycleID
	}

	// Verify admission cycle is active and open
	var cycle models.AdmissionCycle
	if err := db.DB.First(&cycle, cycleID).Error; err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid admission cycle")
		return
	}

	if !cycle.IsOpen() {
		utils.ErrorResponse(w, http.StatusBadRequest, "Admissions are currently closed for this cycle")
		return
	}

	// Check if max applications limit reached
	if cycle.MaxApplications > 0 {
		var count int64
		db.DB.Model(&models.Applicant{}).Where("admission_cycle_id = ?", cycle.ID).Count(&count)
		if int(count) >= cycle.MaxApplications {
			utils.ErrorResponse(w, http.StatusBadRequest, "Application limit reached for this cycle")
			return
		}
	}

	// Check if user already has an application for this cycle (by user_id or email)
	var existingApp models.Applicant
	var checkErr error
	
	if req.UserID != "" {
		// Check by user_id for authenticated users
		checkErr = db.DB.Where("user_id::text = ? AND admission_cycle_id = ? AND status != ?", 
			req.UserID, cycle.ID, models.ApplicationDraft).First(&existingApp).Error
	} else {
		// Check by email for legacy/public users
		checkErr = db.DB.Where("email = ? AND admission_cycle_id = ? AND status != ?", 
			req.Email, cycle.ID, models.ApplicationDraft).First(&existingApp).Error
	}
	
	if checkErr == nil {
		utils.ErrorResponse(w, http.StatusConflict, "You already have an application for this admission cycle")
		return
	}

	// Check if draft exists and update it
	var draft models.Applicant
	var err error
	
	if req.UserID != "" {
		// Find draft by user_id
		err = db.DB.Where("user_id::text = ? AND admission_cycle_id = ? AND status = ?", 
			req.UserID, cycle.ID, models.ApplicationDraft).First(&draft).Error
	} else {
		// Find draft by email
		err = db.DB.Where("email = ? AND admission_cycle_id = ? AND status = ?", 
			req.Email, cycle.ID, models.ApplicationDraft).First(&draft).Error
	}

	// Generate Application ID (APP-YYYY-XXXX)
	year := time.Now().Year()
	randSuffix := rand.Intn(9000) + 1000 // 4 digits
	appID := fmt.Sprintf("APP-%d-%04d", year, randSuffix)

	now := time.Now()

	if err == nil {
		// Update draft to submitted
		draft.ApplicationID = appID
		draft.Status = models.ApplicationSubmitted
		draft.SubmittedAt = &now
		draft.FirstName = req.FirstName
		draft.LastName = req.LastName
		draft.Phone = req.Phone
		draft.DOB = req.DOB
		draft.Gender = req.Gender
		draft.Category = req.Category
		draft.State = req.State
		draft.City = req.City
		draft.Address = req.Address
		draft.Pincode = req.Pincode
		draft.PreviousSchool = req.PreviousSchool
		draft.PreviousGrade = req.PreviousGrade
		draft.Statement = req.Statement
		draft.ApplicationFee = cycle.ApplicationFee
		draft.AdmissionFee = cycle.AdmissionFee
		
		if err := db.DB.Save(&draft).Error; err != nil {
			utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to submit application")
			return
		}
	} else {
		// Create new application
		req.Applicant.ApplicationID = appID
		req.Applicant.AdmissionCycleID = &cycleID
		req.Applicant.Status = models.ApplicationSubmitted
		req.Applicant.SubmittedAt = &now
		req.Applicant.ApplicationFee = cycle.ApplicationFee
		req.Applicant.AdmissionFee = cycle.AdmissionFee
		
		// Set user_id if provided (authenticated applicant)
		if req.UserID != "" {
			uid, parseErr := uuid.Parse(req.UserID)
			if parseErr == nil {
				req.Applicant.UserID = &uid
			}
		}

		if err := db.DB.Create(&req.Applicant).Error; err != nil {
			utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to submit application")
			return
		}
	}

	// Notify admins (if real-time is set up) or email student
	go utils.SendNotificationEmail(req.Email, 
		"Application Submitted Successfully", 
		fmt.Sprintf("Your application ID is: %s\n\nStatus: Submitted\nNext Step: Complete payment of ₹%.2f to proceed with your application.", 
			appID, cycle.ApplicationFee))

	utils.JSONResponse(w, http.StatusCreated, true, "Application submitted successfully", map[string]interface{}{
		"application_id":    appID,
		"status":           models.ApplicationSubmitted,
		"application_fee":  cycle.ApplicationFee,
		"admission_fee":    cycle.AdmissionFee,
		"requires_payment": cycle.ApplicationFee > 0,
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

// ==================== ADMISSION CYCLE MANAGEMENT ====================

// ListAdmissionCycles - Get all admission cycles (public)
func ListAdmissionCycles(w http.ResponseWriter, r *http.Request) {
	now := time.Now()
	
	var cycles []models.AdmissionCycle
	query := db.DB.Preload("AcademicYear").Preload("Program").Preload("College")
	
	// For public access, only show published and currently open cycles
	query = query.Where("is_published = ? AND is_active = ?", true, true).
		Where("application_start_date <= ? AND application_end_date >= ?", now, now)
	
	if err := query.Find(&cycles).Error; err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to fetch admission cycles")
		return
	}
	
	utils.JSONResponse(w, http.StatusOK, true, "Admission cycles fetched", cycles)
}

// GetActiveAdmissionCycle - Get currently active cycle for a program (public)
// Real-world: Returns cycle with status (open/upcoming/closed) and days remaining
func GetActiveAdmissionCycle(w http.ResponseWriter, r *http.Request) {
	programID := r.URL.Query().Get("program_id")
	collegeID := r.URL.Query().Get("college_id")
	
	now := time.Now()
	var cycles []models.AdmissionCycle
	
	query := db.DB.Preload("AcademicYear").Preload("Program").Preload("College").
		Where("is_published = ?", true).
		Where("application_end_date >= ?", now) // Only show cycles that haven't ended
	
	if programID != "" {
		query = query.Where("program_id = ? OR program_id IS NULL", programID)
	}
	if collegeID != "" {
		query = query.Where("college_id = ? OR college_id IS NULL", collegeID)
	}
	
	if err := query.Find(&cycles).Error; err != nil {
		utils.ErrorResponse(w, http.StatusNotFound, "No admission cycle found")
		return
	}
	
	// Add computed status to each cycle
	var result []map[string]interface{}
	for _, cycle := range cycles {
		status := cycle.GetCycleStatus()
		daysUntilClose := cycle.DaysUntilClose()
		
		cycleData := map[string]interface{}{
			"id":                    cycle.ID,
			"name":                  cycle.Name,
			"description":           cycle.Description,
			"application_start_date": cycle.ApplicationStartDate,
			"application_end_date":   cycle.ApplicationEndDate,
			"application_fee":       cycle.ApplicationFee,
			"admission_fee":         cycle.AdmissionFee,
			"status":                status, // "open", "upcoming", "closed"
			"days_until_close":      daysUntilClose,
			"is_open":               cycle.IsOpen(),
			"program":               cycle.Program,
			"college":               cycle.College,
			"academic_year":         cycle.AcademicYear,
		}
		result = append(result, cycleData)
	}
	
	// Find the currently open cycle for immediate application
	var openCycle *models.AdmissionCycle
	for i := range cycles {
		if cycles[i].IsOpen() {
			openCycle = &cycles[i]
			break
		}
	}
	
	utils.JSONResponse(w, http.StatusOK, true, "Admission cycles found", map[string]interface{}{
		"cycles":       result,
		"has_open":     openCycle != nil,
		"active_cycle": openCycle,
	})
}

// ListAllAdmissionCycles - Admin: Get all cycles including inactive
func ListAllAdmissionCycles(w http.ResponseWriter, r *http.Request) {
	var cycles []models.AdmissionCycle
	if err := db.DB.Preload("AcademicYear").Preload("Program").Preload("College").
		Order("created_at desc").Find(&cycles).Error; err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to fetch admission cycles")
		return
	}
	utils.JSONResponse(w, http.StatusOK, true, "Admission cycles fetched", cycles)
}

// CreateAdmissionCycle - Admin: Create new admission cycle
func CreateAdmissionCycle(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	
	var req struct {
		Name                 string  `json:"name"`
		Description          string  `json:"description"`
		AcademicYearID       uint    `json:"academic_year_id"`
		ApplicationStartDate string  `json:"application_start_date"` // ISO format
		ApplicationEndDate   string  `json:"application_end_date"`
		ProgramID            *uint   `json:"program_id"`
		CollegeID            *uint   `json:"college_id"`
		ApplicationFee       float64 `json:"application_fee"`
		AdmissionFee         float64 `json:"admission_fee"`
		MaxApplications      int     `json:"max_applications"`
		IsPublished          bool    `json:"is_published"`
	}
	
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	
	startDate, err := time.Parse(time.RFC3339, req.ApplicationStartDate)
	if err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid start date format")
		return
	}
	
	endDate, err := time.Parse(time.RFC3339, req.ApplicationEndDate)
	if err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid end date format")
		return
	}
	
	cycle := models.AdmissionCycle{
		Name:                 req.Name,
		Description:          req.Description,
		AcademicYearID:       req.AcademicYearID,
		ApplicationStartDate: startDate,
		ApplicationEndDate:   endDate,
		ProgramID:            req.ProgramID,
		CollegeID:            req.CollegeID,
		ApplicationFee:       req.ApplicationFee,
		AdmissionFee:         req.AdmissionFee,
		MaxApplications:      req.MaxApplications,
		IsPublished:          req.IsPublished,
		IsActive:             true,
		CreatedBy:            claims.UserID,
	}
	
	if err := db.DB.Create(&cycle).Error; err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to create admission cycle")
		return
	}
	
	utils.JSONResponse(w, http.StatusCreated, true, "Admission cycle created", cycle)
}

// UpdateAdmissionCycle - Admin: Update admission cycle
func UpdateAdmissionCycle(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	
	var cycle models.AdmissionCycle
	if err := db.DB.First(&cycle, id).Error; err != nil {
		utils.ErrorResponse(w, http.StatusNotFound, "Admission cycle not found")
		return
	}
	
	var req struct {
		Name                 string  `json:"name"`
		Description          string  `json:"description"`
		ApplicationStartDate string  `json:"application_start_date"`
		ApplicationEndDate   string  `json:"application_end_date"`
		ApplicationFee       float64 `json:"application_fee"`
		AdmissionFee         float64 `json:"admission_fee"`
		MaxApplications      int     `json:"max_applications"`
		IsActive             bool    `json:"is_active"`
		IsPublished          bool    `json:"is_published"`
	}
	
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	
	updates := map[string]interface{}{
		"name":            req.Name,
		"description":     req.Description,
		"application_fee": req.ApplicationFee,
		"admission_fee":   req.AdmissionFee,
		"max_applications": req.MaxApplications,
		"is_active":       req.IsActive,
		"is_published":    req.IsPublished,
	}
	
	if req.ApplicationStartDate != "" {
		startDate, err := time.Parse(time.RFC3339, req.ApplicationStartDate)
		if err == nil {
			updates["application_start_date"] = startDate
		}
	}
	if req.ApplicationEndDate != "" {
		endDate, err := time.Parse(time.RFC3339, req.ApplicationEndDate)
		if err == nil {
			updates["application_end_date"] = endDate
		}
	}
	
	if err := db.DB.Model(&cycle).Updates(updates).Error; err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to update admission cycle")
		return
	}
	
	utils.JSONResponse(w, http.StatusOK, true, "Admission cycle updated", cycle)
}

// ToggleAdmissionCycle - Admin: Toggle cycle active/published status
func ToggleAdmissionCycle(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	action := r.URL.Query().Get("action") // "open", "close", "publish", "unpublish"
	
	var cycle models.AdmissionCycle
	if err := db.DB.First(&cycle, id).Error; err != nil {
		utils.ErrorResponse(w, http.StatusNotFound, "Admission cycle not found")
		return
	}
	
	switch action {
	case "open":
		cycle.IsActive = true
	case "close":
		cycle.IsActive = false
	case "publish":
		cycle.IsPublished = true
	case "unpublish":
		cycle.IsPublished = false
	default:
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid action")
		return
	}
	
	if err := db.DB.Save(&cycle).Error; err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to update cycle")
		return
	}
	
	utils.JSONResponse(w, http.StatusOK, true, "Admission cycle updated", cycle)
}

// DeleteAdmissionCycle - Admin: Delete admission cycle
func DeleteAdmissionCycle(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	
	var cycle models.AdmissionCycle
	if err := db.DB.First(&cycle, id).Error; err != nil {
		utils.ErrorResponse(w, http.StatusNotFound, "Admission cycle not found")
		return
	}
	
	// Check if there are any applications associated
	var count int64
	db.DB.Model(&models.Applicant{}).Where("admission_cycle_id = ?", cycle.ID).Count(&count)
	if count > 0 {
		utils.ErrorResponse(w, http.StatusBadRequest, "Cannot delete cycle with existing applications")
		return
	}
	
	if err := db.DB.Delete(&cycle).Error; err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to delete admission cycle")
		return
	}
	
	utils.JSONResponse(w, http.StatusOK, true, "Admission cycle deleted", nil)
}

// ==================== APPLICANT PAYMENT & DRAFT MANAGEMENT ====================

// GetApplicationDraft - Get draft application data by application_id, user_id, or email
func GetApplicationDraft(w http.ResponseWriter, r *http.Request) {
	// Support application_id, user_id, or email-based lookup
	applicationID := r.URL.Query().Get("application_id")
	userID := r.URL.Query().Get("user_id")
	email := r.URL.Query().Get("email")
	cycleID := r.URL.Query().Get("cycle_id")
	
	if applicationID == "" && userID == "" && email == "" {
		utils.ErrorResponse(w, http.StatusBadRequest, "application_id, user_id, or email is required")
		return
	}
	
	var applicant models.Applicant
	query := db.DB
	
	if applicationID != "" {
		// Application ID based lookup (most secure)
		query = query.Where("application_id = ? AND status = ?", applicationID, models.ApplicationDraft)
	} else if userID != "" {
		// User-based lookup
		query = query.Where("user_id::text = ? AND status = ?", userID, models.ApplicationDraft)
	} else {
		// Legacy email-based lookup
		query = query.Where("email = ? AND status = ?", email, models.ApplicationDraft)
	}
	
	if cycleID != "" {
		query = query.Where("admission_cycle_id = ?", cycleID)
	}
	
	if err := query.Order("updated_at desc").First(&applicant).Error; err != nil {
		// Return empty response if no draft found
		utils.JSONResponse(w, http.StatusOK, true, "No draft found", map[string]interface{}{
			"has_draft": false,
		})
		return
	}
	
	utils.JSONResponse(w, http.StatusOK, true, "Draft found", map[string]interface{}{
		"has_draft":  true,
		"draft_data":   applicant.DraftData,
		"draft_saved_at": applicant.DraftSavedAt,
		"application_id": applicant.ApplicationID,
	})
}

// SaveApplicationDraft - Auto-save draft application (application_id, user_id, or email based)
func SaveApplicationDraft(w http.ResponseWriter, r *http.Request) {
	var req struct {
		ApplicationID  string `json:"application_id"` // Application ID from registration
		UserID         string `json:"user_id"`        // UUID from auth
		Email          string `json:"email"`          // Legacy support
		CycleID        uint   `json:"cycle_id"`
		DraftData      string `json:"draft_data"`     // JSON string
		ProgramID      uint   `json:"program_id"`
		CollegeID      uint   `json:"college_id"`
	}
	
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	
	if req.ApplicationID == "" && req.UserID == "" && req.Email == "" {
		utils.ErrorResponse(w, http.StatusBadRequest, "application_id, user_id, or email is required")
		return
	}
	
	now := time.Now()
	
	// Try to find existing draft
	var applicant models.Applicant
	var err error
	
	if req.ApplicationID != "" {
		// Application ID based lookup (most secure)
		err = db.DB.Where("application_id = ? AND status = ? AND admission_cycle_id = ?", 
			req.ApplicationID, models.ApplicationDraft, req.CycleID).First(&applicant).Error
	} else if req.UserID != "" {
		// User-based lookup
		err = db.DB.Where("user_id::text = ? AND status = ? AND admission_cycle_id = ?", 
			req.UserID, models.ApplicationDraft, req.CycleID).First(&applicant).Error
	} else {
		// Legacy email-based lookup
		err = db.DB.Where("email = ? AND status = ? AND admission_cycle_id = ?", 
			req.Email, models.ApplicationDraft, req.CycleID).First(&applicant).Error
	}
	
	if err != nil {
		// Create new draft
		applicant = models.Applicant{
			AdmissionCycleID: &req.CycleID,
			ProgramID:        req.ProgramID,
			CollegeID:        req.CollegeID,
			AcademicYearID:   1, // Default, will be updated on submit
			Status:           models.ApplicationDraft,
			DraftData:        req.DraftData,
			DraftSavedAt:     &now,
		}
		
		// Set identifiers
		if req.ApplicationID != "" {
			applicant.ApplicationID = req.ApplicationID
		}
		if req.UserID != "" {
			uid, parseErr := uuid.Parse(req.UserID)
			if parseErr == nil {
				applicant.UserID = &uid
			}
		}
		if req.Email != "" {
			applicant.Email = req.Email
		}
		
		if err := db.DB.Create(&applicant).Error; err != nil {
			utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to save draft")
			return
		}
	} else {
		// Update existing draft
		applicant.DraftData = req.DraftData
		applicant.DraftSavedAt = &now
		if req.ProgramID > 0 {
			applicant.ProgramID = req.ProgramID
		}
		if req.CollegeID > 0 {
			applicant.CollegeID = req.CollegeID
		}
		if err := db.DB.Save(&applicant).Error; err != nil {
			utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to update draft")
			return
		}
	}
	
	utils.JSONResponse(w, http.StatusOK, true, "Draft saved", map[string]interface{}{
		"application_id": applicant.ApplicationID,
		"saved_at":       now,
	})
}

// ==================== SEAT MATRIX MANAGEMENT (Admin) ====================

// GetSeatMatrix - Admin: Get seat matrix for a cycle/program
func GetSeatMatrix(w http.ResponseWriter, r *http.Request) {
	cycleID := r.URL.Query().Get("cycle_id")
	programID := r.URL.Query().Get("program_id")
	
	var matrices []models.SeatMatrix
	query := db.DB.Preload("Program").Preload("College")
	
	if cycleID != "" {
		query = query.Where("admission_cycle_id = ?", cycleID)
	}
	if programID != "" {
		query = query.Where("program_id = ?", programID)
	}
	
	if err := query.Find(&matrices).Error; err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to fetch seat matrix")
		return
	}
	
	// Add computed available seats
	var result []map[string]interface{}
	for _, sm := range matrices {
		result = append(result, map[string]interface{}{
			"id":               sm.ID,
			"program":          sm.Program,
			"college":          sm.College,
			"total_seats":      sm.TotalSeats,
			"general":          map[string]int{"total": sm.GeneralSeats, "filled": sm.GeneralFilled, "available": sm.GetAvailableSeats("general")},
			"obc":              map[string]int{"total": sm.OBCSeats, "filled": sm.OBCFilled, "available": sm.GetAvailableSeats("obc")},
			"sc":               map[string]int{"total": sm.SCSeats, "filled": sm.SCFilled, "available": sm.GetAvailableSeats("sc")},
			"st":               map[string]int{"total": sm.STSeats, "filled": sm.STFilled, "available": sm.GetAvailableSeats("st")},
			"ews":              map[string]int{"total": sm.EWSSeats, "filled": sm.EWSFilled, "available": sm.GetAvailableSeats("ews")},
			"management":       map[string]int{"total": sm.ManagementSeats, "filled": sm.ManagementFilled, "available": sm.GetAvailableSeats("management")},
			"total_filled":     sm.GeneralFilled + sm.OBCFilled + sm.SCFilled + sm.STFilled + sm.EWSFilled + sm.ManagementFilled,
			"total_available":  sm.GetAvailableSeats("general") + sm.GetAvailableSeats("obc") + sm.GetAvailableSeats("sc") + sm.GetAvailableSeats("st") + sm.GetAvailableSeats("ews") + sm.GetAvailableSeats("management"),
		})
	}
	
	utils.JSONResponse(w, http.StatusOK, true, "Seat matrix fetched", result)
}

// CreateSeatMatrix - Admin: Create seat matrix for a program
func CreateSeatMatrix(w http.ResponseWriter, r *http.Request) {
	var req struct {
		AdmissionCycleID uint `json:"admission_cycle_id"`
		ProgramID        uint `json:"program_id"`
		CollegeID        uint `json:"college_id"`
		TotalSeats       int  `json:"total_seats"`
		GeneralSeats     int  `json:"general_seats"`
		OBCSeats         int  `json:"obc_seats"`
		SCSeats          int  `json:"sc_seats"`
		STSeats          int  `json:"st_seats"`
		EWSSeats         int  `json:"ews_seats"`
		ManagementSeats  int  `json:"management_seats"`
	}
	
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	
	// Validate: Total should equal sum of category seats
	totalCategories := req.GeneralSeats + req.OBCSeats + req.SCSeats + req.STSeats + req.EWSSeats + req.ManagementSeats
	if totalCategories != req.TotalSeats {
		utils.ErrorResponse(w, http.StatusBadRequest, "Sum of category seats must equal total seats")
		return
	}
	
	matrix := models.SeatMatrix{
		AdmissionCycleID: req.AdmissionCycleID,
		ProgramID:        req.ProgramID,
		CollegeID:        req.CollegeID,
		TotalSeats:       req.TotalSeats,
		GeneralSeats:     req.GeneralSeats,
		OBCSeats:         req.OBCSeats,
		SCSeats:          req.SCSeats,
		STSeats:          req.STSeats,
		EWSSeats:         req.EWSSeats,
		ManagementSeats:  req.ManagementSeats,
	}
	
	if err := db.DB.Create(&matrix).Error; err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to create seat matrix")
		return
	}
	
	utils.JSONResponse(w, http.StatusCreated, true, "Seat matrix created", matrix)
}

// ==================== ADMIN APPLICATION REVIEW ====================

// ListApplicationsForReview - Admin: Get applications for review with filters
func ListApplicationsForReview(w http.ResponseWriter, r *http.Request) {
	status := r.URL.Query().Get("status")
	cycleID := r.URL.Query().Get("cycle_id")
	programID := r.URL.Query().Get("program_id")
	category := r.URL.Query().Get("category")
	
	var applications []models.Applicant
	query := db.DB.Preload("Program").Preload("College").Preload("AdmissionCycle")
	
	if status != "" {
		query = query.Where("status = ?", status)
	} else {
		// Default: show submitted and under review
		query = query.Where("status IN ?", []string{models.ApplicationSubmitted, models.ApplicationUnderReview, models.ApplicationPaymentCompleted})
	}
	
	if cycleID != "" {
		query = query.Where("admission_cycle_id = ?", cycleID)
	}
	if programID != "" {
		query = query.Where("program_id = ?", programID)
	}
	if category != "" {
		query = query.Where("category = ?", category)
	}
	
	if err := query.Order("submitted_at asc").Find(&applications).Error; err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to fetch applications")
		return
	}
	
	utils.JSONResponse(w, http.StatusOK, true, "Applications fetched", applications)
}

// ReviewApplication - Admin: Review and update application status
func ReviewApplication(w http.ResponseWriter, r *http.Request) {
	applicationID := mux.Vars(r)["id"]
	
	var req struct {
		Status          string `json:"status"`           // shortlisted, rejected, document_verification, etc.
		Remarks         string `json:"remarks"`
		RejectionReason string `json:"rejection_reason"`
	}
	
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	
	var applicant models.Applicant
	if err := db.DB.Where("application_id = ?", applicationID).First(&applicant).Error; err != nil {
		utils.ErrorResponse(w, http.StatusNotFound, "Application not found")
		return
	}
	
	now := time.Now()
	updates := map[string]interface{}{
		"status":      req.Status,
		"remarks":     req.Remarks,
		"reviewed_at": &now,
	}
	
	if req.RejectionReason != "" {
		updates["rejection_reason"] = req.RejectionReason
	}
	
	// Set specific timestamp based on status
	switch req.Status {
	case models.ApplicationShortlisted:
		updates["shortlisted_at"] = &now
	case models.ApplicationDocumentVerification:
		updates["documents_verified_at"] = &now
	case models.ApplicationEnrolled:
		updates["enrolled_at"] = &now
	}
	
	if err := db.DB.Model(&applicant).Updates(updates).Error; err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to update application")
		return
	}
	
	// TODO: Send notification to applicant
	// go utils.SendStatusUpdateEmail(applicant.Email, req.Status, req.Remarks)
	
	utils.JSONResponse(w, http.StatusOK, true, "Application status updated", map[string]interface{}{
		"application_id": applicationID,
		"new_status":     req.Status,
		"reviewed_at":    now,
	})
}

// BulkShortlistApplications - Admin: Shortlist multiple applications at once
func BulkShortlistApplications(w http.ResponseWriter, r *http.Request) {
	var req struct {
		ApplicationIDs []string `json:"application_ids"`
		Remarks        string   `json:"remarks"`
	}
	
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	
	now := time.Now()
	var successCount, failCount int
	
	for _, appID := range req.ApplicationIDs {
		result := db.DB.Model(&models.Applicant{}).
			Where("application_id = ? AND status IN ?", appID, []string{models.ApplicationSubmitted, models.ApplicationUnderReview, models.ApplicationPaymentCompleted}).
			Updates(map[string]interface{}{
				"status":        models.ApplicationShortlisted,
				"remarks":       req.Remarks,
				"reviewed_at":   &now,
				"shortlisted_at": &now,
			})
		
		if result.Error != nil || result.RowsAffected == 0 {
			failCount++
		} else {
			successCount++
		}
	}
	
	utils.JSONResponse(w, http.StatusOK, true, "Bulk shortlist completed", map[string]interface{}{
		"total":   len(req.ApplicationIDs),
		"success": successCount,
		"failed":  failCount,
	})
}

// GetApplicationStatistics - Admin: Get admission statistics for dashboard
func GetApplicationStatistics(w http.ResponseWriter, r *http.Request) {
	cycleID := r.URL.Query().Get("cycle_id")
	
	// Base query
	baseQuery := db.DB.Model(&models.Applicant{})
	if cycleID != "" {
		baseQuery = baseQuery.Where("admission_cycle_id = ?", cycleID)
	}
	
	// Count by status
	var stats struct {
		Total           int64 `json:"total"`
		Draft           int64 `json:"draft"`
		Submitted       int64 `json:"submitted"`
		PaymentPending  int64 `json:"payment_pending"`
		UnderReview     int64 `json:"under_review"`
		Shortlisted     int64 `json:"shortlisted"`
		Rejected        int64 `json:"rejected"`
		Enrolled        int64 `json:"enrolled"`
	}
	
	baseQuery.Count(&stats.Total)
	db.DB.Model(&models.Applicant{}).Where("status = ?", models.ApplicationDraft).Count(&stats.Draft)
	db.DB.Model(&models.Applicant{}).Where("status = ?", models.ApplicationSubmitted).Count(&stats.Submitted)
	db.DB.Model(&models.Applicant{}).Where("status = ?", models.ApplicationPaymentPending).Count(&stats.PaymentPending)
	db.DB.Model(&models.Applicant{}).Where("status = ?", models.ApplicationUnderReview).Count(&stats.UnderReview)
	db.DB.Model(&models.Applicant{}).Where("status = ?", models.ApplicationShortlisted).Count(&stats.Shortlisted)
	db.DB.Model(&models.Applicant{}).Where("status = ?", models.ApplicationRejected).Count(&stats.Rejected)
	db.DB.Model(&models.Applicant{}).Where("status = ?", models.ApplicationEnrolled).Count(&stats.Enrolled)
	
	utils.JSONResponse(w, http.StatusOK, true, "Statistics fetched", stats)
}
