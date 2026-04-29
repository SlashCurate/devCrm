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

// ==================== GET ATTENDANCE BY TIMETABLE ====================
func GetAttendanceByTimetable(w http.ResponseWriter, r *http.Request) {
	timetableID, _ := strconv.Atoi(mux.Vars(r)["timetable_id"])
	dateStr := r.URL.Query().Get("date")

	date := time.Now()
	if dateStr != "" {
		date, _ = time.Parse("2006-01-02", dateStr)
	}

	var attendances []models.Attendance
	db.DB.Where("timetable_id = ? AND DATE(date) = DATE(?)", timetableID, date).
		Preload("Student").Preload("Student.User").Find(&attendances)

	utils.JSONResponse(w, http.StatusOK, true, "Attendance fetched", attendances)
}

// ==================== GET STUDENTS FOR ATTENDANCE ====================
func GetStudentsForAttendance(w http.ResponseWriter, r *http.Request) {
	timetableID, _ := strconv.Atoi(mux.Vars(r)["timetable_id"])

	var timetable models.Timetable
	if err := db.DB.First(&timetable, timetableID).Error; err != nil {
		utils.ErrorResponse(w, http.StatusNotFound, "Timetable not found")
		return
	}

	// Get all enrolled students for this program
	var students []models.Student
	db.DB.Where("program_id = ?", timetable.ProgramID).
		Preload("User").Find(&students)

	// Get today's attendance if any
	var attendances []models.Attendance
	db.DB.Where("subject_id = ? AND DATE(attendance_date) = DATE(?)", timetable.SubjectID, time.Now()).
		Find(&attendances)

	attendanceMap := make(map[uint]string)
	for _, a := range attendances {
		attendanceMap[a.StudentID] = a.Status
	}

	// Combine student data with attendance status
	type StudentAttendance struct {
		models.Student
		Status   string `json:"status"`
		Remarks  string `json:"remarks"`
		IsMarked bool   `json:"is_marked"`
	}

	var result []StudentAttendance
	for _, student := range students {
		status, marked := attendanceMap[student.ID]
		if !marked {
			status = "present" // Default
		}
		result = append(result, StudentAttendance{
			Student:  student,
			Status:   status,
			IsMarked: marked,
		})
	}

	utils.JSONResponse(w, http.StatusOK, true, "Students fetched", result)
}

// ==================== MARK ATTENDANCE ====================
func MarkAttendance(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)

	var req struct {
		TimetableID uint `json:"timetable_id"`
		Students    []struct {
			StudentID uint   `json:"student_id"`
			Status    string `json:"status"`
			Remarks   string `json:"remarks"`
		} `json:"students"`
		Date string `json:"date"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Get faculty ID
	var faculty models.Faculty
	if err := db.DB.Where("user_id = ?", claims.UserID).First(&faculty).Error; err != nil {
		utils.ErrorResponse(w, http.StatusNotFound, "Faculty profile not found")
		return
	}

	date := time.Now()
	if req.Date != "" {
		date, _ = time.Parse("2006-01-02", req.Date)
	}

	// Get timetable for subject and semester info
	var timetable models.Timetable
	db.DB.First(&timetable, req.TimetableID)

	// Delete existing attendance for this date
	db.DB.Where("subject_id = ? AND DATE(attendance_date) = DATE(?)", timetable.SubjectID, date).Delete(&models.Attendance{})

	// Create new attendance records
	for _, s := range req.Students {
		facultyID := faculty.ID
		attendance := models.Attendance{
			StudentID:      s.StudentID,
			SubjectID:      timetable.SubjectID,
			FacultyID:      &facultyID,
			SemesterID:     timetable.SemesterID,
			AttendanceDate: date,
			Status:         s.Status,
			Remarks:        s.Remarks,
		}
		db.DB.Create(&attendance)

		// Notify student if absent
		if s.Status == "absent" {
			go utils.CreateNotification("", "Attendance Marked: Absent",
				"You were marked absent for today's class. Please contact your faculty if this is an error.", "warning", "")
		}
	}

	utils.JSONResponse(w, http.StatusCreated, true, "Attendance marked successfully", nil)
}

// ==================== GET STUDENT ATTENDANCE REPORT ====================
func GetStudentAttendanceReport(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)

	var student models.Student
	if err := db.DB.Where("user_id = ?", claims.UserID).First(&student).Error; err != nil {
		utils.ErrorResponse(w, http.StatusNotFound, "Student profile not found")
		return
	}

	subjectID := r.URL.Query().Get("subject_id")
	startDate := r.URL.Query().Get("start_date")
	endDate := r.URL.Query().Get("end_date")

	query := db.DB.Where("student_id = ?", student.ID)

	if subjectID != "" {
		query = query.Where("subject_id = ?", subjectID)
	}

	if startDate != "" {
		sd, _ := time.Parse("2006-01-02", startDate)
		query = query.Where("attendance_date >= ?", sd)
	}

	if endDate != "" {
		ed, _ := time.Parse("2006-01-02", endDate)
		query = query.Where("attendance_date <= ?", ed)
	}

	var attendances []models.Attendance
	query.Preload("Subject").Preload("Faculty").Find(&attendances)

	// Calculate statistics
	var stats struct {
		Total     int     `json:"total"`
		Present   int     `json:"present"`
		Absent    int     `json:"absent"`
		Late      int     `json:"late"`
		Leave     int     `json:"leave"`
		Percentage float64 `json:"percentage"`
	}

	stats.Total = len(attendances)
	for _, a := range attendances {
		switch a.Status {
		case "present":
			stats.Present++
		case "absent":
			stats.Absent++
		case "late":
			stats.Late++
		case "on_leave":
			stats.Leave++
		}
	}

	if stats.Total > 0 {
		stats.Percentage = float64(stats.Present+stats.Late) / float64(stats.Total) * 100
	}

	utils.JSONResponse(w, http.StatusOK, true, "Attendance report fetched", map[string]interface{}{
		"attendances": attendances,
		"statistics":  stats,
	})
}

// ==================== GET COURSE ATTENDANCE REPORT (for faculty) ====================
func GetCourseAttendanceReport(w http.ResponseWriter, r *http.Request) {
	courseID, _ := strconv.Atoi(mux.Vars(r)["course_id"])

	var students []models.Student
	db.DB.Where("course_id = ?", courseID).Preload("User").Find(&students)

	type AttendanceSummary struct {
		StudentID  uint    `json:"student_id"`
		Name       string  `json:"name"`
		Total      int     `json:"total"`
		Present    int     `json:"present"`
		Percentage float64 `json:"percentage"`
	}

	var summaries []AttendanceSummary

	for _, student := range students {
		var attendances []models.Attendance
		db.DB.Where("student_id = ?", student.ID).Find(&attendances)

		total := len(attendances)
		present := 0
		for _, a := range attendances {
			if a.Status == "present" || a.Status == "late" {
				present++
			}
		}

		percentage := 0.0
		if total > 0 {
			percentage = float64(present) / float64(total) * 100
		}

		summaries = append(summaries, AttendanceSummary{
			StudentID:  student.ID,
			Name:       student.FirstName + " " + student.LastName,
			Total:      total,
			Present:    present,
			Percentage: percentage,
		})
	}

	utils.JSONResponse(w, http.StatusOK, true, "Course attendance report fetched", summaries)
}
