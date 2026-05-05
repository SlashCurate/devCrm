package models

import (
	"time"
)

// ==================== ROLES ====================
const (
	RoleUniversityAdmin   = "university_admin"   // ID 1
	RoleFinanceController = "finance_controller" // ID 2
	RoleRegistrar         = "registrar"          // ID 3
	RoleCollegeAdmin      = "college_admin"      // ID 4
	RoleHOD               = "hod"                // ID 5
	RoleFaculty           = "faculty"            // ID 6
	RoleStudent           = "student"            // ID 7
	RoleStaff             = "staff"              // ID 8
)

// ==================== APPLICATION STATUS ====================
const (
	ApplicationDraft       = "draft"
	ApplicationSubmitted   = "submitted"
	ApplicationUnderReview = "under_review"
	ApplicationShortlisted = "shortlisted"
	ApplicationRejected    = "rejected"
	ApplicationEnrolled    = "enrolled"
	ApplicationPending     = "pending"
	ApplicationAdmitted    = "admitted"
	ApplicationWaitlisted  = "waitlisted"
)

// ==================== PAYMENT STATUS ====================
const (
	PaymentPending  = "pending"
	PaymentSuccess  = "success"
	PaymentFailed   = "failed"
	PaymentRefunded = "refunded"
	PaymentPartial  = "partial"
)

// ==================== FEE STATUS ====================
const (
	FeeStatusUnpaid  = "Unpaid"
	FeeStatusPartial = "Partial"
	FeeStatusPaid    = "Paid"
	FeeStatusOverdue = "Overdue"
)

// ==================== LEAVE STATUS ====================
const (
	LeaveStatusPending  = "Pending"
	LeaveStatusApproved = "Approved"
	LeaveStatusRejected = "Rejected"
)

// ==================== ATTENDANCE STATUS ====================
const (
	AttendancePresent = "Present"
	AttendanceAbsent  = "Absent"
	AttendanceLate    = "Late"
	AttendanceOnLeave = "on_leave"
	AttendanceOD      = "OD"
)

// ==================== ROLE (auth.roles) ====================
type Role struct {
	ID        uint `gorm:"primaryKey"`
	CreatedAt time.Time
	UpdatedAt time.Time
	RoleName  string `gorm:"uniqueIndex;not null"`
}

func (Role) TableName() string {
	return "auth.roles"
}

// ==================== PERMISSION (auth.permissions) ====================
type Permission struct {
	ID          uint `gorm:"primaryKey"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
	Module      string `gorm:"not null"`
	Action      string `gorm:"not null"`
	Description string
}

func (Permission) TableName() string {
	return "auth.permissions"
}

// ==================== ROLE PERMISSION (auth.role_permissions) ====================
type RolePermission struct {
	ID           uint `gorm:"primaryKey"`
	CreatedAt    time.Time
	UpdatedAt    time.Time
	RoleID       uint `gorm:"not null"`
	PermissionID uint `gorm:"not null"`
}

func (RolePermission) TableName() string {
	return "auth.role_permissions"
}

// ==================== USER (auth.users) ====================
type User struct {
	ID                 string `gorm:"primaryKey;type:uuid;default:uuid_generate_v4()"`
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
	// Relations
	Notifications []Notification
	Sessions      []UserSession
	Role   Role `gorm:"foreignKey:RoleID;references:ID"`
}

func (User) TableName() string {
	return "auth.users"
}

// ==================== USER SESSION (auth.user_sessions) ====================
type UserSession struct {
	ID        uint `gorm:"primaryKey"`
	CreatedAt time.Time
	UpdatedAt time.Time
	UserID    string `gorm:"type:uuid;not null"`
	Token     string `gorm:"not null"`
	IPAddress string
	UserAgent string
	IsActive  bool `gorm:"default:true"`
}

func (UserSession) TableName() string {
	return "auth.user_sessions"
}

// ==================== OTP VERIFICATION (auth.otp_verifications) ====================
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

func (OTPVerification) TableName() string {
	return "auth.otp_verifications"
}

// ==================== NOTIFICATION (notify.notifications) ====================
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

func (Notification) TableName() string {
	return "notify.notifications"
}

// ==================== AUDIT LOG (audit.audit_logs) ====================
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

func (AuditLog) TableName() string {
	return "audit.audit_logs"
}

// ==================== UNIVERSITY (core.universities) ====================
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

func (University) TableName() string {
	return "core.universities"
}

// ==================== COLLEGE (core.colleges) ====================

type College struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	UniversityID uint       `json:"university_id"`
	University   University `gorm:"foreignKey:UniversityID" json:"university"`

	Name            string `gorm:"not null" json:"name"`
	ShortName       string `json:"short_name"`
	Code            string `gorm:"uniqueIndex;not null" json:"code"`
	EstablishedYear int    `json:"established_year"`
	CollegeType     string `json:"college_type"`

	LogoURL string `json:"logo_url"`
	Address string `json:"address"`
	City    string `json:"city"`
	State   string `json:"state"`
	Pincode string `json:"pincode"`

	Phone   string `json:"phone"`
	Email   string `json:"email"`
	Website string `json:"website"`

	PrincipalName string `json:"principal_name"`
	About         string `json:"about"`
	IsActive      bool   `gorm:"default:true" json:"is_active"`

	// Relations
	Departments []Department `json:"departments"`
	Events      []Event      `json:"events"`
}

func (College) TableName() string {
	return "core.colleges"
}

// ==================== DEPARTMENT (core.departments) ====================
type Department struct {
	ID              uint `gorm:"primaryKey"`
	CreatedAt       time.Time
	UpdatedAt       time.Time
	CollegeID       uint
	College         College `gorm:"foreignKey:CollegeID"`
	Name            string  `gorm:"not null"`
	Code            string  `gorm:"uniqueIndex;not null"`
	HODName         string
	HODUserID       *string `gorm:"type:uuid"`
	Phone           string
	Email           string
	EstablishedYear int
	About           string
	IsActive        bool `gorm:"default:true"`
	// Relations
	Programs []Program
	Subjects []Subject
}

func (Department) TableName() string {
	return "core.departments"
}

// ==================== STAFF (core.staff) ====================
type Staff struct {
	ID           uint `gorm:"primaryKey"`
	CreatedAt    time.Time
	UpdatedAt    time.Time
	CollegeID    uint
	College      College `gorm:"foreignKey:CollegeID"`
	UserID       *string `gorm:"type:uuid"`
	User         *User   `gorm:"foreignKey:UserID"`
	EmployeeCode string  `gorm:"uniqueIndex"`
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

func (Staff) TableName() string {
	return "core.staff"
}

// ==================== ACADEMIC YEAR (academic.academic_years) ====================
type AcademicYear struct {
	ID        uint `gorm:"primaryKey"`
	CreatedAt time.Time
	UpdatedAt time.Time
	YearLabel string `gorm:"not null"` // e.g. '2024-2025'
	StartDate *time.Time
	EndDate   *time.Time
	IsCurrent bool `gorm:"default:false"`
}

func (AcademicYear) TableName() string {
	return "academic.academic_years"
}

// ==================== SEMESTER (academic.semesters) ====================
type Semester struct {
	ID              uint `gorm:"primaryKey"`
	CreatedAt       time.Time
	UpdatedAt       time.Time
	AcademicYearID  uint
	AcademicYear    AcademicYear `gorm:"foreignKey:AcademicYearID"`
	SemesterNumber  int
	SemesterName    string // Odd / Even
	StartDate       *time.Time
	EndDate         *time.Time
	ResultPublished bool `gorm:"default:false"`
	IsCurrent       bool `gorm:"default:false"`
}

func (Semester) TableName() string {
	return "academic.semesters"
}

// ==================== PROGRAM (academic.programs) ====================
type Program struct {
	ID             uint      `gorm:"primaryKey" json:"id"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`

	DepartmentID   uint       `json:"department_id"`
	Department     Department `gorm:"foreignKey:DepartmentID" json:"department"`

	Name           string `gorm:"not null" json:"name"`
	Code           string `gorm:"uniqueIndex;not null" json:"code"`
	DegreeType     string `json:"degree_type"`
	DurationYears  int    `json:"duration_years"`
	TotalSemesters int    `json:"total_semesters"`
	TotalCredits   int    `json:"total_credits"`

	IntakeCapacity int    `json:"total_seats"` // 👈 map this properly
	Eligibility    string `json:"eligibility_criteria"`
	Description    string `json:"description"`

	IsActive       bool `gorm:"default:true" json:"is_active"`

	// Relations (optional in response)
	Students      []Student      `json:"-"`
	FeeStructures []FeeStructure `json:"-"`
	Applications  []Application  `json:"-"`
	Admissions    []Admission    `json:"-"`
	Timetables    []Timetable    `json:"-"`
	Exams         []Exam         `json:"-"`
}

func (Program) TableName() string {
	return "academic.programs"
}

// Course is alias to Program for backward compatibility
type Course = Program

// ==================== SUBJECT (academic.subjects) ====================
type Subject struct {
	ID             uint `gorm:"primaryKey"`
	CreatedAt      time.Time
	UpdatedAt      time.Time
	DepartmentID   uint
	Department     Department `gorm:"foreignKey:DepartmentID"`
	SubjectCode    string     `gorm:"uniqueIndex;not null"`
	SubjectName    string     `gorm:"not null"`
	Credits        int
	LectureHours   int    `gorm:"default:0"`
	TutorialHours  int    `gorm:"default:0"`
	LabHours       int    `gorm:"default:0"`
	SubjectType    string // Theory, Lab, Elective, Project, Seminar
	SemesterNumber int
	SyllabusURL    string
	Description    string
	IsActive       bool `gorm:"default:true"`
	// Relations
	ProgramSubjects []ProgramSubject
}

func (Subject) TableName() string {
	return "academic.subjects"
}

// ==================== SUBJECT PREREQUISITE (academic.subject_prerequisites) ====================
type SubjectPrerequisite struct {
	ID             uint `gorm:"primaryKey"`
	CreatedAt      time.Time
	UpdatedAt      time.Time
	SubjectID      uint `gorm:"not null"`
	PrerequisiteID uint `gorm:"not null"`
}

func (SubjectPrerequisite) TableName() string {
	return "academic.subject_prerequisites"
}

// ==================== PROGRAM SUBJECT (academic.program_subjects) ====================
type ProgramSubject struct {
	ID             uint `gorm:"primaryKey"`
	CreatedAt      time.Time
	UpdatedAt      time.Time
	ProgramID      uint
	Program        Program `gorm:"foreignKey:ProgramID"`
	SubjectID      uint
	Subject        Subject `gorm:"foreignKey:SubjectID"`
	SemesterNumber int
	IsMandatory    bool `gorm:"default:true"`
}

func (ProgramSubject) TableName() string {
	return "academic.program_subjects"
}

// ==================== TIMETABLE (academic.timetable) ====================
type Timetable struct {
	ID         uint `gorm:"primaryKey"`
	CreatedAt  time.Time
	UpdatedAt  time.Time
	ProgramID  uint
	Program    Program `gorm:"foreignKey:ProgramID"`
	SubjectID  uint
	Subject    Subject `gorm:"foreignKey:SubjectID"`
	FacultyID  uint
	Faculty    Faculty `gorm:"foreignKey:FacultyID"`
	SemesterID uint
	Semester   Semester `gorm:"foreignKey:SemesterID"`
	Section    string
	DayOfWeek  int       `gorm:"not null"` // 0=Sunday, 1=Monday, etc.
	StartTime  time.Time `gorm:"not null"`
	EndTime    time.Time `gorm:"not null"`
	RoomNumber string
	IsActive   bool `gorm:"default:true"`
}

func (Timetable) TableName() string {
	return "academic.timetable"
}

// ==================== ASSIGNMENT (academic.assignments) ====================
type Assignment struct {
	ID            uint `gorm:"primaryKey"`
	CreatedAt     time.Time
	UpdatedAt     time.Time
	SubjectID     uint
	Subject       Subject `gorm:"foreignKey:SubjectID"`
	FacultyID     uint
	Faculty       Faculty `gorm:"foreignKey:FacultyID"`
	SemesterID    uint
	Semester      Semester `gorm:"foreignKey:SemesterID"`
	Title         string
	Description   string
	AttachmentURL string
	DueDate       *time.Time
	MaxMarks      int
	IsPublished   bool `gorm:"default:false"`
}

func (Assignment) TableName() string {
	return "academic.assignments"
}

// ==================== ASSIGNMENT SUBMISSION (academic.assignment_submissions) ====================
type AssignmentSubmission struct {
	ID            uint `gorm:"primaryKey"`
	CreatedAt     time.Time
	UpdatedAt     time.Time
	AssignmentID  uint
	Assignment    Assignment `gorm:"foreignKey:AssignmentID"`
	StudentID     uint
	Student       Student `gorm:"foreignKey:StudentID"`
	SubmittedAt   time.Time
	FileURL       string
	Remarks       string
	MarksObtained float64
	GradedBy      *uint
	GradedAt      *time.Time
	Status        string `gorm:"default:'Submitted'"` // Submitted, Graded, Late
}

func (AssignmentSubmission) TableName() string {
	return "academic.assignment_submissions"
}

// ==================== FACULTY (faculty.faculty_profiles) ====================
type Faculty struct {
	ID                uint `gorm:"primaryKey"`
	CreatedAt         time.Time
	UpdatedAt         time.Time
	UserID            string `gorm:"type:uuid;uniqueIndex;not null"`
	DepartmentID      *uint
	Department        *Department `gorm:"foreignKey:DepartmentID"`
	EmployeeCode      string      `gorm:"uniqueIndex;not null"`
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
	// Relations
	Subjects []FacultySubject
	Leaves   []FacultyLeave
}

func (Faculty) TableName() string {
	return "faculty.faculty_profiles"
}

// ==================== FACULTY SUBJECT (faculty.faculty_subjects) ====================
type FacultySubject struct {
	ID             uint `gorm:"primaryKey"`
	CreatedAt      time.Time
	UpdatedAt      time.Time
	FacultyID      uint
	Faculty        Faculty `gorm:"foreignKey:FacultyID"`
	SubjectID      uint
	Subject        Subject `gorm:"foreignKey:SubjectID"`
	SemesterID     uint
	Semester       Semester `gorm:"foreignKey:SemesterID"`
	Section        string
	AcademicYearID uint
	AcademicYear   AcademicYear `gorm:"foreignKey:AcademicYearID"`
}

func (FacultySubject) TableName() string {
	return "faculty.faculty_subjects"
}

// ==================== FACULTY LEAVE (faculty.faculty_leaves) ====================
type FacultyLeave struct {
	ID         uint `gorm:"primaryKey"`
	CreatedAt  time.Time
	UpdatedAt  time.Time
	FacultyID  uint
	Faculty    Faculty `gorm:"foreignKey:FacultyID"`
	LeaveType  string  // Sick, Casual, Earned, Maternity
	FromDate   *time.Time
	ToDate     *time.Time
	Reason     string
	Status     string `gorm:"default:'Pending'"` // Pending, Approved, Rejected
	ApprovedBy *uint
}

func (FacultyLeave) TableName() string {
	return "faculty.faculty_leaves"
}

// ==================== STUDENT (student.students) ====================
type Student struct {
	ID              uint `gorm:"primaryKey"`
	CreatedAt       time.Time
	UpdatedAt       time.Time
	UserID          string `gorm:"type:uuid;uniqueIndex;not null"`
	User            User     `gorm:"foreignKey:UserID"`
	ProgramID       *uint
	Program         *Program `gorm:"foreignKey:ProgramID"`
	RollNumber      string   `gorm:"uniqueIndex;not null"`
	UniversityRegNo string   `gorm:"uniqueIndex"`
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
	AadharNumber    string
	PANNumber       string
	PassportNumber  string
	AdmissionYear   int
	CurrentSemester int `gorm:"default:1"`
	Batch           string
	Section         string
	LateralEntry    bool `gorm:"default:false"`
	PhotoURL        string
	SignatureURL    string
	IsActive        bool `gorm:"default:true"`
	// Relations
	Enrollments       []Enrollment
	Attendance        []Attendance
	Results           []Result
	Documents         []Document
	AcademicHistory   []StudentAcademicHistory
	Parents           *StudentParent
	HostelAllocations []HostelAllocation
}

func (Student) TableName() string {
	return "student.students"
}

// ==================== STUDENT PARENTS (student.student_parents) ====================
type StudentParent struct {
	ID                  uint `gorm:"primaryKey"`
	CreatedAt           time.Time
	UpdatedAt           time.Time
	StudentID           uint
	Student             Student `gorm:"foreignKey:StudentID"`
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

func (StudentParent) TableName() string {
	return "student.student_parents"
}

// ==================== STUDENT ACADEMIC HISTORY (student.student_academic_history) ====================
type StudentAcademicHistory struct {
	ID              uint `gorm:"primaryKey"`
	CreatedAt       time.Time
	UpdatedAt       time.Time
	StudentID       uint
	Student         Student `gorm:"foreignKey:StudentID"`
	InstitutionName string
	Degree          string
	BoardUniversity string
	YearOfPassing   int
	Percentage      float64
	Grade           string
	CertificateURL  string
}

func (StudentAcademicHistory) TableName() string {
	return "student.student_academic_history"
}

// ==================== ENROLLMENT (student.enrollments) ====================
type Enrollment struct {
	ID           uint `gorm:"primaryKey"`
	CreatedAt    time.Time
	UpdatedAt    time.Time
	StudentID    uint
	Student      Student `gorm:"foreignKey:StudentID"`
	SubjectID    uint
	Subject      Subject `gorm:"foreignKey:SubjectID"`
	SemesterID   uint
	Semester     Semester `gorm:"foreignKey:SemesterID"`
	EnrolledDate *time.Time
	Status       string `gorm:"default:'Active'"` // Active, Dropped, Completed, Backlog
}

func (Enrollment) TableName() string {
	return "student.enrollments"
}

// ==================== ATTENDANCE (student.attendance) ====================
type Attendance struct {
	ID             uint `gorm:"primaryKey"`
	CreatedAt      time.Time
	UpdatedAt      time.Time
	StudentID      uint
	Student        Student `gorm:"foreignKey:StudentID"`
	SubjectID      uint
	Subject        Subject `gorm:"foreignKey:SubjectID"`
	FacultyID      *uint
	Faculty        *Faculty `gorm:"foreignKey:FacultyID"`
	SemesterID     uint
	Semester       Semester `gorm:"foreignKey:SemesterID"`
	AttendanceDate time.Time
	ClassType      string `gorm:"default:'Lecture'"` // Lecture, Lab, Tutorial
	Status         string // Present, Absent, Late, OD
	Remarks        string
}

func (Attendance) TableName() string {
	return "student.attendance"
}

// ==================== EXAM (student.exams) ====================
type Exam struct {
	ID           uint `gorm:"primaryKey"`
	CreatedAt    time.Time
	UpdatedAt    time.Time
	Name         string
	ProgramID    uint
	Program      Program `gorm:"foreignKey:ProgramID"`
	SubjectID    *uint
	Subject      *Subject `gorm:"foreignKey:SubjectID"`
	CollegeID    uint
	College      College `gorm:"foreignKey:CollegeID"`
	SemesterID   uint
	Semester     Semester `gorm:"foreignKey:SemesterID"`
	ExamType     string   // Internal-1, Internal-2, Midterm, Final, Practical, Viva
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
	IsPublished  bool    `gorm:"default:false"`
	PublishedBy  *string `gorm:"type:uuid"`
	PublishedAt  *time.Time
}

func (Exam) TableName() string {
	return "student.exams"
}

// ==================== EXAM HALL ALLOCATION (student.exam_hall_allocations) ====================
type ExamHallAllocation struct {
	ID         uint `gorm:"primaryKey"`
	CreatedAt  time.Time
	UpdatedAt  time.Time
	ExamID     uint
	Exam       Exam `gorm:"foreignKey:ExamID"`
	StudentID  uint
	Student    Student `gorm:"foreignKey:StudentID"`
	HallName   string
	SeatNumber string
}

func (ExamHallAllocation) TableName() string {
	return "student.exam_hall_allocations"
}

// ==================== RESULT (student.exam_results) ====================
type Result struct {
	ID            uint `gorm:"primaryKey"`
	CreatedAt     time.Time
	UpdatedAt     time.Time
	ExamID        uint
	Exam          Exam `gorm:"foreignKey:ExamID"`
	StudentID     uint
	Student       Student `gorm:"foreignKey:StudentID"`
	MarksObtained float64
	IsAbsent      bool   `gorm:"default:false"`
	IsMalpractice bool   `gorm:"default:false"`
	Grade         string // A+, A, B+, B, C, D, F
	GradePoints   float64
	IsPass        bool
	Remarks       string
	EnteredBy     *string `gorm:"type:uuid"`
	VerifiedBy    *string `gorm:"type:uuid"`
	IsVerified    bool    `gorm:"default:false"`
}

func (Result) TableName() string {
	return "student.exam_results"
}

// ==================== STUDENT SGPA (student.student_sgpa) ====================
type StudentSGPA struct {
	ID            uint `gorm:"primaryKey"`
	CreatedAt     time.Time
	UpdatedAt     time.Time
	StudentID     uint
	Student       Student `gorm:"foreignKey:StudentID"`
	SemesterID    uint
	Semester      Semester `gorm:"foreignKey:SemesterID"`
	TotalCredits  int
	CreditsEarned int
	SGPA          float64
	CGPA          float64
	RankInClass   int
	Remarks       string
	CalculatedAt  time.Time
}

func (StudentSGPA) TableName() string {
	return "student.student_sgpa"
}

// ==================== STUDENT LEAVE (student.student_leaves) ====================
type StudentLeave struct {
	ID          uint `gorm:"primaryKey"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
	StudentID   uint
	Student     Student `gorm:"foreignKey:StudentID"`
	LeaveType   string  // Medical, Personal, Event, OD
	FromDate    *time.Time
	ToDate      *time.Time
	Reason      string
	DocumentURL string
	Status      string `gorm:"default:'Pending'"` // Pending, Approved, Rejected
	ApprovedBy  *uint
}

func (StudentLeave) TableName() string {
	return "student.student_leaves"
}

// ==================== FEE CATEGORY (finance.fee_categories) ====================
type FeeCategory struct {
	ID          uint `gorm:"primaryKey"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
	Name        string
	Description string
}

func (FeeCategory) TableName() string {
	return "finance.fee_categories"
}

// ==================== FEE STRUCTURE (finance.fee_structures) ====================
type FeeStructure struct {
	ID             uint `gorm:"primaryKey"`
	CreatedAt      time.Time
	UpdatedAt      time.Time
	ProgramID      uint
	Program        Program `gorm:"foreignKey:ProgramID"`
	AcademicYearID uint
	AcademicYear   AcademicYear `gorm:"foreignKey:AcademicYearID"`
	SemesterNumber int
	CategoryID     uint
	Category       FeeCategory `gorm:"foreignKey:CategoryID"`
	Amount         float64     `gorm:"not null"`
	DueDate        *time.Time
	LateFinePerDay float64 `gorm:"default:0"`
	IsActive       bool    `gorm:"default:true"`
	CreatedBy      string  `gorm:"type:uuid"`
}

func (FeeStructure) TableName() string {
	return "finance.fee_structures"
}

// ==================== STUDENT FEE INVOICE (finance.student_fee_invoices) ====================
type StudentFeeInvoice struct {
	ID             uint `gorm:"primaryKey"`
	CreatedAt      time.Time
	UpdatedAt      time.Time
	StudentID      uint
	Student        Student `gorm:"foreignKey:StudentID"`
	AcademicYearID uint
	AcademicYear   AcademicYear `gorm:"foreignKey:AcademicYearID"`
	SemesterNumber int
	TotalAmount    float64
	DiscountAmount float64 `gorm:"default:0"`
	FineAmount     float64 `gorm:"default:0"`
	NetAmount      float64
	PaidAmount     float64 `gorm:"default:0"`
	BalanceDue     float64
	Status         string `gorm:"default:'Unpaid'"` // Unpaid, Partial, Paid, Overdue
	DueDate        *time.Time
}

func (StudentFeeInvoice) TableName() string {
	return "finance.student_fee_invoices"
}

// ==================== PAYMENT (finance.fee_payments) ====================
type Payment struct {
	ID            uint `gorm:"primaryKey"`
	CreatedAt     time.Time
	UpdatedAt     time.Time
	InvoiceID     uint
	Invoice       StudentFeeInvoice `gorm:"foreignKey:InvoiceID"`
	StudentID     uint
	Student       Student `gorm:"foreignKey:StudentID"`
	AmountPaid    float64
	PaymentDate   time.Time
	PaymentMode   string // Online, Cash, DD, Cheque, NEFT, UPI
	TransactionID string
	Gateway       string // Razorpay, PayU, CCAvenue
	ReceiptNumber string `gorm:"uniqueIndex"`
	IsVerified    bool   `gorm:"default:false"`
	VerifiedBy    *uint
	Remarks       string
	// Razorpay Fields (legacy support)
	RazorpayOrderID   string
	RazorpayPaymentID string
	RazorpaySignature string
	Currency          string `gorm:"default:'INR'"`
	Status            string `gorm:"default:'pending'"`
	PaidAt            *time.Time
}

func (Payment) TableName() string {
	return "finance.fee_payments"
}

// ==================== SCHOLARSHIP (finance.scholarships) ====================
type Scholarship struct {
	ID              uint `gorm:"primaryKey"`
	CreatedAt       time.Time
	UpdatedAt       time.Time
	Name            string
	Provider        string // University, State Govt, Central Govt, NGO
	ScholarshipType string // Merit, Need-based, Sports, Minority
	Amount          float64
	Criteria        string
	AcademicYearID  uint
	AcademicYear    AcademicYear `gorm:"foreignKey:AcademicYearID"`
	LastDate        *time.Time
	IsActive        bool `gorm:"default:true"`
}

func (Scholarship) TableName() string {
	return "finance.scholarships"
}

// ==================== STUDENT SCHOLARSHIP (finance.student_scholarships) ====================
type StudentScholarship struct {
	ID            uint `gorm:"primaryKey"`
	CreatedAt     time.Time
	UpdatedAt     time.Time
	StudentID     uint
	Student       Student `gorm:"foreignKey:StudentID"`
	ScholarshipID uint
	Scholarship   Scholarship `gorm:"foreignKey:ScholarshipID"`
	AppliedDate   *time.Time
	AwardedDate   *time.Time
	AmountAwarded float64
	Status        string `gorm:"default:'Applied'"` // Applied, Approved, Rejected, Disbursed
	ApprovedBy    *uint
	Remarks       string
}

func (StudentScholarship) TableName() string {
	return "finance.student_scholarships"
}

// ==================== BOOK (library.books) ====================
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
	Subject         *Subject `gorm:"foreignKey:SubjectID"`
	TotalCopies     int      `gorm:"default:1"`
	AvailableCopies int      `gorm:"default:1"`
	RackNumber      string
	CoverImageURL   string
	Description     string
}

func (Book) TableName() string {
	return "library.books"
}

// ==================== EBOOK (library.ebooks) ====================
type EBook struct {
	ID            uint `gorm:"primaryKey"`
	CreatedAt     time.Time
	UpdatedAt     time.Time
	Title         string
	Author        string
	SubjectID     *uint
	Subject       *Subject `gorm:"foreignKey:SubjectID"`
	FileURL       string
	PublishedYear int
	AccessType    string `gorm:"default:'All'"` // All, Faculty, PG, UG
}

func (EBook) TableName() string {
	return "library.ebooks"
}

// ==================== LIBRARY TRANSACTION (library.transactions) ====================
type LibraryTransaction struct {
	ID         uint `gorm:"primaryKey"`
	CreatedAt  time.Time
	UpdatedAt  time.Time
	BookID     uint
	Book       Book   `gorm:"foreignKey:BookID"`
	UserID     string `gorm:"type:uuid"`
	IssuedDate time.Time
	DueDate    time.Time
	ReturnDate *time.Time
	FineAmount float64 `gorm:"default:0"`
	FinePaid   bool    `gorm:"default:false"`
	Status     string  `gorm:"default:'Issued'"`
	IssuedBy   string  `gorm:"type:uuid"`
}

func (LibraryTransaction) TableName() string {
	return "library.transactions"
}

// ==================== BOOK RESERVATION (library.book_reservations) ====================
type BookReservation struct {
	ID         uint `gorm:"primaryKey"`
	CreatedAt  time.Time
	UpdatedAt  time.Time
	BookID     uint
	Book       Book   `gorm:"foreignKey:BookID"`
	UserID     string `gorm:"type:uuid"`
	ReservedAt time.Time
	Status     string `gorm:"default:'Waiting'"` // Waiting, Ready, Cancelled
}

func (BookReservation) TableName() string {
	return "library.book_reservations"
}

// ==================== HOSTEL (hostel.hostels) ====================
type Hostel struct {
	ID            uint `gorm:"primaryKey"`
	CreatedAt     time.Time
	UpdatedAt     time.Time
	CollegeID     uint
	College       College `gorm:"foreignKey:CollegeID"`
	HostelName    string
	HostelType    string // Boys, Girls, Mixed
	TotalRooms    int
	TotalCapacity int
	WardenName    string
	WardenPhone   string
	Phone         string
	Address       string
	Amenities     string
	IsActive      bool `gorm:"default:true"`
}

func (Hostel) TableName() string {
	return "hostel.hostels"
}

// ==================== HOSTEL ROOM (hostel.rooms) ====================
type HostelRoom struct {
	ID               uint `gorm:"primaryKey"`
	CreatedAt        time.Time
	UpdatedAt        time.Time
	HostelID         uint
	Hostel           Hostel `gorm:"foreignKey:HostelID"`
	RoomNumber       string `gorm:"not null"`
	FloorNumber      int
	RoomType         string // Single, Double, Triple, Dormitory
	Capacity         int
	CurrentOccupancy int    `gorm:"default:0"`
	RoomStatus       string `gorm:"default:'Available'"` // Available, Full, Maintenance
	MonthlyRent      float64
	Amenities        string
}

func (HostelRoom) TableName() string {
	return "hostel.rooms"
}

// ==================== HOSTEL ALLOCATION (hostel.allocations) ====================
type HostelAllocation struct {
	ID             uint `gorm:"primaryKey"`
	CreatedAt      time.Time
	UpdatedAt      time.Time
	StudentID      uint
	Student        Student `gorm:"foreignKey:StudentID"`
	RoomID         uint
	Room           HostelRoom `gorm:"foreignKey:RoomID"`
	AcademicYearID uint
	AcademicYear   AcademicYear `gorm:"foreignKey:AcademicYearID"`
	AllotmentDate  *time.Time
	VacatingDate   *time.Time
	Status         string `gorm:"default:'Active'"` // Active, Vacated, Transferred
}

func (HostelAllocation) TableName() string {
	return "hostel.allocations"
}

// ==================== HOSTEL COMPLAINT (hostel.hostel_complaints) ====================
type HostelComplaint struct {
	ID            uint `gorm:"primaryKey"`
	CreatedAt     time.Time
	UpdatedAt     time.Time
	StudentID     uint
	Student       Student `gorm:"foreignKey:StudentID"`
	HostelID      uint
	Hostel        Hostel `gorm:"foreignKey:HostelID"`
	ComplaintType string // Electrical, Plumbing, Security, Food
	Description   string
	Status        string `gorm:"default:'Open'"` // Open, InProgress, Resolved
	ResolvedAt    *time.Time
}

func (HostelComplaint) TableName() string {
	return "hostel.hostel_complaints"
}

// ==================== NOTICE (notify.notices) ====================
type Notice struct {
	ID             uint `gorm:"primaryKey"`
	CreatedAt      time.Time
	UpdatedAt      time.Time
	CollegeID      *uint
	College        *College `gorm:"foreignKey:CollegeID"`
	DepartmentID   *uint
	Department     *Department `gorm:"foreignKey:DepartmentID"`
	Title          string
	Content        string
	NoticeType     string
	TargetAudience string
	AttachmentURL  string
	PostedBy       *string `gorm:"type:uuid"`
	PostedDate     *time.Time
	ExpiryDate     *time.Time
	IsPinned       bool `gorm:"default:false"`
	IsActive       bool `gorm:"default:true"`
}

func (Notice) TableName() string {
	return "notify.notices"
}

// ==================== EVENT (notify.events) ====================
type Event struct {
	ID               uint `gorm:"primaryKey"`
	CreatedAt        time.Time
	UpdatedAt        time.Time
	CollegeID        *uint
	College          *College `gorm:"foreignKey:CollegeID"`
	EventName        string
	EventType        string // Cultural, Technical, Sports, Seminar, Workshop
	Description      string
	BannerURL        string
	EventDate        *time.Time
	EndDate          *time.Time
	Venue            string
	Organizer        string
	RegistrationLink string
	MaxParticipants  int
	IsActive         bool `gorm:"default:true"`
}

func (Event) TableName() string {
	return "notify.events"
}

// ==================== APPLICATION (core.admissions) ====================
type Application struct {
	ID              uint `gorm:"primaryKey"`
	CreatedAt       time.Time
	UpdatedAt       time.Time
	ProgramID       uint
	Program         Program `gorm:"foreignKey:ProgramID"`
	AcademicYearID  uint
	AcademicYear    AcademicYear `gorm:"foreignKey:AcademicYearID"`
	StudentID       uint
	Student         Student `gorm:"foreignKey:StudentID"`
	CollegeID       *uint
	College         *College `gorm:"foreignKey:CollegeID"`
	ApplicantName   string
	FirstName       string
	LastName        string
	Email           string
	Phone           string
	DOB             *time.Time
	Gender          string
	Category        string
	State           string
	Address         string
	City            string
	Pincode         string
	PreviousSchool  string
	PreviousGrade   string
	Statement       string
	EntranceExam    string // JEE, NEET, CAT, State CET
	EntranceScore   float64
	MeritRank       int
	AppliedDate     *time.Time
	SubmittedAt     *time.Time
	ReviewedAt      *time.Time
	ReviewedBy      *uint
	ShortlistedAt   *time.Time
	EnrolledAt      *time.Time
	RejectionReason string
	Status          string `gorm:"default:'Pending'"` // Pending, Shortlisted, Selected, Admitted, Rejected, Waitlisted
	Remarks         string
	// Relations
	Documents []Document
}

func (Application) TableName() string {
	return "core.admissions"
}

// ==================== ADMISSION (alias for backward compatibility) ====================
type Admission = Application

// ==================== DOCUMENT (student.student_documents) ====================
type Document struct {
	ID            uint `gorm:"primaryKey"`
	CreatedAt     time.Time
	UpdatedAt     time.Time
	StudentID     uint
	Student       Student `gorm:"foreignKey:StudentID"`
	ApplicationID *uint
	Application   *Application `gorm:"foreignKey:ApplicationID"`
	DocType       string       // Aadhar, 10th Cert, 12th Cert, Transfer Cert
	DocumentType  string
	DocName       string
	FileName      string
	FileURL       string
	FileSize      int64
	MimeType      string
	VerifiedBy    *uint
	IsVerified    bool `gorm:"default:false"`
	Remarks       string
	VerifiedAt    *time.Time
}

func (Document) TableName() string {
	return "student.student_documents"
}

// ==================== COMPANY (core.companies) ====================
type Company struct {
	ID        uint `gorm:"primaryKey"`
	CreatedAt time.Time
	UpdatedAt time.Time
	Name      string
	Industry  string
	Website   string
	HRContact string
	HREmail   string
	HRPhone   string
	Address   string
}

func (Company) TableName() string {
	return "core.companies"
}

// ==================== PLACEMENT DRIVE (core.placement_drives) ====================
type PlacementDrive struct {
	ID          uint `gorm:"primaryKey"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
	CompanyID   uint
	Company     Company `gorm:"foreignKey:CompanyID"`
	CollegeID   uint
	College     College `gorm:"foreignKey:CollegeID"`
	DriveDate   *time.Time
	JobRole     string
	JobType     string // Full-time, Internship, Part-time
	PackageLPA  float64
	Eligibility string
	Description string
	Status      string `gorm:"default:'Upcoming'"`
}

func (PlacementDrive) TableName() string {
	return "core.placement_drives"
}

// ==================== PLACEMENT APPLICATION (core.placement_applications) ====================
type PlacementApplication struct {
	ID          uint `gorm:"primaryKey"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
	DriveID     uint
	Drive       PlacementDrive `gorm:"foreignKey:DriveID"`
	StudentID   uint
	Student     Student `gorm:"foreignKey:StudentID"`
	AppliedDate *time.Time
	Status      string `gorm:"default:'Applied'"` // Applied, Shortlisted, Placed, Rejected
	Remarks     string
}

func (PlacementApplication) TableName() string {
	return "core.placement_applications"
}

// ==================== UNIVERSITY ADMIN (core.university_admins) ====================
type UniversityAdmin struct {
	ID           uint    `gorm:"primaryKey"`
	CreatedAt    time.Time
	UpdatedAt    time.Time
	UniversityID uint
	University   University `gorm:"foreignKey:UniversityID"`
	UserID       *string    `gorm:"type:uuid"`
	User         *User      `gorm:"foreignKey:UserID"`
	Designation  string
}

func (UniversityAdmin) TableName() string {
	return "core.university_admins"
}

// ==================== COLLEGE ADMIN (core.college_admins) ====================
type CollegeAdmin struct {
	ID          uint    `gorm:"primaryKey"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
	CollegeID   uint
	College     College `gorm:"foreignKey:CollegeID"`
	UserID      *string `gorm:"type:uuid"`
	User        *User   `gorm:"foreignKey:UserID"`
	Designation string
}

func (CollegeAdmin) TableName() string {
	return "core.college_admins"
}

// ==================== APPLICANT (admissions.applicants) ====================
// Pre-enrollment public application — no user account yet
type Applicant struct {
	ID              uint   `gorm:"primaryKey"`
	CreatedAt       time.Time
	UpdatedAt       time.Time
	ApplicationID   string `gorm:"uniqueIndex;not null"` // APP-2024-XXXX
	ProgramID       uint
	Program         Program `gorm:"foreignKey:ProgramID"`
	CollegeID       uint
	College         College `gorm:"foreignKey:CollegeID"`
	AcademicYearID  uint
	AcademicYear    AcademicYear `gorm:"foreignKey:AcademicYearID"`
	// Personal Info
	FirstName      string
	LastName       string
	Email          string `gorm:"not null"`
	Phone          string
	DOB            *time.Time
	Gender         string
	Category       string    // General, OBC, SC, ST
	State          string
	City           string
	Address        string
	Pincode        string
	// Academic Info
	PreviousSchool string
	PreviousGrade  string
	EntranceExam   string  // JEE, NEET, CAT, State CET
	EntranceScore  float64
	// Statement
	Statement string `gorm:"type:text"`
	// Status tracking
	Status          string     `gorm:"default:'submitted'"` // submitted, under_review, shortlisted, rejected, enrolled
	RejectionReason string
	Remarks         string
	// Timestamps
	SubmittedAt   *time.Time
	ReviewedAt    *time.Time
	ReviewedBy    *string    `gorm:"type:uuid"`
	ShortlistedAt *time.Time
	EnrolledAt    *time.Time
	// On enrollment, link to created student
	StudentID *uint
	Student   *Student `gorm:"foreignKey:StudentID"`
}

func (Applicant) TableName() string {
	return "admissions.applicants"
}

// ==================== PROFILE CHANGE REQUEST (student.profile_change_requests) ====================
type ProfileChangeRequest struct {
	ID          uint   `gorm:"primaryKey"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
	TicketID    string `gorm:"uniqueIndex;not null"` // CHG-XXXX
	StudentID   uint
	Student     Student `gorm:"foreignKey:StudentID"`
	// What they want to change
	FieldName   string // "name", "father_name", "mother_name", "dob", "category", "documents"
	OldValue    string `gorm:"type:text"`
	NewValue    string `gorm:"type:text"`
	Reason      string `gorm:"type:text"`
	DocumentURL string // supporting document uploaded by student
	// Workflow
	Status      string     `gorm:"default:'pending'"` // pending, approved, rejected, expired
	Deadline    *time.Time // 7 days from creation
	ReviewedBy  *string    `gorm:"type:uuid"`
	ReviewedAt  *time.Time
	Remarks     string
}

func (ProfileChangeRequest) TableName() string {
	return "student.profile_change_requests"
}
