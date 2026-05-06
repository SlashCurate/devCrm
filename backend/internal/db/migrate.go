package db

import (
	"fmt"
	"log"
	"university-erp-backend/internal/models"
)

func CreateSchemas() error {
	log.Println("🏗️  Creating database schemas...")
	schemas := []string{
		"auth",       // Authentication & Users
		"core",       // University, College, Dept
		"academic",   // Programs, Subjects, Timetable
		"student",    // Students, Enrollment
		"faculty",    // Faculty management
		"finance",    // Fees, Payments
		"library",    // Library system
		"hostel",     // Hostel management
		"audit",      // Audit Logs
		"notify",     // Notifications
		"admissions", // Pre-enrollment applicants
	}
	for _, schema := range schemas {
		if err := DB.Exec(fmt.Sprintf("CREATE SCHEMA IF NOT EXISTS %s", schema)).Error; err != nil {
			return fmt.Errorf("failed to create schema %s: %w", schema, err)
		}
		log.Printf("   ✅ Schema '%s' ready", schema)
	}
	if err := DB.Exec(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`).Error; err != nil {
		log.Println("⚠️  uuid-ossp extension:", err)
	}
	log.Println("✅ All schemas ready")
	return nil
}

func AutoMigrate() error {
	if DB == nil {
		return nil
	}
	log.Println("🔄 Running database migrations...")
	err := DB.AutoMigrate(
		// Auth (no FK deps)
		&models.Role{},
		&models.Permission{},
		&models.RolePermission{},
		&models.User{},
		&models.UserSession{},
		&models.OTPVerification{},
		&models.Notification{},
		&models.AuditLog{},

		// Core university structure
		&models.University{},
		&models.UniversityAdmin{},
		&models.College{},
		&models.CollegeAdmin{},
		&models.Department{},
		&models.Staff{},

		// Academic structure
		&models.AcademicYear{},
		&models.Semester{},
		&models.Program{},
		&models.Subject{},
		&models.SubjectPrerequisite{},
		&models.ProgramSubject{},

		// People
		&models.Faculty{},
		&models.FacultySubject{},
		&models.FacultyLeave{},
		&models.Student{},
		&models.StudentParent{},
		&models.StudentAcademicHistory{},
		&models.StudentLeave{},

		// Admissions (pre-enrollment)
		&models.AdmissionCycle{},
		&models.Applicant{},
		&models.Application{},
		&models.Document{},

		// Enrollment & attendance
		&models.Enrollment{},
		&models.Attendance{},
		&models.Timetable{},

		// Assignments
		&models.Assignment{},
		&models.AssignmentSubmission{},

		// Exams & results
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

		// Profile change requests
		&models.ProfileChangeRequest{},
	)
	if err != nil {
		return err
	}
	log.Println("✅ Database migration completed")
	return nil
}
