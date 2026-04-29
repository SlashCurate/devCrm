package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"
	"university-erp-backend/internal/db"
	"university-erp-backend/internal/middleware"
	"university-erp-backend/internal/models"
	"university-erp-backend/internal/utils"

	"github.com/gorilla/mux"
)

// ==================== CREATE EXAM ====================
func CreateExam(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)

	var req struct {
		Name         string    `json:"name"`
		ProgramID    uint      `json:"program_id"`
		SubjectID    *uint     `json:"subject_id"`
		CollegeID    uint      `json:"college_id"`
		SemesterID   uint      `json:"semester_id"`
		ExamDate     time.Time `json:"exam_date"`
		Duration     int       `json:"duration"`
		TotalMarks   float64   `json:"total_marks"`
		PassingMarks float64   `json:"passing_marks"`
		ExamType     string    `json:"exam_type"`
		Description  string    `json:"description"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	examDate := req.ExamDate
	exam := models.Exam{
		Name:         req.Name,
		ProgramID:    req.ProgramID,
		SubjectID:    req.SubjectID,
		CollegeID:    req.CollegeID,
		SemesterID:   req.SemesterID,
		ExamDate:     &examDate,
		Duration:     req.Duration,
		TotalMarks:   req.TotalMarks,
		PassingMarks: req.PassingMarks,
		ExamType:     req.ExamType,
		Description:  req.Description,
		IsPublished:  false,
		PublishedBy:  &claims.UserID,
	}

	if err := db.DB.Create(&exam).Error; err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to create exam")
		return
	}

	utils.JSONResponse(w, http.StatusCreated, true, "Exam created", exam)
}

// ==================== LIST EXAMS ====================
func ListExams(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)

	query := db.DB.Preload("Program").Preload("College").Preload("Subject").Preload("Semester")
	if claims.Role == models.RoleCollegeAdmin && claims.CollegeID != nil {
		query = query.Where("college_id = ?", *claims.CollegeID)
	}
	if claims.Role == models.RoleStudent {
		query = query.Where("is_published = true")
	}

	var exams []models.Exam
	query.Order("exam_date desc").Find(&exams)
	utils.JSONResponse(w, http.StatusOK, true, "Exams fetched", exams)
}

// ==================== PUBLISH EXAM ====================
func PublishExam(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	id := mux.Vars(r)["id"]

	var exam models.Exam
	if err := db.DB.Preload("Program").First(&exam, id).Error; err != nil {
		utils.ErrorResponse(w, http.StatusNotFound, "Exam not found")
		return
	}

	now := time.Now()
	db.DB.Model(&exam).Updates(map[string]interface{}{
		"is_published": true,
		"published_at": now,
		"published_by": claims.UserID,
	})

	// Notify all enrolled students of this program
	var students []models.Student
	db.DB.Where("program_id = ? AND status = ?", exam.ProgramID, "enrolled").Find(&students)
	for _, s := range students {
		db.DB.Create(&models.Notification{
			UserID:  s.UserID,
			Title:   "Exam Scheduled: " + exam.Name,
			Message: "An exam has been scheduled. Date: " + exam.ExamDate.Format("02 Jan 2006"),
			Type:    "info",
		})
	}

	utils.JSONResponse(w, http.StatusOK, true, "Exam published", exam)
}

// ==================== UPDATE EXAM ====================
func UpdateExam(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]

	var exam models.Exam
	if err := db.DB.First(&exam, id).Error; err != nil {
		utils.ErrorResponse(w, http.StatusNotFound, "Exam not found")
		return
	}

	var req map[string]interface{}
	json.NewDecoder(r.Body).Decode(&req)
	delete(req, "id")
	delete(req, "published_by")

	db.DB.Model(&exam).Updates(req)
	utils.JSONResponse(w, http.StatusOK, true, "Exam updated", exam)
}

// ==================== ADD / UPDATE RESULT ====================
func AddResult(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)

	var req struct {
		ExamID        uint    `json:"exam_id"`
		StudentID     uint    `json:"student_id"`
		MarksObtained float64 `json:"marks_obtained"`
		Grade         string  `json:"grade"`
		Remarks       string  `json:"remarks"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Auto-calculate grade if not provided
	if req.Grade == "" {
		var exam models.Exam
		db.DB.First(&exam, req.ExamID)
		percentage := (req.MarksObtained / exam.TotalMarks) * 100
		switch {
		case percentage >= 90:
			req.Grade = "A+"
		case percentage >= 80:
			req.Grade = "A"
		case percentage >= 70:
			req.Grade = "B+"
		case percentage >= 60:
			req.Grade = "B"
		case percentage >= 50:
			req.Grade = "C"
		case percentage >= 40:
			req.Grade = "D"
		default:
			req.Grade = "F"
		}
	}

	// Upsert result
	var result models.Result
	err := db.DB.Where("exam_id = ? AND student_id = ?", req.ExamID, req.StudentID).
		First(&result).Error

	if err != nil {
		// Create new
		result = models.Result{
			ExamID:        req.ExamID,
			StudentID:     req.StudentID,
			MarksObtained: req.MarksObtained,
			Grade:         req.Grade,
			Remarks:       req.Remarks,
			EnteredBy:     &claims.UserID,
		}
		db.DB.Create(&result)
	} else {
		// Update existing
		db.DB.Model(&result).Updates(map[string]interface{}{
			"marks_obtained": req.MarksObtained,
			"grade":          req.Grade,
			"remarks":        req.Remarks,
		})
	}

	utils.JSONResponse(w, http.StatusOK, true, "Result saved", result)
}

// ==================== PUBLISH RESULTS ====================
func PublishResults(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	examID := mux.Vars(r)["exam_id"]

	now := time.Now()
	db.DB.Model(&models.Result{}).
		Where("exam_id = ?", examID).
		Updates(map[string]interface{}{
			"is_published": true,
			"published_at": now,
			"published_by": claims.UserID,
		})

	// Notify students
	var results []models.Result
	db.DB.Preload("Student").Where("exam_id = ?", examID).Find(&results)
	for _, res := range results {
		db.DB.Create(&models.Notification{
			UserID:  res.Student.UserID,
			Title:   "Results Published 📊",
			Message: fmt.Sprintf("Your exam results are now available. Grade: %s", res.Grade),
			Type:    "info",
		})
	}

	utils.JSONResponse(w, http.StatusOK, true, "Results published successfully", nil)
}

// ==================== GET EXAM RESULTS ====================
func GetExamResults(w http.ResponseWriter, r *http.Request) {
	examID := mux.Vars(r)["exam_id"]

	var results []models.Result
	db.DB.Preload("Student.User").Preload("Exam").
		Where("exam_id = ?", examID).
		Find(&results)

	utils.JSONResponse(w, http.StatusOK, true, "Results fetched", results)
}

// ==================== REGISTRAR DASHBOARD ====================
func RegistrarDashboard(w http.ResponseWriter, r *http.Request) {
	var totalExams, publishedExams, totalResults, pendingResults int64

	db.DB.Model(&models.Exam{}).Count(&totalExams)
	db.DB.Model(&models.Exam{}).Where("is_published = true").Count(&publishedExams)
	db.DB.Model(&models.Result{}).Count(&totalResults)
	db.DB.Model(&models.Result{}).Where("is_verified = false").Count(&pendingResults)

	var upcomingExams []models.Exam
	db.DB.Preload("Program").Preload("College").
		Where("exam_date > ? AND is_published = true", time.Now()).
		Order("exam_date asc").Limit(5).
		Find(&upcomingExams)

	utils.JSONResponse(w, http.StatusOK, true, "Registrar dashboard", map[string]interface{}{
			"total_exams":     totalExams,
		"published_exams": publishedExams,
		"total_results":   totalResults,
		"pending_results": pendingResults,
		"upcoming_exams":  upcomingExams,
	})
}

// RegistrarListSubjects returns all subjects for exam creation
func RegistrarListSubjects(w http.ResponseWriter, r *http.Request) {
	var subjects []models.Subject
	if err := db.DB.Find(&subjects).Error; err != nil {
		utils.JSONResponse(w, http.StatusInternalServerError, false, "Failed to fetch subjects", nil)
		return
	}
	utils.JSONResponse(w, http.StatusOK, true, "Subjects retrieved", subjects)
}
