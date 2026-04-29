package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"
	"university-erp-backend/internal/db"
	"university-erp-backend/internal/middleware"
	"university-erp-backend/internal/models"
	"university-erp-backend/internal/utils"

	"github.com/gorilla/mux"
	"golang.org/x/crypto/bcrypt"
)

// ==================== CREATE FACULTY ====================
func CreateFaculty(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)

	var req struct {
		Username      string  `json:"username"`
		Email         string  `json:"email"`
		Password      string  `json:"password"`
		Phone          string  `json:"phone"`
		FirstName      string  `json:"first_name"`
		LastName       string  `json:"last_name"`
		DepartmentID   uint    `json:"department_id"`
		Designation    string  `json:"designation"`
		Qualification  string  `json:"qualification"`
		ExperienceYears int    `json:"experience_years"`
		Specialization string  `json:"specialization"`
		EmployeeCode   string  `json:"employee_code"`
		Salary         float64 `json:"salary"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Check duplicate email/username
	var existing models.User
	if err := db.DB.Where("email = ? OR username = ?", req.Email, req.Username).First(&existing).Error; err == nil {
		utils.ErrorResponse(w, http.StatusConflict, "Email or username already exists")
		return
	}

	// Create user
	hashed, _ := bcrypt.GenerateFromPassword([]byte(req.Password), 14)
	user := models.User{
		Username:     req.Username,
		Email:        req.Email,
		PasswordHash: string(hashed),
		RoleID:       5, // faculty role
		IsActive:     true,
	}
	if err := db.DB.Create(&user).Error; err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to create user")
		return
	}

	// Create faculty profile
	now := time.Now()
	faculty := models.Faculty{
		UserID:          user.ID,
		DepartmentID:    &req.DepartmentID,
		FirstName:       req.FirstName,
		LastName:        req.LastName,
		Designation:     req.Designation,
		Qualification:   req.Qualification,
		ExperienceYears: req.ExperienceYears,
		Specialization:  req.Specialization,
		EmployeeCode:    req.EmployeeCode,
		Phone:           req.Phone,
		JoiningDate:     &now,
		Salary:          req.Salary,
		IsActive:        true,
	}
	if err := db.DB.Create(&faculty).Error; err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to create faculty profile")
		return
	}

	// Send notification
	go utils.CreateNotification(user.ID, "Welcome to University ERP", "Your faculty account has been created successfully. Please update your profile.", "success", "")
	go utils.CreateNotification(claims.UserID, "New Faculty Added", req.FirstName+" "+req.LastName+" has been added as faculty.", "info", "")

	utils.JSONResponse(w, http.StatusCreated, true, "Faculty created successfully", faculty)
}

// ==================== LIST FACULTY ====================
func ListFaculty(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)

	var faculty []models.Faculty
	query := db.DB.Preload("User").Preload("Department")

	// Filter by department's college for college_admin
	if claims.Role == models.RoleCollegeAdmin && claims.CollegeID != nil {
		query = query.Joins("JOIN core.departments ON faculty_profiles.department_id = departments.id").
			Where("departments.college_id = ?", *claims.CollegeID)
	}

	if err := query.Order("created_at DESC").Find(&faculty).Error; err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to fetch faculty")
		return
	}

	utils.JSONResponse(w, http.StatusOK, true, "Faculty fetched", faculty)
}

// ==================== GET FACULTY BY ID ====================
func GetFacultyByID(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(mux.Vars(r)["id"])

	var faculty models.Faculty
	if err := db.DB.Preload("User").Preload("Department").First(&faculty, id).Error; err != nil {
		utils.ErrorResponse(w, http.StatusNotFound, "Faculty not found")
		return
	}

	utils.JSONResponse(w, http.StatusOK, true, "Faculty fetched", faculty)
}

// ==================== UPDATE FACULTY ====================
func UpdateFaculty(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(mux.Vars(r)["id"])

	var req struct {
		FirstName      string  `json:"first_name"`
		LastName       string  `json:"last_name"`
		Department     string  `json:"department"`
		Designation    string  `json:"designation"`
		Qualification  string  `json:"qualification"`
		Experience     int     `json:"experience"`
		Specialization string  `json:"specialization"`
		Phone          string  `json:"phone"`
		IsActive       bool    `json:"is_active"`
		Salary         float64 `json:"salary"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	var faculty models.Faculty
	if err := db.DB.First(&faculty, id).Error; err != nil {
		utils.ErrorResponse(w, http.StatusNotFound, "Faculty not found")
		return
	}

	updates := map[string]interface{}{
		"first_name":      req.FirstName,
		"last_name":       req.LastName,
		"department":      req.Department,
		"designation":     req.Designation,
		"qualification":   req.Qualification,
		"experience":      req.Experience,
		"specialization":  req.Specialization,
		"phone":           req.Phone,
		"is_active":       req.IsActive,
		"salary":          req.Salary,
	}

	db.DB.Model(&faculty).Updates(updates)

	// Update user active status
	db.DB.Model(&models.User{}).Where("id = ?", faculty.UserID).Update("is_active", req.IsActive)

	utils.JSONResponse(w, http.StatusOK, true, "Faculty updated successfully", faculty)
}

// ==================== DELETE FACULTY ====================
func DeleteFaculty(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(mux.Vars(r)["id"])

	var faculty models.Faculty
	if err := db.DB.First(&faculty, id).Error; err != nil {
		utils.ErrorResponse(w, http.StatusNotFound, "Faculty not found")
		return
	}

	// Soft delete faculty and deactivate user
	db.DB.Delete(&faculty)
	db.DB.Model(&models.User{}).Where("id = ?", faculty.UserID).Update("is_active", false)

	utils.JSONResponse(w, http.StatusOK, true, "Faculty deleted successfully", nil)
}

// ==================== GET FACULTY DASHBOARD ====================
func FacultyDashboard(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)

	var faculty models.Faculty
	if err := db.DB.Where("user_id = ?", claims.UserID).Preload("Department").First(&faculty).Error; err != nil {
		utils.ErrorResponse(w, http.StatusNotFound, "Faculty profile not found")
		return
	}

	// Get today's timetable
	today := time.Now().Weekday()
	var timetables []models.Timetable
	db.DB.Where("faculty_id = ? AND day_of_week = ?", faculty.ID, int(today)).
		Preload("Subject").Preload("Program").Find(&timetables)

	// Get attendance stats for this month
	attendanceStats := struct {
		TotalClasses   int64 `json:"total_classes"`
		MarkedToday    int64 `json:"marked_today"`
		PendingClasses int64 `json:"pending_classes"`
	}{
		TotalClasses:   0,
		MarkedToday:    0,
		PendingClasses: 0,
	}
	db.DB.Model(&models.Timetable{}).Where("faculty_id = ? AND is_active = ?", faculty.ID, true).Count(&attendanceStats.TotalClasses)
	db.DB.Model(&models.Attendance{}).Where("faculty_id = ? AND DATE(date) = DATE(?)", faculty.ID, time.Now()).Count(&attendanceStats.MarkedToday)
	attendanceStats.PendingClasses = attendanceStats.TotalClasses - attendanceStats.MarkedToday
	if attendanceStats.PendingClasses < 0 {
		attendanceStats.PendingClasses = 0
	}

	// Get subject count
	var subjectCount int64
	db.DB.Model(&models.Timetable{}).Where("faculty_id = ?", faculty.ID).Distinct("subject_id").Count(&subjectCount)

	utils.JSONResponse(w, http.StatusOK, true, "Dashboard fetched", map[string]interface{}{
		"faculty":           faculty,
		"today_timetable":   timetables,
		"attendance_stats":  attendanceStats,
		"subject_count":     subjectCount,
	})
}

// ==================== GET FACULTY TIMETABLE ====================
func GetFacultyTimetable(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)

	var faculty models.Faculty
	if err := db.DB.Where("user_id = ?", claims.UserID).First(&faculty).Error; err != nil {
		utils.ErrorResponse(w, http.StatusNotFound, "Faculty profile not found")
		return
	}

	var timetables []models.Timetable
	db.DB.Where("faculty_id = ? AND is_active = ?", faculty.ID, true).
		Preload("Subject").Preload("Program").
		Order("day_of_week, start_time").Find(&timetables)

	utils.JSONResponse(w, http.StatusOK, true, "Timetable fetched", timetables)
}
