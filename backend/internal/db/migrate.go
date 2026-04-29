package db

import (
	"log"
	"university-erp-backend/internal/models"
)

func AutoMigrate() error {
	if DB == nil {
		return nil
	}

	log.Println("🔄 Running database migrations...")

	err := DB.AutoMigrate(
		// Core auth and user management
		&models.User{},
		&models.UserSession{},
		&models.OTPVerification{},
		&models.Role{},
		&models.Permission{},
		&models.RolePermission{},
		&models.Notification{},
		&models.AuditLog{},
		
		// University structure
		&models.University{},
		&models.College{},
		&models.Department{},
		&models.Staff{},
		
		// Academic structure
		&models.Program{},
		&models.AcademicYear{},
		&models.Semester{},
		&models.Subject{},
		&models.SubjectPrerequisite{},
		&models.ProgramSubject{},
		
		// People
		&models.Student{},
		&models.StudentParent{},
		&models.StudentAcademicHistory{},
		&models.Faculty{},
		&models.FacultySubject{},
		&models.FacultyLeave{},
		&models.StudentLeave{},
		
		// Enrollment and attendance
		&models.Enrollment{},
		&models.Attendance{},
		&models.Timetable{},
		
		// Applications and admissions
		&models.Application{},
		&models.Admission{},
		&models.Document{},
		
		// Assignments
		&models.Assignment{},
		&models.AssignmentSubmission{},
		
		// Exams and results
		&models.Exam{},
		&models.ExamHallAllocation{},
		&models.Result{},
		&models.StudentSGPA{},
		
		// Finance
		&models.FeeCategory{},
		&models.FeeStructure{},
		&models.StudentFeeInvoice{},
		&models.Payment{},
		&models.Scholarship{},
		&models.StudentScholarship{},
		
		// Library
		&models.Book{},
		&models.EBook{},
		&models.LibraryTransaction{},
		&models.BookReservation{},
		
		// Hostel
		&models.Hostel{},
		&models.HostelRoom{},
		&models.HostelAllocation{},
		&models.HostelComplaint{},
		
		// Notices and events
		&models.Notice{},
		&models.Event{},
		
		// Placement
		&models.Company{},
		&models.PlacementDrive{},
		&models.PlacementApplication{},
	)
	if err != nil {
		return err
	}

	log.Println("✅ Database migration completed")
	return nil
}
