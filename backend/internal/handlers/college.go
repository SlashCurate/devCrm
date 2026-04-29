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

// ==================== COLLEGE DASHBOARD ====================
func CollegeDashboard(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)

	var totalStudents, totalCourses, pendingApps, shortlistedApps, enrolledStudents int64

	db.DB.Model(&models.Student{}).
		Where("college_id = ?", claims.CollegeID).
		Count(&totalStudents)

	db.DB.Model(&models.Course{}).
		Where("college_id = ?", claims.CollegeID).
		Count(&totalCourses)

	db.DB.Model(&models.Application{}).
		Where("college_id = ? AND status = ?", claims.CollegeID, models.ApplicationSubmitted).
		Count(&pendingApps)

	db.DB.Model(&models.Application{}).
		Where("college_id = ? AND status = ?", claims.CollegeID, models.ApplicationShortlisted).
		Count(&shortlistedApps)

	db.DB.Model(&models.Student{}).
		Where("college_id = ? AND status = ?", claims.CollegeID, "enrolled").
		Count(&enrolledStudents)

	utils.JSONResponse(w, http.StatusOK, true, "College dashboard", map[string]interface{}{
		"total_students":    totalStudents,
		"total_courses":     totalCourses,
		"pending_apps":      pendingApps,
		"shortlisted_apps":  shortlistedApps,
		"enrolled_students": enrolledStudents,
	})
}

// ==================== GET COLLEGE STUDENTS ====================
func GetCollegeStudents(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	status := r.URL.Query().Get("status")

	query := db.DB.Preload("User").Preload("Program")

	if claims.Role == models.RoleCollegeAdmin && claims.CollegeID != nil {
		query = query.Where("college_id = ?", *claims.CollegeID)
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}

	var students []models.Student
	query.Find(&students)
	utils.JSONResponse(w, http.StatusOK, true, "Students fetched", students)
}

// ==================== GET SINGLE STUDENT (College Admin) ====================
func GetStudentByID(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]

	var student models.Student
	if err := db.DB.
		Preload("User").
		Preload("Program").
		Preload("College").
		Preload("Documents").
		Preload("Results.Exam").
		First(&student, id).Error; err != nil {
		utils.ErrorResponse(w, http.StatusNotFound, "Student not found")
		return
	}

	utils.JSONResponse(w, http.StatusOK, true, "Student fetched", student)
}

// ==================== ADD STUDENT MANUALLY (College Admin) ====================
func AddStudentManually(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Username  string `json:"username"`
		Email     string `json:"email"`
		Password  string `json:"password"`
		Phone     string `json:"phone"`
		FirstName string `json:"first_name"`
		LastName  string `json:"last_name"`
		ProgramID uint   `json:"program_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Check duplicate
	var existing models.User
	if err := db.DB.Where("email = ? OR username = ?", req.Email, req.Username).
		First(&existing).Error; err == nil {
		utils.ErrorResponse(w, http.StatusConflict, "Email or username already exists")
		return
	}

	hashed, _ := bcrypt.GenerateFromPassword([]byte(req.Password), 14)
	user := models.User{
		Username:     req.Username,
		Email:        req.Email,
		PasswordHash: string(hashed),
		RoleID:       6, // student role
		IsActive:     true,
	}
	if err := db.DB.Create(&user).Error; err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to create user")
		return
	}

	student := models.Student{
		UserID:    user.ID,
		ProgramID: &req.ProgramID,
		FirstName: req.FirstName,
		LastName:  req.LastName,
		Phone:     req.Phone,
	}
	if err := db.DB.Create(&student).Error; err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to create student")
		return
	}

	go utils.SendWelcomeEmail(user.Email, req.FirstName, "student")

	utils.JSONResponse(w, http.StatusCreated, true, "Student added successfully", map[string]interface{}{
		"user_id":    user.ID,
		"student_id": student.ID,
	})
}

// ==================== UPDATE STUDENT (College Admin) ====================
func UpdateStudent(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]

	var student models.Student
	if err := db.DB.First(&student, id).Error; err != nil {
		utils.ErrorResponse(w, http.StatusNotFound, "Student not found")
		return
	}

	var req map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Remove protected fields
	delete(req, "user_id")
	delete(req, "enrollment_number")
	delete(req, "id")

	db.DB.Model(&student).Updates(req)
	utils.JSONResponse(w, http.StatusOK, true, "Student updated", student)
}

// ==================== GET COLLEGE COURSES ====================
func GetCollegeCourses(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)

	var courses []models.Course
	db.DB.Where("college_id = ? AND is_active = true", claims.CollegeID).Find(&courses)
	utils.JSONResponse(w, http.StatusOK, true, "Courses fetched", courses)
}

// ==================== UPDATE COURSE ====================
func UpdateCourse(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]

	var course models.Course
	if err := db.DB.First(&course, id).Error; err != nil {
		utils.ErrorResponse(w, http.StatusNotFound, "Course not found")
		return
	}

	var req map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	delete(req, "id")
	delete(req, "college_id")

	db.DB.Model(&course).Updates(req)
	utils.JSONResponse(w, http.StatusOK, true, "Course updated", course)
}
