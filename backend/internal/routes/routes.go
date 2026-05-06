package routes

import (
	"net/http"
	"university-erp-backend/internal/handlers"
	"university-erp-backend/internal/middleware"
	"university-erp-backend/internal/models"

	"github.com/gorilla/mux"
)

func SetupRoutes(r *mux.Router) {

	// ==================== CORS Middleware ====================
	r.Use(corsMiddleware)

	api := r.PathPrefix("/api/v1").Subrouter()

	// ==================== PUBLIC ROUTES ====================
	api.HandleFunc("/auth/login", handlers.Login).Methods("POST", "OPTIONS")
	api.HandleFunc("/auth/apply", handlers.PublicSubmitApplication).Methods("POST", "OPTIONS")
	api.HandleFunc("/auth/application-status", handlers.PublicCheckApplicationStatus).Methods("GET", "OPTIONS")
	api.HandleFunc("/auth/forgot-password", handlers.ForgotPassword).Methods("POST", "OPTIONS")
	api.HandleFunc("/auth/reset-password", handlers.ResetPassword).Methods("POST", "OPTIONS")

	// OTP & Applicant Registration
	api.HandleFunc("/auth/send-otp", handlers.SendOTP).Methods("POST", "OPTIONS")
	api.HandleFunc("/auth/verify-otp", handlers.VerifyOTP).Methods("POST", "OPTIONS")
	api.HandleFunc("/auth/register-applicant", handlers.RegisterApplicant).Methods("POST", "OPTIONS")
	api.HandleFunc("/auth/send-login-otp", handlers.SendLoginOTP).Methods("POST", "OPTIONS")
	api.HandleFunc("/auth/login-otp", handlers.LoginWithOTP).Methods("POST", "OPTIONS")

	// Public admission routes
	api.HandleFunc("/admissions/cycles", handlers.ListAdmissionCycles).Methods("GET", "OPTIONS")
	api.HandleFunc("/admissions/active-cycle", handlers.GetActiveAdmissionCycle).Methods("GET", "OPTIONS")
	api.HandleFunc("/admissions/draft", handlers.GetApplicationDraft).Methods("GET", "OPTIONS")
	api.HandleFunc("/admissions/draft", handlers.SaveApplicationDraft).Methods("POST", "OPTIONS")

	// Public course/college listing
	api.HandleFunc("/colleges", handlers.ListColleges).Methods("GET", "OPTIONS")
	api.HandleFunc("/courses", handlers.ListCourses).Methods("GET", "OPTIONS")
	api.HandleFunc("/academic-years", handlers.ListAcademicYears).Methods("GET", "OPTIONS")
	api.HandleFunc("/semesters", handlers.ListSemesters).Methods("GET", "OPTIONS")
	api.HandleFunc("/fee-categories", handlers.ListFeeCategories).Methods("GET", "OPTIONS")

	// ==================== AUTHENTICATED ROUTES ====================
	auth := api.PathPrefix("").Subrouter()
	auth.Use(middleware.AuthMiddleware)

	// --- Common (All roles) ---
	auth.HandleFunc("/auth/profile", handlers.GetProfile).Methods("GET", "OPTIONS")
	auth.HandleFunc("/auth/change-password", handlers.ChangePassword).Methods("POST", "OPTIONS")
	auth.HandleFunc("/notifications", handlers.GetNotifications).Methods("GET", "OPTIONS")
	auth.HandleFunc("/notifications/read", handlers.MarkNotificationRead).Methods("PUT", "OPTIONS")

	// ==================== UNIVERSITY ADMIN ROUTES ====================
	univAdmin := auth.PathPrefix("").Subrouter()
	univAdmin.Use(middleware.RoleMiddleware(models.RoleUniversityAdmin))

	univAdmin.HandleFunc("/admin/dashboard", handlers.UniversityDashboard).Methods("GET", "OPTIONS")
	univAdmin.HandleFunc("/admin/users", handlers.CreateUser).Methods("POST", "OPTIONS")
	univAdmin.HandleFunc("/admin/users", handlers.ListUsers).Methods("GET", "OPTIONS")
	univAdmin.HandleFunc("/admin/users/{id}/toggle", handlers.ToggleUserActive).Methods("PUT", "OPTIONS")
	univAdmin.HandleFunc("/admin/colleges", handlers.CreateCollege).Methods("POST", "OPTIONS")
	univAdmin.HandleFunc("/admin/colleges/{id}", handlers.UpdateCollege).Methods("PUT", "OPTIONS")
	univAdmin.HandleFunc("/admin/courses", handlers.CreateCourse).Methods("POST", "OPTIONS")
	univAdmin.HandleFunc("/admin/applications", handlers.GetAllApplications).Methods("GET", "OPTIONS")
	univAdmin.HandleFunc("/admin/applications/{id}/shortlist", handlers.ShortlistApplication).Methods("PUT", "OPTIONS")
	univAdmin.HandleFunc("/admin/applications/{id}/reject", handlers.RejectApplication).Methods("PUT", "OPTIONS")
	univAdmin.HandleFunc("/admin/payments", handlers.GetAllPayments).Methods("GET", "OPTIONS")

	// Admin: Admission Cycle Management
	univAdmin.HandleFunc("/admin/admission-cycles", handlers.ListAllAdmissionCycles).Methods("GET", "OPTIONS")
	univAdmin.HandleFunc("/admin/admission-cycles", handlers.CreateAdmissionCycle).Methods("POST", "OPTIONS")
	univAdmin.HandleFunc("/admin/admission-cycles/{id}", handlers.UpdateAdmissionCycle).Methods("PUT", "OPTIONS")
	univAdmin.HandleFunc("/admin/admission-cycles/{id}/toggle", handlers.ToggleAdmissionCycle).Methods("PUT", "OPTIONS")
	//univAdmin.HandleFunc("/admin/admission-cycles/{id}", handlers.DeleteAdmissionCycle).Methods("DELETE", "OPTIONS")

	// Admin: Seat Matrix Management (Real-world seat allocation)
	univAdmin.HandleFunc("/admin/seat-matrices", handlers.GetSeatMatrix).Methods("GET", "OPTIONS")
	univAdmin.HandleFunc("/admin/seat-matrices", handlers.CreateSeatMatrix).Methods("POST", "OPTIONS")

	// Admin: Application Review & Management
	univAdmin.HandleFunc("/admin/applications/review", handlers.ListApplicationsForReview).Methods("GET", "OPTIONS")
	univAdmin.HandleFunc("/admin/applications/{id}/review", handlers.ReviewApplication).Methods("PUT", "OPTIONS")
	univAdmin.HandleFunc("/admin/applications/bulk-shortlist", handlers.BulkShortlistApplications).Methods("POST", "OPTIONS")
	univAdmin.HandleFunc("/admin/applications/statistics", handlers.GetApplicationStatistics).Methods("GET", "OPTIONS")

	// --- University Admin: Faculty Management ---
	univAdmin.HandleFunc("/admin/faculty", handlers.CreateFaculty).Methods("POST", "OPTIONS")
	univAdmin.HandleFunc("/admin/faculty", handlers.ListFaculty).Methods("GET", "OPTIONS")
	univAdmin.HandleFunc("/admin/faculty/{id}", handlers.GetFacultyByID).Methods("GET", "OPTIONS")
	univAdmin.HandleFunc("/admin/faculty/{id}", handlers.UpdateFaculty).Methods("PUT", "OPTIONS")
	univAdmin.HandleFunc("/admin/faculty/{id}", handlers.DeleteFaculty).Methods("DELETE", "OPTIONS")

	// --- University Admin: Library Management ---
	univAdmin.HandleFunc("/admin/library/books", handlers.CreateBook).Methods("POST", "OPTIONS")
	univAdmin.HandleFunc("/admin/library/books", handlers.ListBooks).Methods("GET", "OPTIONS")
	univAdmin.HandleFunc("/admin/library/books/{id}", handlers.GetBookByID).Methods("GET", "OPTIONS")
	univAdmin.HandleFunc("/admin/library/books/{id}", handlers.UpdateBook).Methods("PUT", "OPTIONS")
	univAdmin.HandleFunc("/admin/library/issue", handlers.IssueBook).Methods("POST", "OPTIONS")
	univAdmin.HandleFunc("/admin/library/return/{id}", handlers.ReturnBook).Methods("PUT", "OPTIONS")
	univAdmin.HandleFunc("/admin/library/borrowings", handlers.GetAllBorrowings).Methods("GET", "OPTIONS")
	univAdmin.HandleFunc("/admin/library/dashboard", handlers.LibraryDashboard).Methods("GET", "OPTIONS")

	// --- University Admin: Event Management ---
	univAdmin.HandleFunc("/admin/events", handlers.CreateEvent).Methods("POST", "OPTIONS")
	univAdmin.HandleFunc("/admin/events", handlers.ListEvents).Methods("GET", "OPTIONS")
	univAdmin.HandleFunc("/admin/events/{id}", handlers.GetEventByID).Methods("GET", "OPTIONS")
	univAdmin.HandleFunc("/admin/events/{id}", handlers.UpdateEvent).Methods("PUT", "OPTIONS")
	univAdmin.HandleFunc("/admin/events/{id}", handlers.DeleteEvent).Methods("DELETE", "OPTIONS")
	univAdmin.HandleFunc("/admin/events/upcoming", handlers.GetUpcomingEvents).Methods("GET", "OPTIONS")
	univAdmin.HandleFunc("/admin/holidays", handlers.GetHolidays).Methods("GET", "OPTIONS")

	// ==================== FINANCE CONTROLLER ROUTES ====================
	finance := auth.PathPrefix("").Subrouter()
	finance.Use(middleware.RoleMiddleware(models.RoleFinanceController, models.RoleUniversityAdmin))

	finance.HandleFunc("/finance/dashboard", handlers.FinanceDashboard).Methods("GET", "OPTIONS")
	finance.HandleFunc("/finance/fees", handlers.CreateFeeStructure).Methods("POST", "OPTIONS")
	finance.HandleFunc("/finance/fees", handlers.ListFeeStructures).Methods("GET", "OPTIONS")
	finance.HandleFunc("/finance/fees/{id}", handlers.UpdateFeeStructure).Methods("PUT", "OPTIONS")
	finance.HandleFunc("/finance/fees/{id}", handlers.DeleteFeeStructure).Methods("DELETE", "OPTIONS")
	finance.HandleFunc("/finance/payments", handlers.GetAllPayments).Methods("GET", "OPTIONS")
	finance.HandleFunc("/finance/payments/{id}", handlers.GetPaymentByID).Methods("GET", "OPTIONS")

	// ==================== REGISTRAR ROUTES ====================
	registrar := auth.PathPrefix("").Subrouter()
	registrar.Use(middleware.RoleMiddleware(models.RoleRegistrar, models.RoleUniversityAdmin))

	registrar.HandleFunc("/registrar/dashboard", handlers.RegistrarDashboard).Methods("GET", "OPTIONS")
	registrar.HandleFunc("/registrar/exams", handlers.CreateExam).Methods("POST", "OPTIONS")
	registrar.HandleFunc("/registrar/exams", handlers.ListExams).Methods("GET", "OPTIONS")
	registrar.HandleFunc("/registrar/exams/{id}", handlers.UpdateExam).Methods("PUT", "OPTIONS")
	registrar.HandleFunc("/registrar/exams/{id}/publish", handlers.PublishExam).Methods("PUT", "OPTIONS")
	registrar.HandleFunc("/registrar/subjects", handlers.RegistrarListSubjects).Methods("GET", "OPTIONS")
	registrar.HandleFunc("/registrar/results", handlers.AddResult).Methods("POST", "OPTIONS")
	registrar.HandleFunc("/registrar/results/{exam_id}/publish", handlers.PublishResults).Methods("PUT", "OPTIONS")
	registrar.HandleFunc("/registrar/results/{exam_id}", handlers.GetExamResults).Methods("GET", "OPTIONS")

	// ==================== COLLEGE ADMIN ROUTES ====================
	collegeAdmin := auth.PathPrefix("").Subrouter()
	collegeAdmin.Use(middleware.RoleMiddleware(models.RoleCollegeAdmin, models.RoleUniversityAdmin))

	collegeAdmin.HandleFunc("/college/dashboard", handlers.CollegeDashboard).Methods("GET", "OPTIONS")
	collegeAdmin.HandleFunc("/college/students", handlers.GetCollegeStudents).Methods("GET", "OPTIONS")
	collegeAdmin.HandleFunc("/college/students", handlers.AddStudentManually).Methods("POST", "OPTIONS")
	collegeAdmin.HandleFunc("/college/students/{id}", handlers.GetStudentByID).Methods("GET", "OPTIONS")
	collegeAdmin.HandleFunc("/college/students/{id}", handlers.UpdateStudent).Methods("PUT", "OPTIONS")
	collegeAdmin.HandleFunc("/college/courses", handlers.GetCollegeCourses).Methods("GET", "OPTIONS")
	collegeAdmin.HandleFunc("/college/courses/{id}", handlers.UpdateCourse).Methods("PUT", "OPTIONS")
	collegeAdmin.HandleFunc("/college/applications", handlers.GetAllApplications).Methods("GET", "OPTIONS")
	collegeAdmin.HandleFunc("/college/applications/{id}/reject", handlers.RejectApplication).Methods("PUT", "OPTIONS")
	collegeAdmin.HandleFunc("/college/applications/{id}/enroll", handlers.EnrollStudent).Methods("PUT", "OPTIONS")
	collegeAdmin.HandleFunc("/college/fees", handlers.ListFeeStructures).Methods("GET", "OPTIONS")

	// --- College Admin: Timetable Management ---
	collegeAdmin.HandleFunc("/college/timetable", handlers.CreateTimetable).Methods("POST", "OPTIONS")
	collegeAdmin.HandleFunc("/college/timetable", handlers.ListTimetable).Methods("GET", "OPTIONS")
	collegeAdmin.HandleFunc("/college/timetable/{id}", handlers.UpdateTimetable).Methods("PUT", "OPTIONS")
	collegeAdmin.HandleFunc("/college/timetable/{id}", handlers.DeleteTimetable).Methods("DELETE", "OPTIONS")

	// --- College Admin: Subject Management ---
	collegeAdmin.HandleFunc("/college/subjects", handlers.CreateSubject).Methods("POST", "OPTIONS")
	collegeAdmin.HandleFunc("/college/subjects", handlers.ListSubjects).Methods("GET", "OPTIONS")

	// --- College Admin: Faculty Management ---
	collegeAdmin.HandleFunc("/college/faculty", handlers.CreateFaculty).Methods("POST", "OPTIONS")
	collegeAdmin.HandleFunc("/college/faculty", handlers.ListFaculty).Methods("GET", "OPTIONS")
	collegeAdmin.HandleFunc("/college/faculty/{id}", handlers.GetFacultyByID).Methods("GET", "OPTIONS")
	collegeAdmin.HandleFunc("/college/faculty/{id}", handlers.UpdateFaculty).Methods("PUT", "OPTIONS")
	collegeAdmin.HandleFunc("/college/faculty/{id}", handlers.DeleteFaculty).Methods("DELETE", "OPTIONS")

	// --- College Admin: Attendance View ---
	collegeAdmin.HandleFunc("/college/attendance/course/{course_id}", handlers.GetCourseAttendanceReport).Methods("GET", "OPTIONS")
	collegeAdmin.HandleFunc("/college/attendance/timetable/{timetable_id}", handlers.GetAttendanceByTimetable).Methods("GET", "OPTIONS")

	// --- College Admin: Library Management ---
	collegeAdmin.HandleFunc("/college/library/books", handlers.ListBooks).Methods("GET", "OPTIONS")
	collegeAdmin.HandleFunc("/college/library/books/{id}", handlers.GetBookByID).Methods("GET", "OPTIONS")
	collegeAdmin.HandleFunc("/college/library/issue", handlers.IssueBook).Methods("POST", "OPTIONS")
	collegeAdmin.HandleFunc("/college/library/return/{id}", handlers.ReturnBook).Methods("PUT", "OPTIONS")
	collegeAdmin.HandleFunc("/college/library/borrowings", handlers.GetAllBorrowings).Methods("GET", "OPTIONS")
	collegeAdmin.HandleFunc("/college/library/dashboard", handlers.LibraryDashboard).Methods("GET", "OPTIONS")

	// ==================== FACULTY ROUTES ====================
	faculty := auth.PathPrefix("").Subrouter()
	faculty.Use(middleware.RoleMiddleware(models.RoleFaculty, models.RoleUniversityAdmin))

	faculty.HandleFunc("/faculty/dashboard", handlers.FacultyDashboard).Methods("GET", "OPTIONS")
	faculty.HandleFunc("/faculty/timetable", handlers.GetFacultyTimetable).Methods("GET", "OPTIONS")
	faculty.HandleFunc("/faculty/attendance/students/{timetable_id}", handlers.GetStudentsForAttendance).Methods("GET", "OPTIONS")
	faculty.HandleFunc("/faculty/attendance/mark", handlers.MarkAttendance).Methods("POST", "OPTIONS")
	
	// --- Faculty: Internal Marks ---
	faculty.HandleFunc("/faculty/exams", handlers.ListExams).Methods("GET", "OPTIONS")
	faculty.HandleFunc("/faculty/results", handlers.AddResult).Methods("POST", "OPTIONS")

	// ==================== STUDENT ROUTES ====================
	student := auth.PathPrefix("").Subrouter()
	student.Use(middleware.RoleMiddleware(models.RoleStudent, models.RoleUniversityAdmin))

	student.HandleFunc("/student/dashboard", handlers.StudentDashboard).Methods("GET", "OPTIONS")
	student.HandleFunc("/student/profile", handlers.GetStudentProfile).Methods("GET", "OPTIONS")
	student.HandleFunc("/student/profile", handlers.UpdateStudentProfile).Methods("PUT", "OPTIONS")
	student.HandleFunc("/student/profile/change-requests", handlers.GetMyChangeRequests).Methods("GET", "OPTIONS")
	student.HandleFunc("/student/profile/change-requests", handlers.RequestProfileChange).Methods("POST", "OPTIONS")
	// The SubmitApplication and GetMyApplications are now obsolete for enrolled students as they are already enrolled. 
	// But let's leave GetMyApplications if they want to view their past application details.
	student.HandleFunc("/student/payments", handlers.GetMyPayments).Methods("GET", "OPTIONS")
	student.HandleFunc("/student/payments/pending", handlers.GetPendingFees).Methods("GET", "OPTIONS")
	student.HandleFunc("/student/payments/order", handlers.CreatePaymentOrder).Methods("POST", "OPTIONS")
	student.HandleFunc("/student/payments/verify", handlers.VerifyPayment).Methods("POST", "OPTIONS")
	student.HandleFunc("/student/payments/failure", handlers.PaymentFailure).Methods("POST", "OPTIONS")

	student.HandleFunc("/student/payments/{id}/receipt", handlers.GetPaymentReceipt).Methods("GET", "OPTIONS")
	student.HandleFunc("/student/results", handlers.GetStudentResults).Methods("GET", "OPTIONS")

	// --- Student: Timetable & Attendance ---
	student.HandleFunc("/student/timetable", handlers.GetStudentTimetable).Methods("GET", "OPTIONS")
	student.HandleFunc("/student/attendance", handlers.GetStudentAttendanceReport).Methods("GET", "OPTIONS")

	// --- Student: Library ---
	student.HandleFunc("/student/library/books", handlers.ListBooks).Methods("GET", "OPTIONS")
	student.HandleFunc("/student/library/books/{id}", handlers.GetBookByID).Methods("GET", "OPTIONS")
	student.HandleFunc("/student/library/borrowings", handlers.GetMyBorrowings).Methods("GET", "OPTIONS")

	// --- Student: Events ---
	student.HandleFunc("/student/events", handlers.ListEvents).Methods("GET", "OPTIONS")
	student.HandleFunc("/student/events/upcoming", handlers.GetUpcomingEvents).Methods("GET", "OPTIONS")
	student.HandleFunc("/student/holidays", handlers.GetHolidays).Methods("GET", "OPTIONS")
}

// ==================== CORS MIDDLEWARE ====================
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}
