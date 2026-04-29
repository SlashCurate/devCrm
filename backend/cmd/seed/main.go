package main

import (
	"fmt"
	"log"
	"os"
	"time"

	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// ==================== DATABASE CONNECTION ====================

var DB *gorm.DB

func Connect() error {
	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=Asia/Kolkata",
		os.Getenv("DB_HOST"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_NAME"),
		os.Getenv("DB_PORT"),
	)

	var err error
	for i := 0; i < 5; i++ {
		DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
			Logger: logger.Default.LogMode(logger.Info),
		})
		if err == nil {
			break
		}
		log.Printf("DB not ready, retrying in 3s... (%d/5)", i+1)
		time.Sleep(3 * time.Second)
	}
	if err != nil {
		return err
	}

	sqlDB, err := DB.DB()
	if err != nil {
		return err
	}
	sqlDB.SetMaxOpenConns(25)
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetConnMaxLifetime(5 * time.Minute)

	log.Println("✅ Database connected successfully")
	return nil
}

// ==================== CREATE SCHEMAS ====================

func CreateSchemas() error {
	log.Println("🏗️  Creating database schemas...")
	
	schemas := []string{
		"auth",      // Authentication & Users
		"core",      // University, College, Dept
		"academic",  // Programs, Subjects, Timetable
		"student",   // Students, Enrollment
		"faculty",   // Faculty management
		"finance",   // Fees, Payments
		"library",   // Library system
		"hostel",    // Hostel management
		"audit",     // Audit Logs
		"notify",    // Notifications
	}
	
	for _, schema := range schemas {
		if err := DB.Exec(fmt.Sprintf("CREATE SCHEMA IF NOT EXISTS %s", schema)).Error; err != nil {
			return fmt.Errorf("failed to create schema %s: %w", schema, err)
		}
		log.Printf("   ✅ Schema '%s' created/verified", schema)
	}
	
	// Create uuid-ossp extension
	if err := DB.Exec("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"").Error; err != nil {
		log.Println("⚠️  Warning: Could not create uuid-ossp extension:", err)
	}
	
	log.Println("✅ All schemas created successfully")
	return nil
}

// ==================== AUTO MIGRATE TABLES ====================

func AutoMigrate() error {
	log.Println("🔄 Running database migrations...")
	
	err := DB.AutoMigrate(
		// Core auth and user management
		&User{},
		&UserSession{},
		&OTPVerification{},
		&Role{},
		&Permission{},
		&RolePermission{},
		&Notification{},
		&AuditLog{},
		
		// University structure
		&University{},
		&UniversityAdmin{},
		&College{},
		&CollegeAdmin{},
		&Department{},
		&Staff{},
		
		// Academic structure
		&Program{},
		&AcademicYear{},
		&Semester{},
		&Subject{},
		&SubjectPrerequisite{},
		&ProgramSubject{},
		
		// People
		&Student{},
		&StudentParent{},
		&StudentAcademicHistory{},
		&Faculty{},
		&FacultySubject{},
		&FacultyLeave{},
		&StudentLeave{},
		
		// Enrollment and attendance
		&Enrollment{},
		&Attendance{},
		&Timetable{},
		
		// Applications and admissions
		&Application{},
		&Admission{},
		&Document{},
		
		// Assignments
		&Assignment{},
		&AssignmentSubmission{},
		
		// Exams and results
		&Exam{},
		&ExamHallAllocation{},
		&Result{},
		&StudentSGPA{},
		
		// Finance
		&FeeCategory{},
		&FeeStructure{},
		&StudentFeeInvoice{},
		&Payment{},
		&Scholarship{},
		&StudentScholarship{},
		
		// Library
		&Book{},
		&EBook{},
		&LibraryTransaction{},
		&BookReservation{},
		
		// Hostel
		&Hostel{},
		&HostelRoom{},
		&HostelAllocation{},
		&HostelComplaint{},
		
		// Notices and events
		&Notice{},
		&Event{},
		
		// Placement
		&Company{},
		&PlacementDrive{},
		&PlacementApplication{},
	)
	if err != nil {
		return err
	}

	log.Println("✅ Database migration completed")
	return nil
}

// ==================== HELPER FUNCTIONS ====================

func hashPassword(password string) string {
	bytes, _ := bcrypt.GenerateFromPassword([]byte(password), 10)
	return string(bytes)
}

func ptr[T any](v T) *T {
	return &v
}

// ==================== MODELS ====================

// User (auth.users)
type User struct {
	ID                 string    `gorm:"primaryKey;type:uuid;default:uuid_generate_v4()"`
	CreatedAt          time.Time
	UpdatedAt          time.Time
	Username           string `gorm:"uniqueIndex;not null"`
	Email              string `gorm:"uniqueIndex;not null"`
	PasswordHash       string `gorm:"not null"`
	RoleID             uint   `gorm:"not null"`
	IsActive           bool   `gorm:"default:true"`
	IsVerified         bool   `gorm:"default:false"`
	IsLocked           bool   `gorm:"default:false"`
	FailedAttempts     int    `gorm:"default:0"`
	LastLogin          *time.Time
	ProfilePhoto       string
	PasswordResetToken string
	TokenExpiry        *time.Time
}

func (User) TableName() string { return "auth.users" }

// Role (auth.roles)
type Role struct {
	ID          uint   `gorm:"primaryKey"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
	RoleName    string `gorm:"uniqueIndex;not null"`
}

func (Role) TableName() string { return "auth.roles" }

// Permission (auth.permissions)
type Permission struct {
	ID            uint   `gorm:"primaryKey"`
	CreatedAt     time.Time
	UpdatedAt     time.Time
	Module        string `gorm:"not null"`
	Action        string `gorm:"not null"`
	Description   string
}

func (Permission) TableName() string { return "auth.permissions" }

// RolePermission (auth.role_permissions)
type RolePermission struct {
	ID           uint `gorm:"primaryKey"`
	CreatedAt    time.Time
	UpdatedAt    time.Time
	RoleID       uint `gorm:"not null"`
	PermissionID uint `gorm:"not null"`
}

func (RolePermission) TableName() string { return "auth.role_permissions" }

// UserSession (auth.user_sessions)
type UserSession struct {
	ID         uint `gorm:"primaryKey"`
	CreatedAt  time.Time
	UpdatedAt  time.Time
	UserID     string `gorm:"type:uuid;not null"`
	Token      string `gorm:"not null"`
	IP         string
	UserAgent  string
	IsActive   bool `gorm:"default:true"`
}

func (UserSession) TableName() string { return "auth.user_sessions" }

// OTPVerification (auth.otp_verifications)
type OTPVerification struct {
	ID        uint `gorm:"primaryKey"`
	CreatedAt time.Time
	UpdatedAt time.Time
	UserID    string `gorm:"type:uuid"`
	OTPCode   string
	OTPType   string
	ExpiresAt time.Time
	IsUsed    bool `gorm:"default:false"`
}

func (OTPVerification) TableName() string { return "auth.otp_verifications" }

// Notification (notify.notifications)
type Notification struct {
	ID        uint `gorm:"primaryKey"`
	CreatedAt time.Time
	UpdatedAt time.Time
	UserID    string `gorm:"type:uuid;not null"`
	Title     string
	Message   string
	Type      string
	Link      string
	IsRead    bool `gorm:"default:false"`
}

func (Notification) TableName() string { return "notify.notifications" }

// AuditLog (audit.audit_logs)
type AuditLog struct {
	ID          uint `gorm:"primaryKey"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
	UserID      string `gorm:"type:uuid"`
	Action      string
	TargetTable string
	RecordID    string
	OldValues   string
	NewValues   string
	IPAddress   string
	UserAgent   string
	Details     string `gorm:"type:jsonb"`
}

func (AuditLog) TableName() string { return "audit.audit_logs" }

// University (core.university)
type University struct {
	ID              uint `gorm:"primaryKey"`
	CreatedAt       time.Time
	UpdatedAt       time.Time
	Name            string `gorm:"not null"`
	ShortName       string
	EstablishedYear int
	LogoURL         string
	Address         string
	City            string
	State           string
	Country         string `gorm:"default:'India'"`
	Pincode         string
	Phone           string
	Email           string
	Website         string
	ViceChancellor  string
	Registrar       string
	Accreditation   string
	NAACGrade       string
	NIRFRank        int
	About           string
	IsActive        bool `gorm:"default:true"`
}

func (University) TableName() string { return "core.university" }

// UniversityAdmin (core.university_admins)
type UniversityAdmin struct {
	ID            uint `gorm:"primaryKey"`
	CreatedAt     time.Time
	UpdatedAt     time.Time
	UniversityID  uint
	UserID        *string `gorm:"type:uuid"`
	Designation   string
}

func (UniversityAdmin) TableName() string { return "core.university_admins" }

// College (core.colleges)
type College struct {
	ID              uint `gorm:"primaryKey"`
	CreatedAt       time.Time
	UpdatedAt       time.Time
	UniversityID    uint
	Name            string `gorm:"not null"`
	ShortName       string
	Code            string `gorm:"uniqueIndex;not null"`
	EstablishedYear int
	CollegeType     string
	LogoURL         string
	Address         string
	City            string
	State           string
	Pincode         string
	Phone           string
	Email           string
	Website         string
	PrincipalName   string
	About           string
	IsActive        bool `gorm:"default:true"`
}

func (College) TableName() string { return "core.colleges" }

// CollegeAdmin (core.college_admins)
type CollegeAdmin struct {
	ID          uint `gorm:"primaryKey"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
	CollegeID   uint
	UserID      *string `gorm:"type:uuid"`
	Designation string
}

func (CollegeAdmin) TableName() string { return "core.college_admins" }

// Department (core.departments)
type Department struct {
	ID              uint `gorm:"primaryKey"`
	CreatedAt       time.Time
	UpdatedAt       time.Time
	CollegeID       uint
	Name            string `gorm:"not null"`
	Code            string `gorm:"uniqueIndex;not null"`
	HODName         string
	HODUserID       *string `gorm:"type:uuid"`
	Phone           string
	Email           string
	EstablishedYear int
	About           string
	IsActive        bool `gorm:"default:true"`
}

func (Department) TableName() string { return "core.departments" }

// Staff (core.staff)
type Staff struct {
	ID           uint `gorm:"primaryKey"`
	CreatedAt    time.Time
	UpdatedAt    time.Time
	CollegeID    uint
	UserID       *string `gorm:"type:uuid"`
	EmployeeCode string `gorm:"uniqueIndex"`
	FirstName    string
	LastName     string
	Designation  string
	Department   string
	Phone        string
	Email        string
	JoiningDate  *time.Time
	Salary       float64
	IsActive     bool `gorm:"default:true"`
}

func (Staff) TableName() string { return "core.staff" }

// AcademicYear (academic.academic_years)
type AcademicYear struct {
	ID        uint `gorm:"primaryKey"`
	CreatedAt time.Time
	UpdatedAt time.Time
	YearLabel string `gorm:"not null"`
	StartDate *time.Time
	EndDate   *time.Time
	IsCurrent bool `gorm:"default:false"`
}

func (AcademicYear) TableName() string { return "academic.academic_years" }

// Semester (academic.semesters)
type Semester struct {
	ID             uint `gorm:"primaryKey"`
	CreatedAt      time.Time
	UpdatedAt      time.Time
	AcademicYearID uint
	SemesterNumber int
	SemesterName   string
	StartDate      *time.Time
	EndDate        *time.Time
	ResultPublished bool `gorm:"default:false"`
	IsCurrent      bool `gorm:"default:false"`
}

func (Semester) TableName() string { return "academic.semesters" }

// Program (academic.programs)
type Program struct {
	ID             uint `gorm:"primaryKey"`
	CreatedAt      time.Time
	UpdatedAt      time.Time
	DepartmentID   uint
	Name           string `gorm:"not null"`
	Code           string `gorm:"uniqueIndex;not null"`
	DegreeType     string
	DurationYears  int
	TotalSemesters int
	TotalCredits   int
	IntakeCapacity int
	Eligibility    string
	Description    string
	IsActive       bool `gorm:"default:true"`
}

func (Program) TableName() string { return "academic.programs" }

// Subject (academic.subjects)
type Subject struct {
	ID            uint `gorm:"primaryKey"`
	CreatedAt     time.Time
	UpdatedAt     time.Time
	DepartmentID  uint
	SubjectCode   string `gorm:"uniqueIndex;not null"`
	SubjectName   string `gorm:"not null"`
	Credits       int
	LectureHours  int `gorm:"default:0"`
	TutorialHours int `gorm:"default:0"`
	LabHours      int `gorm:"default:0"`
	SubjectType   string
	SemesterNumber int
	SyllabusURL   string
	Description   string
	IsActive      bool `gorm:"default:true"`
}

func (Subject) TableName() string { return "academic.subjects" }

// SubjectPrerequisite (academic.subject_prerequisites)
type SubjectPrerequisite struct {
	ID              uint `gorm:"primaryKey"`
	SubjectID       uint `gorm:"not null"`
	PrerequisiteID  uint `gorm:"not null"`
}

func (SubjectPrerequisite) TableName() string { return "academic.subject_prerequisites" }

// ProgramSubject (academic.program_subjects)
type ProgramSubject struct {
	ID             uint `gorm:"primaryKey"`
	ProgramID      uint
	SubjectID      uint
	SemesterNumber int
	IsMandatory    bool `gorm:"default:true"`
}

func (ProgramSubject) TableName() string { return "academic.program_subjects" }

// Timetable (academic.timetable)
type Timetable struct {
	ID         uint `gorm:"primaryKey"`
	CreatedAt  time.Time
	UpdatedAt  time.Time
	ProgramID  uint
	SubjectID  uint
	FacultyID  uint
	SemesterID uint
	Section    string
	DayOfWeek  int       `gorm:"not null"`
	StartTime  time.Time `gorm:"not null"`
	EndTime    time.Time `gorm:"not null"`
	RoomNumber string
	IsActive   bool `gorm:"default:true"`
}

func (Timetable) TableName() string { return "academic.timetable" }

// Assignment (academic.assignments)
type Assignment struct {
	ID            uint `gorm:"primaryKey"`
	CreatedAt     time.Time
	UpdatedAt     time.Time
	SubjectID     uint
	FacultyID     uint
	SemesterID    uint
	Title         string
	Description   string
	AttachmentURL string
	DueDate       *time.Time
	MaxMarks      int
	IsPublished   bool `gorm:"default:false"`
}

func (Assignment) TableName() string { return "academic.assignments" }

// AssignmentSubmission (academic.assignment_submissions)
type AssignmentSubmission struct {
	ID           uint `gorm:"primaryKey"`
	CreatedAt    time.Time
	UpdatedAt    time.Time
	AssignmentID uint
	StudentID    uint
	SubmittedAt  time.Time
	FileURL      string
	Remarks      string
	MarksObtained float64
	GradedBy     *uint
	GradedAt     *time.Time
	Status       string `gorm:"default:'Submitted'"`
}

func (AssignmentSubmission) TableName() string { return "academic.assignment_submissions" }

// Faculty (faculty.faculty_profiles)
type Faculty struct {
	ID                uint `gorm:"primaryKey"`
	CreatedAt         time.Time
	UpdatedAt         time.Time
	UserID            string `gorm:"type:uuid;uniqueIndex;not null"`
	DepartmentID      *uint
	EmployeeCode      string `gorm:"uniqueIndex;not null"`
	FirstName         string
	LastName          string
	Gender            string
	DOB               *time.Time
	Phone             string
	AlternatePhone    string
	Address           string
	City              string
	State             string
	Pincode           string
	Nationality       string `gorm:"default:'Indian'"`
	Designation       string
	Qualification     string
	Specialization    string
	ExperienceYears   int
	JoiningDate       *time.Time
	ContractType      string
	Salary            float64
	BankAccount       string
	BankIFSC          string
	PANNumber         string
	AadharNumber      string
	IsActive          bool `gorm:"default:true"`
	PhotoURL          string
	LinkedInURL       string
	ResearchArea      string
	PublicationsCount int `gorm:"default:0"`
}

func (Faculty) TableName() string { return "faculty.faculty_profiles" }

// FacultySubject (faculty.faculty_subjects)
type FacultySubject struct {
	ID             uint `gorm:"primaryKey"`
	CreatedAt      time.Time
	UpdatedAt      time.Time
	FacultyID      uint
	SubjectID      uint
	SemesterID     uint
	Section        string
	AcademicYearID uint
}

func (FacultySubject) TableName() string { return "faculty.faculty_subjects" }

// FacultyLeave (faculty.faculty_leaves)
type FacultyLeave struct {
	ID         uint `gorm:"primaryKey"`
	CreatedAt  time.Time
	UpdatedAt  time.Time
	FacultyID  uint
	LeaveType  string
	FromDate   *time.Time
	ToDate     *time.Time
	Reason     string
	Status     string `gorm:"default:'Pending'"`
	ApprovedBy *uint
}

func (FacultyLeave) TableName() string { return "faculty.faculty_leaves" }

// Student (student.students)
type Student struct {
	ID              uint `gorm:"primaryKey"`
	CreatedAt       time.Time
	UpdatedAt       time.Time
	UserID          string `gorm:"type:uuid;uniqueIndex;not null"`
	ProgramID       *uint
	RollNumber      string `gorm:"uniqueIndex;not null"`
	UniversityRegNo string `gorm:"uniqueIndex"`
	FirstName       string
	LastName        string
	Gender          string
	DOB             *time.Time
	BloodGroup      string
	Phone           string
	AlternatePhone  string
	PersonalEmail   string
	Address         string
	City            string
	State           string
	Pincode         string
	Nationality     string `gorm:"default:'Indian'"`
	Religion        string
	Category        string
	SubCategory     string
	AdmissionYear   int
	CurrentSemester int `gorm:"default:1"`
	Batch           string
	Section         string
	LateralEntry    bool `gorm:"default:false"`
	AadharNumber    string
	PANNumber       string
	PassportNumber  string
	PhotoURL        string
	SignatureURL    string
	IsActive        bool `gorm:"default:true"`
}

func (Student) TableName() string { return "student.students" }

// StudentParent (student.student_parents)
type StudentParent struct {
	ID                  uint `gorm:"primaryKey"`
	CreatedAt           time.Time
	UpdatedAt           time.Time
	StudentID           uint
	FatherName          string
	FatherPhone         string
	FatherEmail         string
	FatherOccupation    string
	FatherQualification string
	MotherName          string
	MotherPhone         string
	MotherEmail         string
	MotherOccupation    string
	MotherQualification string
	GuardianName        string
	GuardianPhone       string
	GuardianRelation    string
	AnnualIncome        float64
	ParentAddress       string
}

func (StudentParent) TableName() string { return "student.student_parents" }

// StudentAcademicHistory (student.student_academic_history)
type StudentAcademicHistory struct {
	ID              uint `gorm:"primaryKey"`
	CreatedAt       time.Time
	UpdatedAt       time.Time
	StudentID       uint
	InstitutionName string
	Degree          string
	BoardUniversity string
	YearOfPassing   int
	Percentage      float64
	Grade           string
	CertificateURL  string
}

func (StudentAcademicHistory) TableName() string { return "student.student_academic_history" }

// Enrollment (student.enrollments)
type Enrollment struct {
	ID           uint `gorm:"primaryKey"`
	CreatedAt    time.Time
	UpdatedAt    time.Time
	StudentID    uint
	SubjectID    uint
	SemesterID   uint
	EnrolledDate *time.Time
	Status       string `gorm:"default:'Active'"`
}

func (Enrollment) TableName() string { return "student.enrollments" }

// Attendance (student.attendance)
type Attendance struct {
	ID             uint `gorm:"primaryKey"`
	CreatedAt      time.Time
	UpdatedAt      time.Time
	StudentID      uint
	SubjectID      uint
	FacultyID      *uint
	SemesterID     uint
	AttendanceDate time.Time
	ClassType      string `gorm:"default:'Lecture'"`
	Status         string
	Remarks        string
}

func (Attendance) TableName() string { return "student.attendance" }

// Exam (student.exams)
type Exam struct {
	ID           uint `gorm:"primaryKey"`
	CreatedAt    time.Time
	UpdatedAt    time.Time
	Name         string
	ProgramID    uint
	SubjectID    *uint
	CollegeID    uint
	SemesterID   uint
	ExamType     string
	ExamDate     *time.Time
	StartTime    time.Time
	EndTime      time.Time
	Duration     int
	MaxMarks     float64
	TotalMarks   float64
	PassMarks    float64
	PassingMarks float64
	WeightagePct float64
	Venue        string
	Description  string
	IsPublished  bool `gorm:"default:false"`
	PublishedBy  *uint
	PublishedAt  *time.Time
}

func (Exam) TableName() string { return "student.exams" }

// ExamHallAllocation (student.exam_hall_allocations)
type ExamHallAllocation struct {
	ID         uint `gorm:"primaryKey"`
	CreatedAt  time.Time
	UpdatedAt  time.Time
	ExamID     uint
	StudentID  uint
	HallName   string
	SeatNumber string
}

func (ExamHallAllocation) TableName() string { return "student.exam_hall_allocations" }

// Result (student.exam_results)
type Result struct {
	ID            uint `gorm:"primaryKey"`
	CreatedAt     time.Time
	UpdatedAt     time.Time
	ExamID        uint
	StudentID     uint
	MarksObtained float64
	IsAbsent      bool `gorm:"default:false"`
	IsMalpractice bool `gorm:"default:false"`
	Grade         string
	GradePoints   float64
	IsPass        bool
	Remarks       string
	EnteredBy     *uint
	VerifiedBy    *uint
	IsVerified    bool `gorm:"default:false"`
}

func (Result) TableName() string { return "student.exam_results" }

// StudentSGPA (student.student_sgpa)
type StudentSGPA struct {
	ID           uint `gorm:"primaryKey"`
	CreatedAt    time.Time
	UpdatedAt    time.Time
	StudentID    uint
	SemesterID   uint
	TotalCredits int
	CreditsEarned int
	SGPA         float64
	CGPA         float64
	RankInClass  int
	Remarks      string
	CalculatedAt time.Time
}

func (StudentSGPA) TableName() string { return "student.student_sgpa" }

// StudentLeave (student.student_leaves)
type StudentLeave struct {
	ID         uint `gorm:"primaryKey"`
	CreatedAt  time.Time
	UpdatedAt  time.Time
	StudentID  uint
	LeaveType  string
	FromDate   *time.Time
	ToDate     *time.Time
	Reason     string
	DocumentURL string
	Status     string `gorm:"default:'Pending'"`
	ApprovedBy *uint
}

func (StudentLeave) TableName() string { return "student.student_leaves" }

// Document (student.documents)
type Document struct {
	ID          uint `gorm:"primaryKey"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
	StudentID   uint
	DocType     string
	DocName     string
	FileURL     string
	IsVerified  bool `gorm:"default:false"`
	VerifiedBy  *uint
}

func (Document) TableName() string { return "student.student_documents" }

// Application (student.applications)
type Application struct {
	ID             uint `gorm:"primaryKey"`
	CreatedAt      time.Time
	UpdatedAt      time.Time
	StudentID      uint
	ProgramID      uint
	AcademicYearID uint
	Status         string `gorm:"default:'draft'"`
	AppliedDate    *time.Time
	ReviewedBy     *uint
	ReviewedAt     *time.Time
	Remarks        string
}

func (Application) TableName() string { return "student.applications" }

// Admission (student.admissions)
type Admission struct {
	ID              uint `gorm:"primaryKey"`
	CreatedAt       time.Time
	UpdatedAt       time.Time
	ApplicationID   uint
	StudentID       uint
	ProgramID       uint
	AcademicYearID  uint
	AdmissionDate   *time.Time
	AdmissionNumber string
	EnrollmentNumber string
	Status          string `gorm:"default:'admitted'"`
	IsActive        bool `gorm:"default:true"`
}

func (Admission) TableName() string { return "core.admissions" }

// FeeCategory (finance.fee_categories)
type FeeCategory struct {
	ID          uint `gorm:"primaryKey"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
	Name        string
	Description string
}

func (FeeCategory) TableName() string { return "finance.fee_categories" }

// FeeStructure (finance.fee_structures)
type FeeStructure struct {
	ID             uint `gorm:"primaryKey"`
	CreatedAt      time.Time
	UpdatedAt      time.Time
	ProgramID      uint
	AcademicYearID uint
	SemesterNumber int
	CategoryID     uint
	Amount         float64 `gorm:"not null"`
	DueDate        *time.Time
	LateFinePerDay float64 `gorm:"default:0"`
	IsActive       bool `gorm:"default:true"`
	CreatedBy      uint
}

func (FeeStructure) TableName() string { return "finance.fee_structures" }

// StudentFeeInvoice (finance.student_fee_invoices)
type StudentFeeInvoice struct {
	ID             uint `gorm:"primaryKey"`
	CreatedAt      time.Time
	UpdatedAt      time.Time
	StudentID      uint
	AcademicYearID uint
	SemesterNumber int
	TotalAmount    float64
	DiscountAmount float64 `gorm:"default:0"`
	FineAmount     float64 `gorm:"default:0"`
	NetAmount      float64
	PaidAmount     float64 `gorm:"default:0"`
	BalanceDue     float64
	Status         string `gorm:"default:'Unpaid'"`
	DueDate        *time.Time
}

func (StudentFeeInvoice) TableName() string { return "finance.student_fee_invoices" }

// Payment (finance.fee_payments)
type Payment struct {
	ID                uint `gorm:"primaryKey"`
	CreatedAt         time.Time
	UpdatedAt         time.Time
	InvoiceID         uint
	StudentID         uint
	AmountPaid        float64
	PaymentDate       time.Time
	PaymentMode       string
	TransactionID     string
	Gateway           string
	ReceiptNumber     string `gorm:"uniqueIndex"`
	IsVerified        bool `gorm:"default:false"`
	VerifiedBy        *uint
	Remarks           string
	RazorpayOrderID   string
	RazorpayPaymentID string
	RazorpaySignature string
	Currency          string `gorm:"default:'INR'"`
	Status            string `gorm:"default:'pending'"`
	PaidAt            *time.Time
}

func (Payment) TableName() string { return "finance.fee_payments" }

// Scholarship (finance.scholarships)
type Scholarship struct {
	ID              uint `gorm:"primaryKey"`
	CreatedAt       time.Time
	UpdatedAt       time.Time
	Name            string
	Provider        string
	ScholarshipType string
	Amount          float64
	Criteria        string
	AcademicYearID  uint
	LastDate        *time.Time
	IsActive        bool `gorm:"default:true"`
}

func (Scholarship) TableName() string { return "finance.scholarships" }

// StudentScholarship (finance.student_scholarships)
type StudentScholarship struct {
	ID            uint `gorm:"primaryKey"`
	CreatedAt     time.Time
	UpdatedAt     time.Time
	StudentID     uint
	ScholarshipID uint
	AppliedDate   *time.Time
	AwardedDate   *time.Time
	AmountAwarded float64
	Status        string `gorm:"default:'Applied'"`
	ApprovedBy    *uint
	Remarks       string
}

func (StudentScholarship) TableName() string { return "finance.student_scholarships" }

// Book (library.books)
type Book struct {
	ID              uint `gorm:"primaryKey"`
	CreatedAt       time.Time
	UpdatedAt       time.Time
	ISBN            string `gorm:"uniqueIndex"`
	Title           string `gorm:"not null"`
	Author          string
	Publisher       string
	Edition         string
	YearPublished   int
	Category        string
	SubjectID       *uint
	TotalCopies     int `gorm:"default:1"`
	AvailableCopies int `gorm:"default:1"`
	RackNumber      string
	CoverImageURL   string
	Description     string
}

func (Book) TableName() string { return "library.books" }

// EBook (library.ebooks)
type EBook struct {
	ID           uint `gorm:"primaryKey"`
	CreatedAt    time.Time
	UpdatedAt    time.Time
	Title        string
	Author       string
	SubjectID    *uint
	FileURL      string
	PublishedYear int
	AccessType   string `gorm:"default:'All'"`
}

func (EBook) TableName() string { return "library.ebooks" }

// LibraryTransaction (library.transactions)
type LibraryTransaction struct {
	ID         uint `gorm:"primaryKey"`
	CreatedAt  time.Time
	UpdatedAt  time.Time
	BookID     uint
	UserID     string `gorm:"type:uuid"`
	IssuedDate time.Time
	DueDate    time.Time
	ReturnDate *time.Time
	FineAmount float64 `gorm:"default:0"`
	FinePaid   bool `gorm:"default:false"`
	Status     string `gorm:"default:'Issued'"`
	IssuedBy   uint
}

func (LibraryTransaction) TableName() string { return "library.transactions" }

// BookReservation (library.book_reservations)
type BookReservation struct {
	ID         uint `gorm:"primaryKey"`
	CreatedAt  time.Time
	UpdatedAt  time.Time
	BookID     uint
	UserID     string `gorm:"type:uuid"`
	ReservedAt time.Time
	Status     string `gorm:"default:'Waiting'"`
}

func (BookReservation) TableName() string { return "library.book_reservations" }

// Hostel (hostel.hostels)
type Hostel struct {
	ID            uint `gorm:"primaryKey"`
	CreatedAt     time.Time
	UpdatedAt     time.Time
	CollegeID     uint
	HostelName    string
	HostelType    string
	TotalRooms    int
	TotalCapacity int
	WardenName    string
	WardenPhone   string
	Phone         string
	Address       string
	Amenities     string
	IsActive      bool `gorm:"default:true"`
}

func (Hostel) TableName() string { return "hostel.hostels" }

// HostelRoom (hostel.rooms)
type HostelRoom struct {
	ID               uint `gorm:"primaryKey"`
	CreatedAt        time.Time
	UpdatedAt        time.Time
	HostelID         uint
	RoomNumber       string `gorm:"not null"`
	FloorNumber      int
	RoomType         string
	Capacity         int
	CurrentOccupancy int `gorm:"default:0"`
	RoomStatus       string `gorm:"default:'Available'"`
	MonthlyRent      float64
	Amenities        string
}

func (HostelRoom) TableName() string { return "hostel.rooms" }

// HostelAllocation (hostel.allocations)
type HostelAllocation struct {
	ID             uint `gorm:"primaryKey"`
	CreatedAt      time.Time
	UpdatedAt      time.Time
	StudentID      uint
	RoomID         uint
	AcademicYearID uint
	AllotmentDate  *time.Time
	VacatingDate   *time.Time
	Status         string `gorm:"default:'Active'"`
}

func (HostelAllocation) TableName() string { return "hostel.allocations" }

// HostelComplaint (hostel.hostel_complaints)
type HostelComplaint struct {
	ID            uint `gorm:"primaryKey"`
	CreatedAt     time.Time
	UpdatedAt     time.Time
	StudentID     uint
	HostelID      uint
	ComplaintType string
	Description   string
	Status        string `gorm:"default:'Open'"`
	ResolvedAt    *time.Time
}

func (HostelComplaint) TableName() string { return "hostel.hostel_complaints" }

// Notice (notify.notices)
type Notice struct {
	ID             uint `gorm:"primaryKey"`
	CreatedAt      time.Time
	UpdatedAt      time.Time
	CollegeID      *uint
	DepartmentID   *uint
	Title          string
	Content        string
	NoticeType     string
	TargetAudience string
	PostedBy       *string `gorm:"type:uuid"`
	PostedDate     *time.Time
	ExpiryDate     *time.Time
	IsPinned       bool `gorm:"default:false"`
	IsActive       bool `gorm:"default:true"`
}

func (Notice) TableName() string { return "notify.notices" }

// Event (notify.events)
type Event struct {
	ID             uint `gorm:"primaryKey"`
	CreatedAt      time.Time
	UpdatedAt      time.Time
	CollegeID      *uint
	EventName      string
	EventType      string
	Description    string
	EventDate      *time.Time
	EndDate        *time.Time
	Venue          string
	Organizer      string
	MaxParticipants int
	IsActive       bool `gorm:"default:true"`
}

func (Event) TableName() string { return "notify.events" }

// Company (companies)
type Company struct {
	ID          uint `gorm:"primaryKey"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
	Name        string
	Industry    string
	Website     string
	HRContact   string
	HREmail     string
	HRPhone     string
	Address     string
	Description string
	IsActive    bool `gorm:"default:true"`
}

func (Company) TableName() string { return "core.companies" }

// PlacementDrive (placement_drives)
type PlacementDrive struct {
	ID           uint `gorm:"primaryKey"`
	CreatedAt    time.Time
	UpdatedAt    time.Time
	CompanyID    uint
	CollegeID    uint
	DriveDate    *time.Time
	JobRole      string
	JobType      string
	PackageLPA   float64
	Eligibility  string
	Status       string
	Description  string
	Location     string
	IsActive     bool `gorm:"default:true"`
}

func (PlacementDrive) TableName() string { return "core.placement_drives" }

// PlacementApplication (placement_applications)
type PlacementApplication struct {
	ID           uint `gorm:"primaryKey"`
	CreatedAt    time.Time
	UpdatedAt    time.Time
	DriveID      uint
	StudentID    uint
	AppliedDate  time.Time
	Status       string `gorm:"default:'Applied'"`
	ResumeURL    string
	Round1Status string
	Round2Status string
	Round3Status string
	FinalStatus  string
	OfferLetter  string
	PackageOffered float64
}

func (PlacementApplication) TableName() string { return "core.placement_applications" }

// ==================== CLEAR DATA FUNCTION ====================

func clearExistingData() {
	log.Println("🧹 Clearing existing data...")
	DB.Exec("DELETE FROM core.placement_applications")
	DB.Exec("DELETE FROM core.placement_drives")
	DB.Exec("DELETE FROM core.companies")
	DB.Exec("DELETE FROM hostel_complaints")
	DB.Exec("DELETE FROM hostel_allocations")
	DB.Exec("DELETE FROM hostel_rooms")
	DB.Exec("DELETE FROM hostels")
	DB.Exec("DELETE FROM book_reservations")
	DB.Exec("DELETE FROM library_transactions")
	DB.Exec("DELETE FROM ebooks")
	DB.Exec("DELETE FROM books")
	DB.Exec("DELETE FROM student_scholarships")
	DB.Exec("DELETE FROM scholarships")
	DB.Exec("DELETE FROM fee_payments")
	DB.Exec("DELETE FROM student_fee_invoices")
	DB.Exec("DELETE FROM fee_structures")
	DB.Exec("DELETE FROM fee_categories")
	DB.Exec("DELETE FROM student_sgpa")
	DB.Exec("DELETE FROM exam_results")
	DB.Exec("DELETE FROM exam_hall_allocations")
	DB.Exec("DELETE FROM exams")
	DB.Exec("DELETE FROM assignment_submissions")
	DB.Exec("DELETE FROM assignments")
	DB.Exec("DELETE FROM attendance")
	DB.Exec("DELETE FROM timetables")
	DB.Exec("DELETE FROM faculty_subjects")
	DB.Exec("DELETE FROM faculty_leaves")
	DB.Exec("DELETE FROM student_leaves")
	DB.Exec("DELETE FROM enrollments")
	DB.Exec("DELETE FROM student_academic_history")
	DB.Exec("DELETE FROM student_parents")
	DB.Exec("DELETE FROM documents")
	DB.Exec("DELETE FROM applications")
	DB.Exec("DELETE FROM admissions")
	DB.Exec("DELETE FROM students")
	DB.Exec("DELETE FROM subjects")
	DB.Exec("DELETE FROM program_subjects")
	DB.Exec("DELETE FROM programs")
	DB.Exec("DELETE FROM semesters")
	DB.Exec("DELETE FROM academic_years")
	DB.Exec("DELETE FROM faculties")
	DB.Exec("DELETE FROM staff")
	DB.Exec("DELETE FROM core.university_admins")
	DB.Exec("DELETE FROM core.college_admins")
	DB.Exec("DELETE FROM notices")
	DB.Exec("DELETE FROM events")
	DB.Exec("DELETE FROM departments")
	DB.Exec("DELETE FROM colleges")
	DB.Exec("DELETE FROM universities")
	DB.Exec("DELETE FROM audit_logs")
	DB.Exec("DELETE FROM user_sessions")
	DB.Exec("DELETE FROM otp_verifications")
	DB.Exec("DELETE FROM notifications")
	DB.Exec("DELETE FROM password_reset_tokens")
	DB.Exec("DELETE FROM auth.users")
	DB.Exec("DELETE FROM auth.roles")
	// Reset sequences to ensure IDs start from 1
	DB.Exec("SELECT setval('auth.roles_id_seq', 1, false)")
	log.Println("✅ Existing data cleared")
}

// ==================== SEED DATA FUNCTION ====================

func SeedData(force bool) error {
	var count int64
	DB.Model(&University{}).Count(&count)
	
	if count > 0 && !force {
		log.Println("⏭️  Seed data already exists. Use --force to re-seed.")
		return nil
	}

	if force && count > 0 {
		log.Println("⚠️  Force flag detected. Clearing existing data...")
		clearExistingData()
	}

	log.Println("🌱 Seeding comprehensive university data from dbData.md...")

	// ==================== UNIVERSITY ====================
	university := University{
		Name:            "National Technology University",
		ShortName:       "NTU",
		EstablishedYear: 1985,
		Address:         "University Road, Gachibowli",
		City:            "Hyderabad",
		State:           "Telangana",
		Country:         "India",
		Pincode:         "500032",
		Phone:           "040-12345678",
		Email:           "info@ntu.edu.in",
		Website:         "www.ntu.edu.in",
		ViceChancellor:  "Dr. Ramesh Sharma",
		Registrar:       "Dr. Sunita Reddy",
		Accreditation:   "NAAC",
		NAACGrade:       "A++",
		NIRFRank:        45,
		About:           "Premier technical university.",
		IsActive:        true,
	}
	DB.Create(&university)
	log.Println("✅ Created University")

	// ==================== COLLEGES (5 colleges as per dbData.md) ====================
	colleges := []College{
		{UniversityID: university.ID, Name: "College of Engineering & Technology", ShortName: "CET", Code: "CET", EstablishedYear: 2000, CollegeType: "Engineering", City: "Hyderabad", Phone: "040-11112222", Email: "cet@ntu.edu.in", PrincipalName: "Dr. Anil Kumar", IsActive: true},
		{UniversityID: university.ID, Name: "College of Science & Arts", ShortName: "CSA", Code: "CSA", EstablishedYear: 1990, CollegeType: "Science/Arts", City: "Hyderabad", Phone: "040-33334444", Email: "csa@ntu.edu.in", PrincipalName: "Dr. Priya Mehta", IsActive: true},
		{UniversityID: university.ID, Name: "College of Business Management", ShortName: "CBM", Code: "CBM", EstablishedYear: 1995, CollegeType: "Management", City: "Hyderabad", Phone: "040-55556666", Email: "cbm@ntu.edu.in", PrincipalName: "Dr. Suresh Rao", IsActive: true},
		{UniversityID: university.ID, Name: "College of Medical Sciences", ShortName: "CMS", Code: "CMS", EstablishedYear: 2005, CollegeType: "Medical", City: "Hyderabad", Phone: "040-77778888", Email: "cms@ntu.edu.in", PrincipalName: "Dr. Kavitha Nair", IsActive: true},
		{UniversityID: university.ID, Name: "College of Law", ShortName: "COL", Code: "LAW", EstablishedYear: 2010, CollegeType: "Law", City: "Hyderabad", Phone: "040-99990000", Email: "law@ntu.edu.in", PrincipalName: "Dr. Meera Reddy", IsActive: true},
	}
	for i := range colleges {
		DB.Create(&colleges[i])
	}
	cet := &colleges[0]
	log.Println("✅ Created 5 Colleges")

	// ==================== DEPARTMENTS (10 departments as per dbData.md) ====================
	departments := []Department{
		{CollegeID: cet.ID, Name: "Computer Science & Engineering", Code: "CSE", HODName: "Dr. Vikram Reddy", Phone: "040-1001", EstablishedYear: 2000, IsActive: true},
		{CollegeID: cet.ID, Name: "Electronics & Communication", Code: "ECE", HODName: "Dr. Sita Rao", Phone: "040-1002", EstablishedYear: 2001, IsActive: true},
		{CollegeID: cet.ID, Name: "Mechanical Engineering", Code: "MECH", HODName: "Dr. Ravi Teja", Phone: "040-1003", EstablishedYear: 2002, IsActive: true},
		{CollegeID: cet.ID, Name: "Civil Engineering", Code: "CIVIL", HODName: "Dr. Sunita Verma", Phone: "040-1004", EstablishedYear: 2003, IsActive: true},
		{CollegeID: cet.ID, Name: "Information Technology", Code: "IT", HODName: "Dr. Kiran Bose", Phone: "040-1005", EstablishedYear: 2004, IsActive: true},
		{CollegeID: colleges[1].ID, Name: "Physics", Code: "PHY", HODName: "Dr. Anand Patel", Phone: "040-2001", EstablishedYear: 1990, IsActive: true},
		{CollegeID: colleges[1].ID, Name: "Chemistry", Code: "CHEM", HODName: "Dr. Leela Devi", Phone: "040-2002", EstablishedYear: 1990, IsActive: true},
		{CollegeID: colleges[1].ID, Name: "Mathematics", Code: "MATH", HODName: "Dr. Mohan Lal", Phone: "040-2003", EstablishedYear: 1990, IsActive: true},
		{CollegeID: colleges[2].ID, Name: "MBA Department", Code: "MBA", HODName: "Dr. Geeta Singh", Phone: "040-3001", EstablishedYear: 1995, IsActive: true},
		{CollegeID: colleges[3].ID, Name: "General Medicine", Code: "MED", HODName: "Dr. Raj Kumar", Phone: "040-4001", EstablishedYear: 2005, IsActive: true},
	}
	for i := range departments {
		DB.Create(&departments[i])
	}
	deptCSE := &departments[0]
	deptECE := &departments[1]
	deptMBA := &departments[8]
	log.Println("✅ Created 10 Departments")

	// ==================== ACADEMIC YEARS (3 years) ====================
	academicYears := []AcademicYear{
		{YearLabel: "2022-2023", StartDate: ptr(time.Date(2022, 7, 1, 0, 0, 0, 0, time.UTC)), EndDate: ptr(time.Date(2023, 6, 30, 0, 0, 0, 0, time.UTC)), IsCurrent: false},
		{YearLabel: "2023-2024", StartDate: ptr(time.Date(2023, 7, 1, 0, 0, 0, 0, time.UTC)), EndDate: ptr(time.Date(2024, 6, 30, 0, 0, 0, 0, time.UTC)), IsCurrent: false},
		{YearLabel: "2024-2025", StartDate: ptr(time.Date(2024, 7, 1, 0, 0, 0, 0, time.UTC)), EndDate: ptr(time.Date(2025, 6, 30, 0, 0, 0, 0, time.UTC)), IsCurrent: true},
	}
	for i := range academicYears {
		DB.Create(&academicYears[i])
	}
	_ = &academicYears[2] // Current year (for reference)
	log.Println("✅ Created Academic Years")

	// ==================== SEMESTERS (6 semesters) ====================
	semesters := []Semester{
		{AcademicYearID: academicYears[2].ID, SemesterNumber: 1, SemesterName: "Odd", StartDate: ptr(time.Date(2024, 7, 1, 0, 0, 0, 0, time.UTC)), EndDate: ptr(time.Date(2024, 11, 30, 0, 0, 0, 0, time.UTC)), IsCurrent: false},
		{AcademicYearID: academicYears[2].ID, SemesterNumber: 2, SemesterName: "Even", StartDate: ptr(time.Date(2025, 1, 1, 0, 0, 0, 0, time.UTC)), EndDate: ptr(time.Date(2025, 5, 31, 0, 0, 0, 0, time.UTC)), IsCurrent: true},
		{AcademicYearID: academicYears[1].ID, SemesterNumber: 3, SemesterName: "Odd", StartDate: ptr(time.Date(2023, 7, 1, 0, 0, 0, 0, time.UTC)), EndDate: ptr(time.Date(2023, 11, 30, 0, 0, 0, 0, time.UTC)), IsCurrent: false},
		{AcademicYearID: academicYears[1].ID, SemesterNumber: 4, SemesterName: "Even", StartDate: ptr(time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)), EndDate: ptr(time.Date(2024, 5, 31, 0, 0, 0, 0, time.UTC)), IsCurrent: false},
		{AcademicYearID: academicYears[0].ID, SemesterNumber: 5, SemesterName: "Odd", StartDate: ptr(time.Date(2022, 7, 1, 0, 0, 0, 0, time.UTC)), EndDate: ptr(time.Date(2022, 11, 30, 0, 0, 0, 0, time.UTC)), IsCurrent: false},
		{AcademicYearID: academicYears[0].ID, SemesterNumber: 6, SemesterName: "Even", StartDate: ptr(time.Date(2023, 1, 1, 0, 0, 0, 0, time.UTC)), EndDate: ptr(time.Date(2023, 5, 31, 0, 0, 0, 0, time.UTC)), IsCurrent: false},
	}
	for i := range semesters {
		DB.Create(&semesters[i])
	}
	log.Println("✅ Created Semesters")

	// ==================== PROGRAMS (9 programs) ====================
	programs := []Program{
		{DepartmentID: deptCSE.ID, Name: "B.Tech Computer Science & Engineering", Code: "BTECH-CSE", DegreeType: "B.Tech", DurationYears: 4, TotalSemesters: 8, TotalCredits: 160, IntakeCapacity: 120, IsActive: true},
		{DepartmentID: deptCSE.ID, Name: "M.Tech Computer Science", Code: "MTECH-CSE", DegreeType: "M.Tech", DurationYears: 2, TotalSemesters: 4, TotalCredits: 80, IntakeCapacity: 30, IsActive: true},
		{DepartmentID: deptCSE.ID, Name: "PhD Computer Science", Code: "PHD-CSE", DegreeType: "PhD", DurationYears: 3, TotalSemesters: 6, TotalCredits: 120, IntakeCapacity: 10, IsActive: true},
		{DepartmentID: deptECE.ID, Name: "B.Tech Electronics & Communication", Code: "BTECH-ECE", DegreeType: "B.Tech", DurationYears: 4, TotalSemesters: 8, TotalCredits: 160, IntakeCapacity: 90, IsActive: true},
		{DepartmentID: departments[2].ID, Name: "B.Tech Mechanical Engineering", Code: "BTECH-MECH", DegreeType: "B.Tech", DurationYears: 4, TotalSemesters: 8, TotalCredits: 160, IntakeCapacity: 90, IsActive: true},
		{DepartmentID: departments[3].ID, Name: "B.Tech Civil Engineering", Code: "BTECH-CIVIL", DegreeType: "B.Tech", DurationYears: 4, TotalSemesters: 8, TotalCredits: 160, IntakeCapacity: 60, IsActive: true},
		{DepartmentID: departments[4].ID, Name: "B.Tech Information Technology", Code: "BTECH-IT", DegreeType: "B.Tech", DurationYears: 4, TotalSemesters: 8, TotalCredits: 160, IntakeCapacity: 90, IsActive: true},
		{DepartmentID: deptMBA.ID, Name: "Master of Business Administration", Code: "MBA-GEN", DegreeType: "MBA", DurationYears: 2, TotalSemesters: 4, TotalCredits: 100, IntakeCapacity: 60, IsActive: true},
		{DepartmentID: departments[7].ID, Name: "B.Sc Mathematics", Code: "BSC-MATH", DegreeType: "B.Sc", DurationYears: 3, TotalSemesters: 6, TotalCredits: 120, IntakeCapacity: 60, IsActive: true},
	}
	for i := range programs {
		DB.Create(&programs[i])
	}
	progBtechCSE := &programs[0]
	progBtechECE := &programs[3]
	progMBA := &programs[7]
	log.Println("✅ Created 9 Programs")

	// ==================== SUBJECTS (16 subjects as per dbData.md) ====================
	subjects := []Subject{
		{DepartmentID: deptCSE.ID, SubjectCode: "CSE101", SubjectName: "Programming Fundamentals", Credits: 4, SubjectType: "Theory", LectureHours: 3, LabHours: 2, SemesterNumber: 1, IsActive: true},
		{DepartmentID: departments[7].ID, SubjectCode: "MATH101", SubjectName: "Engineering Mathematics I", Credits: 4, SubjectType: "Theory", LectureHours: 4, LabHours: 0, SemesterNumber: 1, IsActive: true},
		{DepartmentID: deptCSE.ID, SubjectCode: "CSE102", SubjectName: "Data Structures & Algorithms", Credits: 4, SubjectType: "Theory", LectureHours: 3, LabHours: 2, SemesterNumber: 2, IsActive: true},
		{DepartmentID: deptCSE.ID, SubjectCode: "CSE201", SubjectName: "Database Management Systems", Credits: 4, SubjectType: "Theory", LectureHours: 3, LabHours: 2, SemesterNumber: 3, IsActive: true},
		{DepartmentID: deptCSE.ID, SubjectCode: "CSE202", SubjectName: "Operating Systems", Credits: 3, SubjectType: "Theory", LectureHours: 3, LabHours: 0, SemesterNumber: 3, IsActive: true},
		{DepartmentID: deptCSE.ID, SubjectCode: "CSE203", SubjectName: "Computer Networks", Credits: 3, SubjectType: "Theory", LectureHours: 3, LabHours: 0, SemesterNumber: 4, IsActive: true},
		{DepartmentID: deptCSE.ID, SubjectCode: "CSE301", SubjectName: "Machine Learning", Credits: 4, SubjectType: "Theory", LectureHours: 3, LabHours: 2, SemesterNumber: 5, IsActive: true},
		{DepartmentID: deptCSE.ID, SubjectCode: "CSE302", SubjectName: "Artificial Intelligence", Credits: 4, SubjectType: "Theory", LectureHours: 3, LabHours: 2, SemesterNumber: 5, IsActive: true},
		{DepartmentID: deptCSE.ID, SubjectCode: "CSE303", SubjectName: "Web Technologies", Credits: 3, SubjectType: "Theory", LectureHours: 2, LabHours: 2, SemesterNumber: 5, IsActive: true},
		{DepartmentID: deptCSE.ID, SubjectCode: "CSE401", SubjectName: "Cloud Computing", Credits: 3, SubjectType: "Elective", LectureHours: 3, LabHours: 0, SemesterNumber: 7, IsActive: true},
		{DepartmentID: deptCSE.ID, SubjectCode: "CSE402", SubjectName: "Cyber Security", Credits: 3, SubjectType: "Elective", LectureHours: 3, LabHours: 0, SemesterNumber: 7, IsActive: true},
		{DepartmentID: deptCSE.ID, SubjectCode: "CSE403", SubjectName: "Capstone Project", Credits: 6, SubjectType: "Project", LectureHours: 0, LabHours: 12, SemesterNumber: 8, IsActive: true},
		{DepartmentID: deptECE.ID, SubjectCode: "ECE101", SubjectName: "Basic Electronics", Credits: 4, SubjectType: "Theory", LectureHours: 3, LabHours: 2, SemesterNumber: 1, IsActive: true},
		{DepartmentID: deptMBA.ID, SubjectCode: "MBA101", SubjectName: "Principles of Management", Credits: 4, SubjectType: "Theory", LectureHours: 4, LabHours: 0, SemesterNumber: 1, IsActive: true},
		{DepartmentID: deptMBA.ID, SubjectCode: "MBA102", SubjectName: "Business Economics", Credits: 4, SubjectType: "Theory", LectureHours: 4, LabHours: 0, SemesterNumber: 1, IsActive: true},
	}
	for i := range subjects {
		DB.Create(&subjects[i])
	}
	log.Println("✅ Created 16 Subjects")

	// ==================== FEE CATEGORIES (7 categories) ====================
	feeCategories := []FeeCategory{
		{Name: "Tuition Fee", Description: "Academic tuition fee"},
		{Name: "Exam Fee", Description: "Semester examination fee"},
		{Name: "Lab Fee", Description: "Laboratory and practical fee"},
		{Name: "Library Fee", Description: "Library membership fee"},
		{Name: "Hostel Fee", Description: "Hostel accommodation fee"},
		{Name: "Transport Fee", Description: "Bus/transport fee"},
		{Name: "Misc Fee", Description: "Miscellaneous charges"},
	}
	for i := range feeCategories {
		DB.Create(&feeCategories[i])
	}
	log.Println("✅ Created 7 Fee Categories")

	// ==================== FEE STRUCTURES ====================
	// Get academic year and programs for references
	var academicYear AcademicYear
	DB.Where("year_label = ?", "2024-2025").First(&academicYear)
	
	var btechCSE, btechECE, mba Program
	DB.Where("code = ?", "B.Tech-CSE").First(&btechCSE)
	DB.Where("code = ?", "B.Tech-ECE").First(&btechECE)
	DB.Where("code = ?", "MBA").First(&mba)
	
	feeStructures := []FeeStructure{
		// B.Tech CSE - Semester 1
		{ProgramID: btechCSE.ID, AcademicYearID: academicYear.ID, SemesterNumber: 1, CategoryID: feeCategories[0].ID, Amount: 60000.00, DueDate: ptr(time.Date(2024, 7, 31, 0, 0, 0, 0, time.UTC)), LateFinePerDay: 50},
		{ProgramID: btechCSE.ID, AcademicYearID: academicYear.ID, SemesterNumber: 1, CategoryID: feeCategories[1].ID, Amount: 3000.00, DueDate: ptr(time.Date(2024, 7, 31, 0, 0, 0, 0, time.UTC)), LateFinePerDay: 10},
		{ProgramID: btechCSE.ID, AcademicYearID: academicYear.ID, SemesterNumber: 1, CategoryID: feeCategories[2].ID, Amount: 5000.00, DueDate: ptr(time.Date(2024, 7, 31, 0, 0, 0, 0, time.UTC)), LateFinePerDay: 10},
		{ProgramID: btechCSE.ID, AcademicYearID: academicYear.ID, SemesterNumber: 1, CategoryID: feeCategories[3].ID, Amount: 1000.00, DueDate: ptr(time.Date(2024, 7, 31, 0, 0, 0, 0, time.UTC)), LateFinePerDay: 5},
		{ProgramID: btechCSE.ID, AcademicYearID: academicYear.ID, SemesterNumber: 1, CategoryID: feeCategories[4].ID, Amount: 20000.00, DueDate: ptr(time.Date(2024, 7, 31, 0, 0, 0, 0, time.UTC)), LateFinePerDay: 20},
		{ProgramID: btechCSE.ID, AcademicYearID: academicYear.ID, SemesterNumber: 1, CategoryID: feeCategories[6].ID, Amount: 2000.00, DueDate: ptr(time.Date(2024, 7, 31, 0, 0, 0, 0, time.UTC)), LateFinePerDay: 5},
		// B.Tech ECE - Semester 1
		{ProgramID: btechECE.ID, AcademicYearID: academicYear.ID, SemesterNumber: 1, CategoryID: feeCategories[0].ID, Amount: 55000.00, DueDate: ptr(time.Date(2024, 7, 31, 0, 0, 0, 0, time.UTC)), LateFinePerDay: 50},
		{ProgramID: btechECE.ID, AcademicYearID: academicYear.ID, SemesterNumber: 1, CategoryID: feeCategories[1].ID, Amount: 3000.00, DueDate: ptr(time.Date(2024, 7, 31, 0, 0, 0, 0, time.UTC)), LateFinePerDay: 10},
		{ProgramID: btechECE.ID, AcademicYearID: academicYear.ID, SemesterNumber: 1, CategoryID: feeCategories[2].ID, Amount: 5000.00, DueDate: ptr(time.Date(2024, 7, 31, 0, 0, 0, 0, time.UTC)), LateFinePerDay: 10},
		{ProgramID: btechECE.ID, AcademicYearID: academicYear.ID, SemesterNumber: 1, CategoryID: feeCategories[3].ID, Amount: 1000.00, DueDate: ptr(time.Date(2024, 7, 31, 0, 0, 0, 0, time.UTC)), LateFinePerDay: 5},
		// MBA - Semester 1
		{ProgramID: mba.ID, AcademicYearID: academicYear.ID, SemesterNumber: 1, CategoryID: feeCategories[0].ID, Amount: 80000.00, DueDate: ptr(time.Date(2024, 7, 31, 0, 0, 0, 0, time.UTC)), LateFinePerDay: 100},
		{ProgramID: mba.ID, AcademicYearID: academicYear.ID, SemesterNumber: 1, CategoryID: feeCategories[1].ID, Amount: 4000.00, DueDate: ptr(time.Date(2024, 7, 31, 0, 0, 0, 0, time.UTC)), LateFinePerDay: 20},
		{ProgramID: mba.ID, AcademicYearID: academicYear.ID, SemesterNumber: 1, CategoryID: feeCategories[6].ID, Amount: 3000.00, DueDate: ptr(time.Date(2024, 7, 31, 0, 0, 0, 0, time.UTC)), LateFinePerDay: 10},
	}
	for i := range feeStructures {
		DB.Create(&feeStructures[i])
	}
	log.Println("✅ Created 13 Fee Structures")

	// ==================== ROLES (8 roles in new order) ====================
	roleNames := []string{
		"university_admin",   // ID 1
		"finance_controller", // ID 2
		"registrar",          // ID 3
		"college_admin",      // ID 4
		"hod",                // ID 5
		"faculty",            // ID 6
		"student",            // ID 7
		"staff",              // ID 8
	}
	roles := make([]Role, len(roleNames))
	for i, name := range roleNames {
		role := Role{RoleName: name}
		DB.FirstOrCreate(&role, Role{RoleName: name})
		roles[i] = role
		log.Printf("   Role %d: %s (ID: %d)", i+1, name, role.ID)
	}
	log.Println("✅ Created/Verified 8 Roles")

	// ==================== USERS (20 users) ====================
	users := []User{
		// University Admin (role_id 1)
		{Username: "univ.admin", Email: "univadmin@ntu.edu.in", PasswordHash: hashPassword("Admin@123"), RoleID: roles[0].ID, IsActive: true, IsVerified: true},
		// Finance Controller (role_id 2)
		{Username: "finance.ctrl", Email: "finance@ntu.edu.in", PasswordHash: hashPassword("Admin@123"), RoleID: roles[1].ID, IsActive: true, IsVerified: true},
		// Registrar (role_id 3)
		{Username: "registrar.ctrl", Email: "registrar@ntu.edu.in", PasswordHash: hashPassword("Admin@123"), RoleID: roles[2].ID, IsActive: true, IsVerified: true},
		// College Admin (role_id 4)
		{Username: "cet.admin", Email: "cetadmin@ntu.edu.in", PasswordHash: hashPassword("Admin@123"), RoleID: roles[3].ID, IsActive: true, IsVerified: true},
		// Faculty (3) (role_id 6)
		{Username: "rajesh.kumar", Email: "rajesh.kumar@ntu.edu.in", PasswordHash: hashPassword("Faculty@123"), RoleID: roles[5].ID, IsActive: true, IsVerified: true},
		{Username: "anjali.sharma", Email: "anjali.sharma@ntu.edu.in", PasswordHash: hashPassword("Faculty@123"), RoleID: roles[5].ID, IsActive: true, IsVerified: true},
		{Username: "suresh.patil", Email: "suresh.patil@ntu.edu.in", PasswordHash: hashPassword("Faculty@123"), RoleID: roles[5].ID, IsActive: true, IsVerified: true},
		// Students (13) (role_id 7)
		{Username: "22cse001", Email: "22cse001@student.ntu.edu.in", PasswordHash: hashPassword("Student@123"), RoleID: roles[6].ID, IsActive: true, IsVerified: true},
		{Username: "22cse002", Email: "22cse002@student.ntu.edu.in", PasswordHash: hashPassword("Student@123"), RoleID: roles[6].ID, IsActive: true, IsVerified: true},
		{Username: "22cse003", Email: "22cse003@student.ntu.edu.in", PasswordHash: hashPassword("Student@123"), RoleID: roles[6].ID, IsActive: true, IsVerified: true},
		{Username: "22cse004", Email: "22cse004@student.ntu.edu.in", PasswordHash: hashPassword("Student@123"), RoleID: roles[6].ID, IsActive: true, IsVerified: true},
		{Username: "23cse001", Email: "23cse001@student.ntu.edu.in", PasswordHash: hashPassword("Student@123"), RoleID: roles[6].ID, IsActive: true, IsVerified: true},
		{Username: "23cse002", Email: "23cse002@student.ntu.edu.in", PasswordHash: hashPassword("Student@123"), RoleID: roles[6].ID, IsActive: true, IsVerified: true},
		{Username: "22ece001", Email: "22ece001@student.ntu.edu.in", PasswordHash: hashPassword("Student@123"), RoleID: roles[6].ID, IsActive: true, IsVerified: true},
		{Username: "22ece002", Email: "22ece002@student.ntu.edu.in", PasswordHash: hashPassword("Student@123"), RoleID: roles[6].ID, IsActive: true, IsVerified: true},
		{Username: "23mba001", Email: "23mba001@student.ntu.edu.in", PasswordHash: hashPassword("Student@123"), RoleID: roles[6].ID, IsActive: true, IsVerified: true},
		{Username: "23mba002", Email: "23mba002@student.ntu.edu.in", PasswordHash: hashPassword("Student@123"), RoleID: roles[6].ID, IsActive: true, IsVerified: true},
		{Username: "24cse001", Email: "24cse001@student.ntu.edu.in", PasswordHash: hashPassword("Student@123"), RoleID: roles[6].ID, IsActive: true, IsVerified: true},
		{Username: "24cse002", Email: "24cse002@student.ntu.edu.in", PasswordHash: hashPassword("Student@123"), RoleID: roles[6].ID, IsActive: true, IsVerified: true},
		{Username: "24cse003", Email: "24cse003@student.ntu.edu.in", PasswordHash: hashPassword("Student@123"), RoleID: roles[6].ID, IsActive: true, IsVerified: true},
	}
	for i := range users {
		DB.Create(&users[i])
	}
	faculty1 := &users[4]  // rajesh.kumar
	faculty2 := &users[5]  // anjali.sharma
	faculty3 := &users[6]  // suresh.patil
	log.Println("✅ Created 20 Users (University Admin, Finance Controller, Registrar, College Admin, 3 Faculty, 13 Students)")

	// ==================== FACULTY PROFILES (3 profiles with complete data) ====================
	facultyProfiles := []Faculty{
		{UserID: faculty1.ID, DepartmentID: &deptCSE.ID, EmployeeCode: "FAC001", FirstName: "Rajesh", LastName: "Kumar", Gender: "Male", DOB: ptr(time.Date(1978, 5, 15, 0, 0, 0, 0, time.UTC)), Phone: "9876543210", Designation: "Professor", Qualification: "PhD (Computer Science)", Specialization: "Machine Learning & AI", ExperienceYears: 19, JoiningDate: ptr(time.Date(2005, 6, 1, 0, 0, 0, 0, time.UTC)), Salary: 95000.00, IsActive: true},
		{UserID: faculty2.ID, DepartmentID: &deptCSE.ID, EmployeeCode: "FAC002", FirstName: "Anjali", LastName: "Sharma", Gender: "Female", DOB: ptr(time.Date(1985, 8, 22, 0, 0, 0, 0, time.UTC)), Phone: "9876543211", Designation: "Associate Professor", Qualification: "PhD (Artificial Intelligence)", Specialization: "Deep Learning & NLP", ExperienceYears: 14, JoiningDate: ptr(time.Date(2010, 7, 15, 0, 0, 0, 0, time.UTC)), Salary: 78000.00, IsActive: true},
		{UserID: faculty3.ID, DepartmentID: &deptCSE.ID, EmployeeCode: "FAC003", FirstName: "Suresh", LastName: "Patil", Gender: "Male", DOB: ptr(time.Date(1990, 3, 10, 0, 0, 0, 0, time.UTC)), Phone: "9876543212", Designation: "Assistant Professor", Qualification: "M.Tech (CSE)", Specialization: "Database Systems & Cloud", ExperienceYears: 9, JoiningDate: ptr(time.Date(2015, 8, 1, 0, 0, 0, 0, time.UTC)), Salary: 58000.00, IsActive: true},
	}
	for i := range facultyProfiles {
		DB.Create(&facultyProfiles[i])
	}
	log.Println("✅ Created 3 Faculty Profiles")

	// Update HOD user references
	deptCSE.HODUserID = &faculty1.ID
	DB.Save(deptCSE)

	// ==================== UNIVERSITY ADMIN ====================
	univAdminUser := &users[0] // univ.admin
	universityAdmin := UniversityAdmin{
		UniversityID: university.ID,
		UserID:       &univAdminUser.ID,
		Designation:  "Chief Administrative Officer",
	}
	DB.Create(&universityAdmin)
	log.Println("✅ Created University Admin")

	// ==================== COLLEGE ADMIN ====================
	collegeAdminUser := &users[3] // cet.admin
	collegeAdmin := CollegeAdmin{
		CollegeID:   cet.ID,
		UserID:      &collegeAdminUser.ID,
		Designation: "College Administrator",
	}
	DB.Create(&collegeAdmin)
	log.Println("✅ Created College Admin")

	// ==================== STUDENTS (13 students with complete data from dbData.md) ====================
	studentData := []struct {
		UserIdx       int
		ProgramID     uint
		RollNumber    string
		UniversityReg string
		FirstName     string
		LastName      string
		Gender        string
		DOB           time.Time
		BloodGroup    string
		Phone         string
		PersonalEmail string
		Address       string
		City          string
		State         string
		Pincode       string
		Category      string
		AdmissionYear int
		CurSemester   int
		Batch         string
		Section       string
	}{
		{7, progBtechCSE.ID, "22CSE001", "NTU22CSE001", "Arjun", "Mehta", "Male", time.Date(2004, 6, 15, 0, 0, 0, 0, time.UTC), "O+", "9111111101", "arjun.mehta@gmail.com", "12 MG Road", "Hyderabad", "Telangana", "500001", "General", 2022, 6, "2022-2026", "A"},
		{8, progBtechCSE.ID, "22CSE002", "NTU22CSE002", "Priya", "Nair", "Female", time.Date(2004, 9, 20, 0, 0, 0, 0, time.UTC), "A+", "9111111102", "priya.nair@gmail.com", "45 Banjara Hills", "Hyderabad", "Telangana", "500034", "OBC", 2022, 6, "2022-2026", "A"},
		{9, progBtechCSE.ID, "22CSE003", "NTU22CSE003", "Rohan", "Gupta", "Male", time.Date(2004, 1, 8, 0, 0, 0, 0, time.UTC), "B+", "9111111103", "rohan.gupta@gmail.com", "78 Jubilee Hills", "Hyderabad", "Telangana", "500033", "SC", 2022, 6, "2022-2026", "A"},
		{10, progBtechCSE.ID, "22CSE004", "NTU22CSE004", "Kavya", "Reddy", "Female", time.Date(2004, 11, 2, 0, 0, 0, 0, time.UTC), "B-", "9111111104", "kavya.reddy@gmail.com", "22 SR Nagar", "Hyderabad", "Telangana", "500038", "General", 2022, 6, "2022-2026", "B"},
		{11, progBtechCSE.ID, "23CSE001", "NTU23CSE001", "Sneha", "Joshi", "Female", time.Date(2005, 3, 14, 0, 0, 0, 0, time.UTC), "AB+", "9111111105", "sneha.joshi@gmail.com", "33 Ameerpet", "Hyderabad", "Telangana", "500016", "General", 2023, 4, "2023-2027", "A"},
		{12, progBtechCSE.ID, "23CSE002", "NTU23CSE002", "Aman", "Singh", "Male", time.Date(2005, 7, 25, 0, 0, 0, 0, time.UTC), "O-", "9111111106", "aman.singh@gmail.com", "56 Begumpet", "Hyderabad", "Telangana", "500003", "OBC", 2023, 4, "2023-2027", "B"},
		{13, progBtechECE.ID, "22ECE001", "NTU22ECE001", "Nikhil", "Tiwari", "Male", time.Date(2004, 4, 18, 0, 0, 0, 0, time.UTC), "A-", "9111111107", "nikhil.tiwari@gmail.com", "89 LB Nagar", "Hyderabad", "Telangana", "500074", "ST", 2022, 6, "2022-2026", "A"},
		{14, progBtechECE.ID, "22ECE002", "NTU22ECE002", "Deepika", "Pillai", "Female", time.Date(2001, 8, 30, 0, 0, 0, 0, time.UTC), "O+", "9111111108", "deepika.pillai@gmail.com", "14 Madhapur", "Hyderabad", "Telangana", "500081", "General", 2023, 2, "2023-2025", "A"},
		{15, progMBA.ID, "23MBA001", "NTU23MBA001", "Rahul", "Agarwal", "Male", time.Date(2000, 12, 5, 0, 0, 0, 0, time.UTC), "B+", "9111111109", "rahul.agarwal@gmail.com", "67 Gachibowli", "Hyderabad", "Telangana", "500032", "General", 2023, 2, "2023-2025", "A"},
		{16, progMBA.ID, "23MBA002", "NTU23MBA002", "Divya", "Kapoor", "Female", time.Date(2006, 5, 19, 0, 0, 0, 0, time.UTC), "AB-", "9111111110", "divya.kapoor@gmail.com", "90 Kukatpally", "Hyderabad", "Telangana", "500072", "OBC", 2024, 2, "2024-2028", "A"},
		{17, progBtechCSE.ID, "24CSE001", "NTU24CSE001", "Karthik", "Rajan", "Male", time.Date(2006, 4, 10, 0, 0, 0, 0, time.UTC), "O+", "9111111111", "karthik.rajan@gmail.com", "11 Dilsukhnagar", "Hyderabad", "Telangana", "500060", "General", 2024, 2, "2024-2028", "B"},
		{18, progBtechCSE.ID, "24CSE002", "NTU24CSE002", "Pallavi", "Nanda", "Female", time.Date(2006, 8, 22, 0, 0, 0, 0, time.UTC), "A+", "9111111112", "pallavi.nanda@gmail.com", "55 Uppal", "Hyderabad", "Telangana", "500039", "OBC", 2024, 2, "2024-2028", "B"},
		{19, progBtechCSE.ID, "24CSE003", "NTU24CSE003", "Sai", "Krishna", "Male", time.Date(2006, 2, 28, 0, 0, 0, 0, time.UTC), "O+", "9111111113", "sai.krishna@gmail.com", "77 Hitech City", "Hyderabad", "Telangana", "500081", "SC", 2024, 2, "2024-2028", "A"},
	}

	students := make([]*Student, len(studentData))
	for i, sd := range studentData {
		student := &Student{
			UserID:          users[sd.UserIdx].ID,
			ProgramID:       &sd.ProgramID,
			RollNumber:      sd.RollNumber,
			UniversityRegNo: sd.UniversityReg,
			FirstName:       sd.FirstName,
			LastName:        sd.LastName,
			Gender:          sd.Gender,
			DOB:             &sd.DOB,
			BloodGroup:      sd.BloodGroup,
			Phone:           sd.Phone,
			PersonalEmail:   sd.PersonalEmail,
			Address:         sd.Address,
			City:            sd.City,
			State:           sd.State,
			Pincode:         sd.Pincode,
			Category:        sd.Category,
			AdmissionYear:   sd.AdmissionYear,
			CurrentSemester: sd.CurSemester,
			Batch:           sd.Batch,
			Section:         sd.Section,
			IsActive:        true,
		}
		DB.Create(student)
		students[i] = student
	}
	log.Println("✅ Created 13 Students with complete profiles")

	// ==================== ADMISSIONS (13 admissions) ====================
	admissions := []Admission{
		{ApplicationID: 1, StudentID: students[0].ID, ProgramID: btechCSE.ID, AcademicYearID: academicYear.ID, AdmissionDate: ptr(time.Date(2024, 7, 1, 0, 0, 0, 0, time.UTC)), AdmissionNumber: "ADM-2024-001", EnrollmentNumber: "ENR-2024-001", Status: "admitted", IsActive: true},
		{ApplicationID: 2, StudentID: students[1].ID, ProgramID: btechCSE.ID, AcademicYearID: academicYear.ID, AdmissionDate: ptr(time.Date(2024, 7, 1, 0, 0, 0, 0, time.UTC)), AdmissionNumber: "ADM-2024-002", EnrollmentNumber: "ENR-2024-002", Status: "admitted", IsActive: true},
		{ApplicationID: 3, StudentID: students[2].ID, ProgramID: btechCSE.ID, AcademicYearID: academicYear.ID, AdmissionDate: ptr(time.Date(2024, 7, 1, 0, 0, 0, 0, time.UTC)), AdmissionNumber: "ADM-2024-003", EnrollmentNumber: "ENR-2024-003", Status: "admitted", IsActive: true},
		{ApplicationID: 4, StudentID: students[3].ID, ProgramID: btechCSE.ID, AcademicYearID: academicYear.ID, AdmissionDate: ptr(time.Date(2024, 7, 1, 0, 0, 0, 0, time.UTC)), AdmissionNumber: "ADM-2024-004", EnrollmentNumber: "ENR-2024-004", Status: "admitted", IsActive: true},
		{ApplicationID: 5, StudentID: students[4].ID, ProgramID: btechCSE.ID, AcademicYearID: academicYear.ID, AdmissionDate: ptr(time.Date(2024, 7, 1, 0, 0, 0, 0, time.UTC)), AdmissionNumber: "ADM-2024-005", EnrollmentNumber: "ENR-2024-005", Status: "admitted", IsActive: true},
		{ApplicationID: 6, StudentID: students[5].ID, ProgramID: btechECE.ID, AcademicYearID: academicYear.ID, AdmissionDate: ptr(time.Date(2024, 7, 1, 0, 0, 0, 0, time.UTC)), AdmissionNumber: "ADM-2024-006", EnrollmentNumber: "ENR-2024-006", Status: "admitted", IsActive: true},
		{ApplicationID: 7, StudentID: students[6].ID, ProgramID: btechECE.ID, AcademicYearID: academicYear.ID, AdmissionDate: ptr(time.Date(2024, 7, 1, 0, 0, 0, 0, time.UTC)), AdmissionNumber: "ADM-2024-007", EnrollmentNumber: "ENR-2024-007", Status: "admitted", IsActive: true},
		{ApplicationID: 8, StudentID: students[7].ID, ProgramID: mba.ID, AcademicYearID: academicYear.ID, AdmissionDate: ptr(time.Date(2024, 7, 1, 0, 0, 0, 0, time.UTC)), AdmissionNumber: "ADM-2024-008", EnrollmentNumber: "ENR-2024-008", Status: "admitted", IsActive: true},
		{ApplicationID: 9, StudentID: students[8].ID, ProgramID: mba.ID, AcademicYearID: academicYear.ID, AdmissionDate: ptr(time.Date(2024, 7, 1, 0, 0, 0, 0, time.UTC)), AdmissionNumber: "ADM-2024-009", EnrollmentNumber: "ENR-2024-009", Status: "admitted", IsActive: true},
		{ApplicationID: 10, StudentID: students[9].ID, ProgramID: btechCSE.ID, AcademicYearID: academicYear.ID, AdmissionDate: ptr(time.Date(2025, 1, 1, 0, 0, 0, 0, time.UTC)), AdmissionNumber: "ADM-2025-010", EnrollmentNumber: "ENR-2025-010", Status: "admitted", IsActive: true},
		{ApplicationID: 11, StudentID: students[10].ID, ProgramID: btechCSE.ID, AcademicYearID: academicYear.ID, AdmissionDate: ptr(time.Date(2024, 7, 1, 0, 0, 0, 0, time.UTC)), AdmissionNumber: "ADM-2024-011", EnrollmentNumber: "ENR-2024-011", Status: "admitted", IsActive: true},
		{ApplicationID: 12, StudentID: students[11].ID, ProgramID: btechCSE.ID, AcademicYearID: academicYear.ID, AdmissionDate: ptr(time.Date(2024, 7, 1, 0, 0, 0, 0, time.UTC)), AdmissionNumber: "ADM-2024-012", EnrollmentNumber: "ENR-2024-012", Status: "admitted", IsActive: true},
		{ApplicationID: 13, StudentID: students[12].ID, ProgramID: btechCSE.ID, AcademicYearID: academicYear.ID, AdmissionDate: ptr(time.Date(2024, 7, 1, 0, 0, 0, 0, time.UTC)), AdmissionNumber: "ADM-2024-013", EnrollmentNumber: "ENR-2024-013", Status: "admitted", IsActive: true},
	}
	for i := range admissions {
		DB.Create(&admissions[i])
	}
	log.Println("✅ Created 13 Admissions")

	// ==================== STUDENT PARENTS (10 parents) ====================
	parents := []StudentParent{
		{StudentID: students[0].ID, FatherName: "Suresh Mehta", FatherPhone: "9222222201", FatherEmail: "suresh.mehta@gmail.com", FatherOccupation: "Engineer", MotherName: "Lata Mehta", MotherPhone: "9222222202", MotherOccupation: "Teacher", AnnualIncome: 850000},
		{StudentID: students[1].ID, FatherName: "Krishnan Nair", FatherPhone: "9222222203", FatherEmail: "krishnan.nair@gmail.com", FatherOccupation: "Doctor", MotherName: "Suma Nair", MotherPhone: "9222222204", MotherOccupation: "Homemaker", AnnualIncome: 1200000},
		{StudentID: students[2].ID, FatherName: "Vijay Gupta", FatherPhone: "9222222205", FatherEmail: "vijay.gupta@gmail.com", FatherOccupation: "Farmer", MotherName: "Rani Gupta", MotherPhone: "9222222206", MotherOccupation: "Homemaker", AnnualIncome: 300000},
		{StudentID: students[3].ID, FatherName: "Reddy Venkat", FatherPhone: "9222222207", FatherEmail: "reddy.venkat@gmail.com", FatherOccupation: "Civil Engineer", MotherName: "Sunitha Reddy", MotherPhone: "9222222208", MotherOccupation: "Doctor", AnnualIncome: 1100000},
		{StudentID: students[4].ID, FatherName: "Ramesh Joshi", FatherPhone: "9222222209", FatherEmail: "ramesh.joshi@gmail.com", FatherOccupation: "Businessman", MotherName: "Suman Joshi", MotherPhone: "9222222210", MotherOccupation: "Accountant", AnnualIncome: 950000},
		{StudentID: students[5].ID, FatherName: "Harpal Singh", FatherPhone: "9222222211", FatherEmail: "harpal.singh@gmail.com", FatherOccupation: "Army Officer", MotherName: "Gurpreet Kaur", MotherPhone: "9222222212", MotherOccupation: "Teacher", AnnualIncome: 700000},
		{StudentID: students[6].ID, FatherName: "Mohan Tiwari", FatherPhone: "9222222213", FatherEmail: "mohan.tiwari@gmail.com", FatherOccupation: "Shop Owner", MotherName: "Geeta Tiwari", MotherPhone: "9222222214", MotherOccupation: "Homemaker", AnnualIncome: 450000},
		{StudentID: students[7].ID, FatherName: "Ravi Pillai", FatherPhone: "9222222215", FatherEmail: "ravi.pillai@gmail.com", FatherOccupation: "Banker", MotherName: "Sree Pillai", MotherPhone: "9222222216", MotherOccupation: "Nurse", AnnualIncome: 780000},
		{StudentID: students[8].ID, FatherName: "Anil Agarwal", FatherPhone: "9222222217", FatherEmail: "anil.agarwal@gmail.com", FatherOccupation: "CA", MotherName: "Ritu Agarwal", MotherPhone: "9222222218", MotherOccupation: "Teacher", AnnualIncome: 1500000},
		{StudentID: students[9].ID, FatherName: "Raj Kapoor", FatherPhone: "9222222219", FatherEmail: "raj.kapoor@gmail.com", FatherOccupation: "Architect", MotherName: "Neha Kapoor", MotherPhone: "9222222220", MotherOccupation: "Interior Designer", AnnualIncome: 900000},
	}
	for i := range parents {
		DB.Create(&parents[i])
	}
	log.Println("✅ Created 10 Student Parents")

	// ==================== STUDENT FEE INVOICES (10 invoices) ====================
	invoices := []StudentFeeInvoice{
		{StudentID: students[0].ID, AcademicYearID: academicYear.ID, SemesterNumber: 1, TotalAmount: 91000.00, DiscountAmount: 0.00, FineAmount: 0.00, NetAmount: 91000.00, PaidAmount: 91000.00, BalanceDue: 0.00, Status: "Paid", DueDate: ptr(time.Date(2024, 7, 31, 0, 0, 0, 0, time.UTC))},
		{StudentID: students[1].ID, AcademicYearID: academicYear.ID, SemesterNumber: 1, TotalAmount: 91000.00, DiscountAmount: 5000.00, FineAmount: 0.00, NetAmount: 86000.00, PaidAmount: 86000.00, BalanceDue: 0.00, Status: "Paid", DueDate: ptr(time.Date(2024, 7, 31, 0, 0, 0, 0, time.UTC))},
		{StudentID: students[2].ID, AcademicYearID: academicYear.ID, SemesterNumber: 1, TotalAmount: 91000.00, DiscountAmount: 0.00, FineAmount: 0.00, NetAmount: 91000.00, PaidAmount: 50000.00, BalanceDue: 41000.00, Status: "Partial", DueDate: ptr(time.Date(2024, 7, 31, 0, 0, 0, 0, time.UTC))},
		{StudentID: students[3].ID, AcademicYearID: academicYear.ID, SemesterNumber: 1, TotalAmount: 91000.00, DiscountAmount: 0.00, FineAmount: 0.00, NetAmount: 91000.00, PaidAmount: 91000.00, BalanceDue: 0.00, Status: "Paid", DueDate: ptr(time.Date(2024, 7, 31, 0, 0, 0, 0, time.UTC))},
		{StudentID: students[4].ID, AcademicYearID: academicYear.ID, SemesterNumber: 1, TotalAmount: 91000.00, DiscountAmount: 0.00, FineAmount: 500.00, NetAmount: 91500.00, PaidAmount: 0.00, BalanceDue: 91500.00, Status: "Overdue", DueDate: ptr(time.Date(2024, 7, 31, 0, 0, 0, 0, time.UTC))},
		{StudentID: students[5].ID, AcademicYearID: academicYear.ID, SemesterNumber: 1, TotalAmount: 64000.00, DiscountAmount: 0.00, FineAmount: 0.00, NetAmount: 64000.00, PaidAmount: 64000.00, BalanceDue: 0.00, Status: "Paid", DueDate: ptr(time.Date(2024, 7, 31, 0, 0, 0, 0, time.UTC))},
		{StudentID: students[6].ID, AcademicYearID: academicYear.ID, SemesterNumber: 1, TotalAmount: 64000.00, DiscountAmount: 0.00, FineAmount: 0.00, NetAmount: 64000.00, PaidAmount: 64000.00, BalanceDue: 0.00, Status: "Paid", DueDate: ptr(time.Date(2024, 7, 31, 0, 0, 0, 0, time.UTC))},
		{StudentID: students[7].ID, AcademicYearID: academicYear.ID, SemesterNumber: 1, TotalAmount: 87000.00, DiscountAmount: 0.00, FineAmount: 0.00, NetAmount: 87000.00, PaidAmount: 87000.00, BalanceDue: 0.00, Status: "Paid", DueDate: ptr(time.Date(2024, 7, 31, 0, 0, 0, 0, time.UTC))},
		{StudentID: students[8].ID, AcademicYearID: academicYear.ID, SemesterNumber: 1, TotalAmount: 87000.00, DiscountAmount: 0.00, FineAmount: 0.00, NetAmount: 87000.00, PaidAmount: 87000.00, BalanceDue: 0.00, Status: "Paid", DueDate: ptr(time.Date(2024, 7, 31, 0, 0, 0, 0, time.UTC))},
		{StudentID: students[9].ID, AcademicYearID: academicYear.ID, SemesterNumber: 2, TotalAmount: 91000.00, DiscountAmount: 0.00, FineAmount: 0.00, NetAmount: 91000.00, PaidAmount: 91000.00, BalanceDue: 0.00, Status: "Paid", DueDate: ptr(time.Date(2025, 1, 15, 0, 0, 0, 0, time.UTC))},
	}
	for i := range invoices {
		DB.Create(&invoices[i])
	}
	log.Println("✅ Created 10 Student Fee Invoices")

	// ==================== FEE PAYMENTS (9 payments) ====================
	payments := []Payment{
		{InvoiceID: invoices[0].ID, StudentID: students[0].ID, AmountPaid: 91000.00, PaymentDate: time.Date(2024, 7, 5, 0, 0, 0, 0, time.UTC), PaymentMode: "UPI", TransactionID: "UPI2024070501", ReceiptNumber: "RCP-2024-001", IsVerified: true, Status: "completed"},
		{InvoiceID: invoices[1].ID, StudentID: students[1].ID, AmountPaid: 86000.00, PaymentDate: time.Date(2024, 7, 6, 0, 0, 0, 0, time.UTC), PaymentMode: "Online", TransactionID: "NET2024070601", ReceiptNumber: "RCP-2024-002", IsVerified: true, Status: "completed"},
		{InvoiceID: invoices[2].ID, StudentID: students[2].ID, AmountPaid: 50000.00, PaymentDate: time.Date(2024, 7, 10, 0, 0, 0, 0, time.UTC), PaymentMode: "DD", TransactionID: "DD20240710", ReceiptNumber: "RCP-2024-003", IsVerified: true, Status: "completed"},
		{InvoiceID: invoices[3].ID, StudentID: students[3].ID, AmountPaid: 91000.00, PaymentDate: time.Date(2024, 7, 8, 0, 0, 0, 0, time.UTC), PaymentMode: "Cash", TransactionID: "", ReceiptNumber: "RCP-2024-004", IsVerified: true, Status: "completed"},
		{InvoiceID: invoices[5].ID, StudentID: students[5].ID, AmountPaid: 64000.00, PaymentDate: time.Date(2024, 7, 7, 0, 0, 0, 0, time.UTC), PaymentMode: "Online", TransactionID: "NET2024070701", ReceiptNumber: "RCP-2024-005", IsVerified: true, Status: "completed"},
		{InvoiceID: invoices[6].ID, StudentID: students[6].ID, AmountPaid: 64000.00, PaymentDate: time.Date(2024, 7, 9, 0, 0, 0, 0, time.UTC), PaymentMode: "UPI", TransactionID: "UPI2024070901", ReceiptNumber: "RCP-2024-006", IsVerified: true, Status: "completed"},
		{InvoiceID: invoices[7].ID, StudentID: students[7].ID, AmountPaid: 87000.00, PaymentDate: time.Date(2024, 7, 5, 0, 0, 0, 0, time.UTC), PaymentMode: "NEFT", TransactionID: "NEFT2024070501", ReceiptNumber: "RCP-2024-007", IsVerified: true, Status: "completed"},
		{InvoiceID: invoices[8].ID, StudentID: students[8].ID, AmountPaid: 87000.00, PaymentDate: time.Date(2024, 7, 6, 0, 0, 0, 0, time.UTC), PaymentMode: "Online", TransactionID: "NET2024070602", ReceiptNumber: "RCP-2024-008", IsVerified: true, Status: "completed"},
		{InvoiceID: invoices[9].ID, StudentID: students[9].ID, AmountPaid: 91000.00, PaymentDate: time.Date(2025, 1, 10, 0, 0, 0, 0, time.UTC), PaymentMode: "UPI", TransactionID: "UPI2025011001", ReceiptNumber: "RCP-2025-001", IsVerified: true, Status: "completed"},
	}
	for i := range payments {
		DB.Create(&payments[i])
	}
	log.Println("✅ Created 9 Fee Payments")

	// ==================== SCHOLARSHIPS (5 scholarships) ====================
	scholarships := []Scholarship{
		{Name: "Merit Excellence Award", Provider: "NTU University", ScholarshipType: "Merit", Amount: 50000, Criteria: "CGPA >= 9.0 in previous semester", AcademicYearID: academicYear.ID, LastDate: ptr(time.Date(2024, 9, 30, 0, 0, 0, 0, time.UTC))},
		{Name: "SC/ST Government Scholarship", Provider: "Government of India", ScholarshipType: "Need-based", Amount: 75000, Criteria: "SC/ST category, family income < 2.5 LPA", AcademicYearID: academicYear.ID, LastDate: ptr(time.Date(2024, 10, 15, 0, 0, 0, 0, time.UTC))},
		{Name: "Sports Achievement Award", Provider: "NTU University", ScholarshipType: "Sports", Amount: 30000, Criteria: "State/National level sports achievements", AcademicYearID: academicYear.ID, LastDate: ptr(time.Date(2024, 9, 15, 0, 0, 0, 0, time.UTC))},
		{Name: "OBC Post-Matric Scholarship", Provider: "State Government", ScholarshipType: "Need-based", Amount: 20000, Criteria: "OBC category, family income < 1 LPA", AcademicYearID: academicYear.ID, LastDate: ptr(time.Date(2024, 10, 31, 0, 0, 0, 0, time.UTC))},
		{Name: "Girl Child Education Award", Provider: "NTU University", ScholarshipType: "Merit", Amount: 25000, Criteria: "Top 3 female students per department", AcademicYearID: academicYear.ID, LastDate: ptr(time.Date(2024, 9, 30, 0, 0, 0, 0, time.UTC))},
	}
	for i := range scholarships {
		DB.Create(&scholarships[i])
	}
	log.Println("✅ Created 5 Scholarships")

	// ==================== STUDENT SCHOLARSHIPS (6 records) ====================
	studentScholarships := []StudentScholarship{
		{StudentID: students[0].ID, ScholarshipID: scholarships[0].ID, AppliedDate: ptr(time.Date(2024, 8, 1, 0, 0, 0, 0, time.UTC)), AwardedDate: ptr(time.Date(2024, 9, 1, 0, 0, 0, 0, time.UTC)), AmountAwarded: 50000, Status: "Disbursed"},
		{StudentID: students[1].ID, ScholarshipID: scholarships[0].ID, AppliedDate: ptr(time.Date(2024, 8, 1, 0, 0, 0, 0, time.UTC)), AwardedDate: ptr(time.Date(2024, 9, 1, 0, 0, 0, 0, time.UTC)), AmountAwarded: 50000, Status: "Disbursed"},
		{StudentID: students[1].ID, ScholarshipID: scholarships[4].ID, AppliedDate: ptr(time.Date(2024, 8, 5, 0, 0, 0, 0, time.UTC)), AwardedDate: ptr(time.Date(2024, 9, 5, 0, 0, 0, 0, time.UTC)), AmountAwarded: 25000, Status: "Disbursed"},
		{StudentID: students[2].ID, ScholarshipID: scholarships[1].ID, AppliedDate: ptr(time.Date(2024, 8, 1, 0, 0, 0, 0, time.UTC)), AwardedDate: ptr(time.Date(2024, 9, 1, 0, 0, 0, 0, time.UTC)), AmountAwarded: 75000, Status: "Disbursed"},
		{StudentID: students[4].ID, ScholarshipID: scholarships[3].ID, AppliedDate: ptr(time.Date(2024, 8, 10, 0, 0, 0, 0, time.UTC)), AwardedDate: nil, AmountAwarded: 20000, Status: "Applied"},
		{StudentID: students[5].ID, ScholarshipID: scholarships[4].ID, AppliedDate: ptr(time.Date(2024, 8, 5, 0, 0, 0, 0, time.UTC)), AwardedDate: ptr(time.Date(2024, 9, 5, 0, 0, 0, 0, time.UTC)), AmountAwarded: 25000, Status: "Disbursed"},
	}
	for i := range studentScholarships {
		DB.Create(&studentScholarships[i])
	}
	log.Println("✅ Created 6 Student Scholarships")

	// ==================== LIBRARY BOOKS (10 books) ====================
	books := []Book{
		{ISBN: "9780132350884", Title: "Clean Code", Author: "Robert C. Martin", Publisher: "Prentice Hall", Edition: "1st", YearPublished: 2008, Category: "Programming", SubjectID: &subjects[0].ID, TotalCopies: 5, AvailableCopies: 3, RackNumber: "R-01"},
		{ISBN: "9780201633610", Title: "Design Patterns (GoF)", Author: "Gang of Four", Publisher: "Addison-Wesley", Edition: "1st", YearPublished: 1994, Category: "Software Engg", SubjectID: &subjects[0].ID, TotalCopies: 3, AvailableCopies: 2, RackNumber: "R-01"},
		{ISBN: "9780132181204", Title: "Database System Concepts", Author: "Silberschatz", Publisher: "McGraw-Hill", Edition: "7th", YearPublished: 2019, Category: "Database", SubjectID: &subjects[3].ID, TotalCopies: 8, AvailableCopies: 5, RackNumber: "R-02"},
		{ISBN: "9781491957660", Title: "Hands-On Machine Learning", Author: "Aurélien Géron", Publisher: "O Reilly", Edition: "3rd", YearPublished: 2022, Category: "AI/ML", SubjectID: &subjects[6].ID, TotalCopies: 4, AvailableCopies: 2, RackNumber: "R-03"},
		{ISBN: "9780134685991", Title: "Effective Java", Author: "Joshua Bloch", Publisher: "Addison-Wesley", Edition: "3rd", YearPublished: 2018, Category: "Programming", SubjectID: &subjects[0].ID, TotalCopies: 6, AvailableCopies: 4, RackNumber: "R-01"},
		{ISBN: "9781492032649", Title: "Python for Data Analysis", Author: "Wes McKinney", Publisher: "O Reilly", Edition: "3rd", YearPublished: 2022, Category: "Data Science", SubjectID: &subjects[6].ID, TotalCopies: 5, AvailableCopies: 3, RackNumber: "R-03"},
		{ISBN: "9780262033848", Title: "Introduction to Algorithms (CLRS)", Author: "Cormen et al.", Publisher: "MIT Press", Edition: "4th", YearPublished: 2022, Category: "Algorithms", SubjectID: &subjects[2].ID, TotalCopies: 10, AvailableCopies: 7, RackNumber: "R-04"},
		{ISBN: "9780136042594", Title: "Operating System Concepts (Galvin)", Author: "Silberschatz", Publisher: "Wiley", Edition: "9th", YearPublished: 2018, Category: "Operating Systems", SubjectID: &subjects[4].ID, TotalCopies: 7, AvailableCopies: 5, RackNumber: "R-05"},
		{ISBN: "9780132126953", Title: "Computer Networks (Tanenbaum)", Author: "Andrew Tanenbaum", Publisher: "Pearson", Edition: "5th", YearPublished: 2010, Category: "Networks", SubjectID: &subjects[5].ID, TotalCopies: 6, AvailableCopies: 4, RackNumber: "R-06"},
		{ISBN: "9781119592273", Title: "Cybersecurity Essentials", Author: "Charles Brooks", Publisher: "Wiley", Edition: "1st", YearPublished: 2018, Category: "Cyber Security", SubjectID: &subjects[10].ID, TotalCopies: 4, AvailableCopies: 3, RackNumber: "R-07"},
	}
	for i := range books {
		DB.Create(&books[i])
	}
	log.Println("✅ Created 10 Library Books")

	// ==================== HOSTELS ====================
	hostels := []Hostel{
		{CollegeID: cet.ID, HostelName: "Vishwakarma Boys Hostel", HostelType: "Boys", TotalRooms: 100, TotalCapacity: 250, WardenName: "Mr. Ramesh Kumar", WardenPhone: "9333333301", Phone: "040-11119901", Address: "Block-A, NTU Campus", IsActive: true},
		{CollegeID: cet.ID, HostelName: "Saraswati Girls Hostel", HostelType: "Girls", TotalRooms: 80, TotalCapacity: 180, WardenName: "Mrs. Lakshmi Devi", WardenPhone: "9333333302", Phone: "040-11119902", Address: "Block-B, NTU Campus", IsActive: true},
		{CollegeID: cet.ID, HostelName: "New Boys Hostel", HostelType: "Boys", TotalRooms: 60, TotalCapacity: 150, WardenName: "Mr. Suresh Yadav", WardenPhone: "9333333303", Phone: "040-11119903", Address: "Block-C, NTU Campus", IsActive: true},
	}
	for i := range hostels {
		DB.Create(&hostels[i])
	}
	log.Println("✅ Created 3 Hostels")

	// ==================== HOSTEL ROOMS ====================
	rooms := []HostelRoom{
		{HostelID: hostels[0].ID, RoomNumber: "A-101", FloorNumber: 1, RoomType: "Double", Capacity: 2, CurrentOccupancy: 2, RoomStatus: "Full", MonthlyRent: 3500},
		{HostelID: hostels[0].ID, RoomNumber: "A-102", FloorNumber: 1, RoomType: "Double", Capacity: 2, CurrentOccupancy: 1, RoomStatus: "Available", MonthlyRent: 3500},
		{HostelID: hostels[0].ID, RoomNumber: "A-201", FloorNumber: 2, RoomType: "Triple", Capacity: 3, CurrentOccupancy: 3, RoomStatus: "Full", MonthlyRent: 3000},
		{HostelID: hostels[0].ID, RoomNumber: "A-202", FloorNumber: 2, RoomType: "Single", Capacity: 1, CurrentOccupancy: 1, RoomStatus: "Full", MonthlyRent: 4500},
		{HostelID: hostels[0].ID, RoomNumber: "A-203", FloorNumber: 2, RoomType: "Triple", Capacity: 3, CurrentOccupancy: 2, RoomStatus: "Available", MonthlyRent: 3000},
		{HostelID: hostels[1].ID, RoomNumber: "B-101", FloorNumber: 1, RoomType: "Double", Capacity: 2, CurrentOccupancy: 2, RoomStatus: "Full", MonthlyRent: 3500},
		{HostelID: hostels[1].ID, RoomNumber: "B-102", FloorNumber: 1, RoomType: "Double", Capacity: 2, CurrentOccupancy: 1, RoomStatus: "Available", MonthlyRent: 3500},
		{HostelID: hostels[1].ID, RoomNumber: "B-201", FloorNumber: 2, RoomType: "Triple", Capacity: 3, CurrentOccupancy: 3, RoomStatus: "Full", MonthlyRent: 3000},
		{HostelID: hostels[2].ID, RoomNumber: "C-101", FloorNumber: 1, RoomType: "Double", Capacity: 2, CurrentOccupancy: 0, RoomStatus: "Available", MonthlyRent: 3200},
		{HostelID: hostels[2].ID, RoomNumber: "C-102", FloorNumber: 1, RoomType: "Triple", Capacity: 3, CurrentOccupancy: 0, RoomStatus: "Available", MonthlyRent: 2800},
	}
	for i := range rooms {
		DB.Create(&rooms[i])
	}
	log.Println("✅ Created 10 Hostel Rooms")

	// ==================== NOTICES ====================
	cetAdminUser := &users[2]
	notices := []Notice{
		{CollegeID: &cet.ID, DepartmentID: &deptCSE.ID, Title: "Mid Semester Examination Schedule 2024", Content: "Mid semester exams from Sept 10 to Sept 20.", NoticeType: "Exam", TargetAudience: "Students", PostedBy: &cetAdminUser.ID, PostedDate: ptr(time.Date(2024, 8, 25, 0, 0, 0, 0, time.UTC)), ExpiryDate: ptr(time.Date(2024, 9, 20, 0, 0, 0, 0, time.UTC)), IsPinned: true, IsActive: true},
		{CollegeID: &cet.ID, Title: "Annual Tech Fest TECHNIA 2024", Content: "National Tech Symposium on Oct 15-17.", NoticeType: "Event", TargetAudience: "All", PostedBy: &cetAdminUser.ID, PostedDate: ptr(time.Date(2024, 9, 1, 0, 0, 0, 0, time.UTC)), ExpiryDate: ptr(time.Date(2024, 10, 17, 0, 0, 0, 0, time.UTC)), IsPinned: true, IsActive: true},
		{CollegeID: &cet.ID, Title: "Fee Payment Reminder", Content: "Pay fees before July 31 to avoid late fines.", NoticeType: "Fee", TargetAudience: "Students", PostedBy: &cetAdminUser.ID, PostedDate: ptr(time.Date(2024, 7, 20, 0, 0, 0, 0, time.UTC)), ExpiryDate: ptr(time.Date(2024, 7, 31, 0, 0, 0, 0, time.UTC)), IsPinned: true, IsActive: true},
	}
	for i := range notices {
		DB.Create(&notices[i])
	}
	log.Println("✅ Created Notices")

	// ==================== EVENTS ====================
	events := []Event{
		{CollegeID: &cet.ID, EventName: "TECHNIA 2024", EventType: "Technical", Description: "National level technical symposium", EventDate: ptr(time.Date(2024, 10, 15, 0, 0, 0, 0, time.UTC)), EndDate: ptr(time.Date(2024, 10, 17, 0, 0, 0, 0, time.UTC)), Venue: "Main Auditorium", Organizer: "CSE Department", MaxParticipants: 500, IsActive: true},
		{CollegeID: &cet.ID, EventName: "Annual Sports Day 2024", EventType: "Sports", Description: "Athletics and sports events", EventDate: ptr(time.Date(2024, 12, 10, 0, 0, 0, 0, time.UTC)), EndDate: ptr(time.Date(2024, 12, 12, 0, 0, 0, 0, time.UTC)), Venue: "NTU Sports Ground", Organizer: "Sports Committee", MaxParticipants: 800, IsActive: true},
		{CollegeID: &cet.ID, EventName: "Industry Connect Seminar", EventType: "Seminar", Description: "Industry experts insights", EventDate: ptr(time.Date(2024, 9, 20, 0, 0, 0, 0, time.UTC)), Venue: "Conference Hall", Organizer: "T&P Cell", MaxParticipants: 200, IsActive: true},
	}
	for i := range events {
		DB.Create(&events[i])
	}
	log.Println("✅ Created Events")

	// ==================== COMPANIES ====================
	companies := []Company{
		{Name: "Tata Consultancy Services", Industry: "IT Services", Website: "www.tcs.com", HRContact: "Anita Verma", HREmail: "hr@tcs.com", HRPhone: "022-67788000", IsActive: true},
		{Name: "Infosys Limited", Industry: "IT Services", Website: "www.infosys.com", HRContact: "Rajiv Bhatnagar", HREmail: "hr@infosys.com", HRPhone: "080-22948000", IsActive: true},
		{Name: "Wipro Technologies", Industry: "IT Services", Website: "www.wipro.com", HRContact: "Kavita Sharma", HREmail: "hr@wipro.com", HRPhone: "080-28440011", IsActive: true},
		{Name: "Google India", Industry: "Technology", Website: "www.google.co.in", HRContact: "Sam Pillai", HREmail: "hr@google.com", HRPhone: "080-67218000", IsActive: true},
		{Name: "Microsoft India", Industry: "Technology", Website: "www.microsoft.com", HRContact: "Ravi Menon", HREmail: "hr@microsoft.com", HRPhone: "080-30572000", IsActive: true},
	}
	for i := range companies {
		DB.Create(&companies[i])
	}
	log.Println("✅ Created 5 Companies")

	// ==================== PLACEMENT DRIVES ====================
	drives := []PlacementDrive{
		{CompanyID: companies[0].ID, CollegeID: cet.ID, DriveDate: ptr(time.Date(2024, 8, 15, 0, 0, 0, 0, time.UTC)), JobRole: "System Engineer", JobType: "Full-time", PackageLPA: 7.00, Eligibility: "B.Tech, CGPA >= 6.0", Status: "Completed", IsActive: true},
		{CompanyID: companies[1].ID, CollegeID: cet.ID, DriveDate: ptr(time.Date(2024, 8, 20, 0, 0, 0, 0, time.UTC)), JobRole: "Software Engineer", JobType: "Full-time", PackageLPA: 8.00, Eligibility: "B.Tech CSE/IT, CGPA >= 7.0", Status: "Completed", IsActive: true},
		{CompanyID: companies[2].ID, CollegeID: cet.ID, DriveDate: ptr(time.Date(2024, 9, 10, 0, 0, 0, 0, time.UTC)), JobRole: "Project Engineer", JobType: "Full-time", PackageLPA: 6.50, Eligibility: "B.Tech, CGPA >= 6.5", Status: "Completed", IsActive: true},
	}
	for i := range drives {
		DB.Create(&drives[i])
	}
	log.Println("✅ Created 3 Placement Drives")

	log.Println("")
	log.Println("✅ Database seeding completed successfully!")
	log.Println("")
	log.Println("📋 Login Credentials:")
	log.Println("   Super Admin          : superadmin@ntu.edu.in / Admin@123")
	log.Println("   University Admin     : univadmin@ntu.edu.in / Admin@123")
	log.Println("   College Admin        : cetadmin@ntu.edu.in / Admin@123")
	log.Println("   Faculty (3 users)    : rajesh.kumar@ntu.edu.in / Faculty@123")
	log.Println("   Students (13 users)  : 22cse001@student.ntu.edu.in / Student@123")
	log.Println("")

	return nil
}

// ==================== MAIN FUNCTION ====================

func main() {
	log.Println("🌱 University ERP Database Seeder")
	log.Println("==================================")

	// Load .env
	if err := godotenv.Load(); err != nil {
		log.Println("⚠️  Warning: .env file not found, using system env")
	}

	// Connect to DB
	if err := Connect(); err != nil {
		log.Fatalf("❌ Failed to connect to DB: %v", err)
	}

	// Check for --force flag
	force := false
	for _, arg := range os.Args {
		if arg == "--force" {
			force = true
			break
		}
	}

	// Step 1: Create PostgreSQL schemas
	if err := CreateSchemas(); err != nil {
		log.Fatalf("❌ Failed to create schemas: %v", err)
	}

	// Step 2: Auto-migrate tables
	if err := AutoMigrate(); err != nil {
		log.Fatalf("❌ Failed to migrate database: %v", err)
	}

	// Step 3: Seed data
	if err := SeedData(force); err != nil {
		log.Fatalf("❌ Failed to seed database: %v", err)
	}

	log.Println("✅ All operations completed successfully!")
	log.Println("")
	log.Println("To run the main server:")
	log.Println("  go run cmd/main.go")
}
