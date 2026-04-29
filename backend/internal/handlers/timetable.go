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
)

// ==================== CREATE SUBJECT ====================
func CreateSubject(w http.ResponseWriter, r *http.Request) {
	var req struct {
		DepartmentID   uint   `json:"department_id"`
		SubjectCode    string `json:"subject_code"`
		SubjectName    string `json:"subject_name"`
		Credits        int    `json:"credits"`
		LectureHours   int    `json:"lecture_hours"`
		LabHours       int    `json:"lab_hours"`
		SubjectType    string `json:"subject_type"`
		SemesterNumber int    `json:"semester_number"`
		Description    string `json:"description"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	subject := models.Subject{
		DepartmentID:   req.DepartmentID,
		SubjectCode:    req.SubjectCode,
		SubjectName:    req.SubjectName,
		Credits:        req.Credits,
		LectureHours:   req.LectureHours,
		LabHours:       req.LabHours,
		SubjectType:    req.SubjectType,
		SemesterNumber: req.SemesterNumber,
		Description:    req.Description,
		IsActive:       true,
	}

	if err := db.DB.Create(&subject).Error; err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to create subject")
		return
	}

	utils.JSONResponse(w, http.StatusCreated, true, "Subject created successfully", subject)
}

// ==================== LIST SUBJECTS ====================
func ListSubjects(w http.ResponseWriter, r *http.Request) {
	departmentID := r.URL.Query().Get("department_id")

	var subjects []models.Subject
	query := db.DB.Preload("Department")

	if departmentID != "" {
		query = query.Where("department_id = ?", departmentID)
	}

	if err := query.Where("is_active = ?", true).Find(&subjects).Error; err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to fetch subjects")
		return
	}

	utils.JSONResponse(w, http.StatusOK, true, "Subjects fetched", subjects)
}

// ==================== CREATE TIMETABLE ====================
func CreateTimetable(w http.ResponseWriter, r *http.Request) {
	var req struct {
		ProgramID    uint      `json:"program_id"`
		SubjectID    uint      `json:"subject_id"`
		FacultyID    uint      `json:"faculty_id"`
		SemesterID   uint      `json:"semester_id"`
		DayOfWeek    int       `json:"day_of_week"`
		StartTime    string    `json:"start_time"` // HH:MM format
		EndTime      string    `json:"end_time"`   // HH:MM format
		RoomNumber   string    `json:"room_number"`
		Section      string    `json:"section"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Parse times
	startTime, _ := time.Parse("15:04", req.StartTime)
	endTime, _ := time.Parse("15:04", req.EndTime)

	timetable := models.Timetable{
		ProgramID:  req.ProgramID,
		SubjectID:  req.SubjectID,
		FacultyID:  req.FacultyID,
		SemesterID: req.SemesterID,
		DayOfWeek:  req.DayOfWeek,
		StartTime:  startTime,
		EndTime:    endTime,
		RoomNumber: req.RoomNumber,
		Section:    req.Section,
		IsActive:   true,
	}

	if err := db.DB.Create(&timetable).Error; err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to create timetable")
		return
	}

	utils.JSONResponse(w, http.StatusCreated, true, "Timetable created successfully", timetable)
}

// ==================== LIST TIMETABLE ====================
func ListTimetable(w http.ResponseWriter, r *http.Request) {
	programID := r.URL.Query().Get("program_id")
	semesterID := r.URL.Query().Get("semester_id")
	dayOfWeek := r.URL.Query().Get("day_of_week")

	var timetables []models.Timetable
	query := db.DB.Preload("Subject").Preload("Program").Preload("Faculty").Preload("Semester")

	// Apply filters
	if programID != "" {
		query = query.Where("program_id = ?", programID)
	}

	if semesterID != "" {
		query = query.Where("semester_id = ?", semesterID)
	}

	if dayOfWeek != "" {
		query = query.Where("day_of_week = ?", dayOfWeek)
	}

	if err := query.Where("is_active = ?", true).Order("day_of_week, start_time").Find(&timetables).Error; err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to fetch timetable")
		return
	}

	utils.JSONResponse(w, http.StatusOK, true, "Timetable fetched", timetables)
}

// ==================== GET STUDENT TIMETABLE ====================
func GetStudentTimetable(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)

	var student models.Student
	if err := db.DB.Where("user_id = ?", claims.UserID).First(&student).Error; err != nil {
		utils.ErrorResponse(w, http.StatusNotFound, "Student profile not found")
		return
	}

	if student.ProgramID == nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Student not enrolled in any program")
		return
	}

	// Get current semester from student's enrollment
	currentSemester := student.CurrentSemester
	if currentSemester == 0 {
		currentSemester = 1 // Default to semester 1
	}

	var timetables []models.Timetable
	db.DB.Joins("JOIN semesters ON timetables.semester_id = semesters.id").
		Where("timetables.program_id = ? AND semesters.semester_number = ? AND timetables.is_active = ?", 
			*student.ProgramID, currentSemester, true).
		Preload("Subject").Preload("Faculty").
		Order("day_of_week, start_time").Find(&timetables)

	utils.JSONResponse(w, http.StatusOK, true, "Timetable fetched", timetables)
}

// ==================== UPDATE TIMETABLE ====================
func UpdateTimetable(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(mux.Vars(r)["id"])

	var req struct {
		SubjectID    uint   `json:"subject_id"`
		FacultyID    uint   `json:"faculty_id"`
		DayOfWeek    int    `json:"day_of_week"`
		StartTime    string `json:"start_time"`
		EndTime      string `json:"end_time"`
		RoomNumber   string `json:"room_number"`
		IsActive     bool   `json:"is_active"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	var timetable models.Timetable
	if err := db.DB.First(&timetable, id).Error; err != nil {
		utils.ErrorResponse(w, http.StatusNotFound, "Timetable entry not found")
		return
	}

	// Parse times if provided
	updates := map[string]interface{}{
		"subject_id":  req.SubjectID,
		"faculty_id":  req.FacultyID,
		"day_of_week": req.DayOfWeek,
		"room_number": req.RoomNumber,
		"is_active":   req.IsActive,
	}

	if req.StartTime != "" {
		startTime, _ := time.Parse("15:04", req.StartTime)
		updates["start_time"] = startTime
	}
	if req.EndTime != "" {
		endTime, _ := time.Parse("15:04", req.EndTime)
		updates["end_time"] = endTime
	}

	db.DB.Model(&timetable).Updates(updates)

	utils.JSONResponse(w, http.StatusOK, true, "Timetable updated successfully", timetable)
}

// ==================== DELETE TIMETABLE ====================
func DeleteTimetable(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(mux.Vars(r)["id"])

	var timetable models.Timetable
	if err := db.DB.First(&timetable, id).Error; err != nil {
		utils.ErrorResponse(w, http.StatusNotFound, "Timetable entry not found")
		return
	}

	db.DB.Delete(&timetable)

	utils.JSONResponse(w, http.StatusOK, true, "Timetable deleted successfully", nil)
}
