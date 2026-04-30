package handlers

import (
	"encoding/json"
	"net/http"
	"university-erp-backend/internal/db"
	"university-erp-backend/internal/middleware"
	"university-erp-backend/internal/models"
	"university-erp-backend/internal/utils"

	"github.com/gorilla/mux"
	"golang.org/x/crypto/bcrypt"
)

// ==================== CREATE USER (University Admin only) ====================
func CreateUser(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Username  string `json:"username"`
		Email     string `json:"email"`
		Password  string `json:"password"`
		Role      string `json:"role"`
		Phone     string `json:"phone"`
		CollegeID *uint  `json:"college_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate role
	validRoles := map[string]bool{
		models.RoleFinanceController: true,
		models.RoleRegistrar:         true,
		models.RoleCollegeAdmin:      true,
		models.RoleFaculty:           true,
	}
	if !validRoles[req.Role] {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid role. Valid: finance_controller, registrar, college_admin, faculty")
		return
	}

	var existing models.User
	if err := db.DB.Where("email = ? OR username = ?", req.Email, req.Username).First(&existing).Error; err == nil {
		utils.ErrorResponse(w, http.StatusConflict, "Email or username already exists")
		return
	}

	hashed, _ := bcrypt.GenerateFromPassword([]byte(req.Password), 14)
	user := models.User{
		Username:     req.Username,
		Email:        req.Email,
		PasswordHash: string(hashed),
		RoleID:       3, // college_admin role
		IsActive:     true,
	}
	if err := db.DB.Create(&user).Error; err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to create user")
		return
	}

	go utils.SendWelcomeEmail(user.Email, user.Username, req.Role)

	utils.JSONResponse(w, http.StatusCreated, true, "User created successfully", map[string]interface{}{
		"id":       user.ID,
		"username": user.Username,
		"email":    user.Email,
		"role_id":  user.RoleID,
	})
}

// ==================== LIST ALL USERS ====================
func ListUsers(w http.ResponseWriter, r *http.Request) {
	var users []models.User
	db.DB.Preload("Role").Find(&users)

	// Remove passwords from response
type SafeUser struct {
	ID         string `json:"id"`
	Username   string `json:"username"`
	Email      string `json:"email"`
	RoleID     uint   `json:"role_id"`
	RoleName   string `json:"role_name"`
	IsActive   bool   `json:"is_active"`
	IsVerified bool   `json:"is_verified"`
}
var safeUsers []SafeUser

for _, u := range users {
	safeUsers = append(safeUsers, SafeUser{
		ID:         u.ID,
		Username:   u.Username,
		Email:      u.Email,
		RoleID:     u.RoleID,
		RoleName:   u.Role.RoleName, // from Preload("Role")
		IsActive:   u.IsActive,
		IsVerified: u.IsVerified,
	})
}
	utils.JSONResponse(w, http.StatusOK, true, "Users fetched", safeUsers)
}

// ==================== TOGGLE USER ACTIVE ====================
func ToggleUserActive(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	var user models.User
	if err := db.DB.First(&user, id).Error; err != nil {
		utils.ErrorResponse(w, http.StatusNotFound, "User not found")
		return
	}
	db.DB.Model(&user).Update("is_active", !user.IsActive)
	status := "activated"
	if !user.IsActive {
		status = "deactivated"
	}
	utils.JSONResponse(w, http.StatusOK, true, "User "+status, nil)
}

// ==================== CREATE COLLEGE ====================
func CreateCollege(w http.ResponseWriter, r *http.Request) {
	var college models.College
	if err := json.NewDecoder(r.Body).Decode(&college); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	college.IsActive = true
	if err := db.DB.Create(&college).Error; err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to create college")
		return
	}
	utils.JSONResponse(w, http.StatusCreated, true, "College created", college)
}

// ==================== LIST COLLEGES ====================
func ListColleges(w http.ResponseWriter, r *http.Request) {
	var colleges []models.College
	db.DB.Preload("Departments").Find(&colleges)
	utils.JSONResponse(w, http.StatusOK, true, "Colleges fetched", colleges)
}

// ==================== UPDATE COLLEGE ====================
func UpdateCollege(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	var college models.College
	if err := db.DB.First(&college, id).Error; err != nil {
		utils.ErrorResponse(w, http.StatusNotFound, "College not found")
		return
	}
	json.NewDecoder(r.Body).Decode(&college)
	db.DB.Save(&college)
	utils.JSONResponse(w, http.StatusOK, true, "College updated", college)
}

// ==================== CREATE COURSE ====================
func CreateCourse(w http.ResponseWriter, r *http.Request) {
	var course models.Program
	if err := json.NewDecoder(r.Body).Decode(&course); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	course.IsActive = true
	if err := db.DB.Create(&course).Error; err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to create course")
		return
	}
	utils.JSONResponse(w, http.StatusCreated, true, "Course created", course)
}

// ==================== LIST COURSES ====================
func ListCourses(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)

	var courses []models.Program
	query := db.DB.Preload("Department")

	// SAFE CHECK (prevents panic)
	if claims != nil &&
		claims.Role == models.RoleCollegeAdmin &&
		claims.CollegeID != nil {
		query = query.Joins("JOIN core.departments ON programs.department_id = departments.id").
			Where("departments.college_id = ?", *claims.CollegeID)
	}

	if err := query.Find(&courses).Error; err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to fetch courses")
		return
	}

	utils.JSONResponse(w, http.StatusOK, true, "Courses fetched", courses)
}

// ==================== UNIVERSITY DASHBOARD STATS ====================
func UniversityDashboard(w http.ResponseWriter, r *http.Request) {
	var totalStudents, totalColleges, totalCourses, pendingApplications, totalFaculty int64
	db.DB.Model(&models.Student{}).Where("is_active = ?", true).Count(&totalStudents)
	db.DB.Model(&models.College{}).Count(&totalColleges)
	db.DB.Model(&models.Program{}).Count(&totalCourses)
	db.DB.Model(&models.Faculty{}).Where("is_active = ?", true).Count(&totalFaculty)
	db.DB.Model(&models.Applicant{}).Where("status = ?", "submitted").Count(&pendingApplications)

	var totalRevenue float64
	db.DB.Model(&models.Payment{}).Where("status = ?", "completed").
		Select("COALESCE(SUM(amount_paid), 0)").Scan(&totalRevenue)

	utils.JSONResponse(w, http.StatusOK, true, "Dashboard stats", map[string]interface{}{
		"total_students":       totalStudents,
		"total_faculty":        totalFaculty,
		"total_colleges":       totalColleges,
		"total_courses":        totalCourses,
		"pending_applications": pendingApplications,
		"total_revenue":        totalRevenue,
	})
}

// ==================== LIST ACADEMIC YEARS ====================
func ListAcademicYears(w http.ResponseWriter, r *http.Request) {
	var years []models.AcademicYear
	db.DB.Order("start_date desc").Find(&years)
	utils.JSONResponse(w, http.StatusOK, true, "Academic years fetched", years)
}

// ==================== LIST SEMESTERS ====================
func ListSemesters(w http.ResponseWriter, r *http.Request) {
	var semesters []models.Semester
	db.DB.Preload("AcademicYear").Order("semester_number asc").Find(&semesters)
	utils.JSONResponse(w, http.StatusOK, true, "Semesters fetched", semesters)
}
