package main

import (
	"fmt"
	"log"
	"math/rand"
	"os"
	"strings"
	"time"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

// ============================================================================
// DATABASE CONNECTION
// ============================================================================

func initDB() {
	_ = godotenv.Load()
	appEnv := getEnv("APP_ENV", "development")
	host := getEnv("DB_HOST", "localhost")
	port := getEnv("DB_PORT", "5432")
	user := getEnv("DB_USER", "postgres")
	password := getEnv("DB_PASSWORD", "root")
	dbname := getEnv("DB_NAME", "university_erp_prod100")

	// Production safety check
	if appEnv == "production" && password == "root" {
		log.Fatalf("❌ SECURITY ERROR: Default password detected in production. Set DB_PASSWORD env var.")
	}

	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable TimeZone=UTC", host, port, user, password, dbname)
	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	log.Println("✅ Database connected and ready")
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

// ============================================================================
// MODEL DEFINITIONS (Only those needed for this seeder)
// ============================================================================

// Shared
type StatusCode struct {
	ID       uint   `gorm:"primaryKey"`
	Module   string `gorm:"not null;index"`
	Code     string `gorm:"not null;index"`
	Name     string `gorm:"not null"`
	IsActive bool   `gorm:"default:true"`
}
func (StatusCode) TableName() string { return "system.status_codes" }

// Core
type Room struct {
	ID        uint   `gorm:"primaryKey"`
	CampusID  uint   `gorm:"not null;index"`
	RoomNumber string `gorm:"not null"`
	RoomType  string `gorm:"type:varchar(50);index"`
	Capacity  int
	Building  string
	Floor     int
	IsActive  bool   `gorm:"default:true;index"`
	CreatedAt time.Time
}
func (Room) TableName() string { return "core.rooms" }

// Academic
type AcademicTerm struct {
	ID               uint      `gorm:"primaryKey"`
	AcademicYear     string    `gorm:"not null;index"`
	TermName         string    `gorm:"not null"`
	StartDate        time.Time `gorm:"not null"`
	EndDate          time.Time `gorm:"not null"`
	IsCurrent        bool      `gorm:"default:false;index"`
	CreatedAt        time.Time
	UpdatedAt        time.Time
}
func (AcademicTerm) TableName() string { return "academic.academic_terms" }

type Batch struct {
	ID                    uint      `gorm:"primaryKey"`
	ProgramID             uint      `gorm:"not null;index"`
	BatchYear             int       `gorm:"not null;index"`
	AdmissionYear         int       `gorm:"not null"`
	ExpectedGraduationYear int
	Status                string    `gorm:"type:varchar(20);default:'Active'"`
	CreatedAt             time.Time
}
func (Batch) TableName() string { return "academic.batches" }

type Section struct {
	ID         uint      `gorm:"primaryKey"`
	BatchID    uint      `gorm:"not null;index"`
	SectionName string   `gorm:"not null"`
	MentorEmployeeID *uint `gorm:"index"`
	MaxCapacity int
	CreatedAt time.Time
}
func (Section) TableName() string { return "academic.sections" }

type Subject struct {
	ID            uint    `gorm:"primaryKey"`
	DepartmentID  uint    `gorm:"not null;index"`
	SubjectCode   string  `gorm:"unique;not null;index"`
	SubjectName   string  `gorm:"not null"`
	Credits       float32 `gorm:"not null"`
	SubjectType   string  `gorm:"type:varchar(20)"`
	IsActive      bool    `gorm:"default:true;index"`
	CreatedAt     time.Time
	UpdatedAt     time.Time
}
func (Subject) TableName() string { return "academic.subjects" }

type CourseOffering struct {
	ID              uint      `gorm:"primaryKey"`
	ProgramID       uint      `gorm:"not null;index"`
	SubjectID       uint      `gorm:"not null;index"`
	AcademicTermID  uint      `gorm:"not null;index"`
	BatchID         uint      `gorm:"not null;index"`
	SectionID       *uint     `gorm:"index"`
	FacultyEmployeeID uint    `gorm:"not null;index"`
	RoomID          *uint     `gorm:"index"`
	MaxCapacity     int
	Status          string    `gorm:"type:varchar(20);default:'Active'"`
	CreatedAt       time.Time
}
func (CourseOffering) TableName() string { return "academic.course_offerings" }

type Timetable struct {
	ID         uint      `gorm:"primaryKey"`
	OfferingID uint      `gorm:"not null;index"`
	DayOfWeek  int       `gorm:"check:day_of_week between 1 and 7"`
	StartTime  string
	EndTime    string
	CreatedAt  time.Time
}
func (Timetable) TableName() string { return "academic.timetable" }

type ExamSchedule struct {
	ID             uint      `gorm:"primaryKey"`
	SubjectID      uint      `gorm:"not null;index"`
	AcademicTermID uint      `gorm:"not null;index"`
	ExamDate       time.Time `gorm:"not null;index"`
	StartTime      string
	EndTime        string
	ExamType       string    `gorm:"type:varchar(30)"`
	Venue          string
	TotalMarks     int       `gorm:"not null"`
	PassingMarks   int
	CreatedAt      time.Time
}
func (ExamSchedule) TableName() string { return "exam.exam_schedules" }

// HR
type Faculty struct {
	EmployeeID     uint   `gorm:"primaryKey"`
	Specialization string
	Qualification  string
}
func (Faculty) TableName() string { return "hr.faculties" }

// Student
type Student struct {
	ID               uint      `gorm:"primaryKey"`
	UserID           uint      `gorm:"unique;not null;index"`
	EnrollmentNumber string    `gorm:"unique;not null;index"`
	RollNumber       string    `gorm:"unique;index"`
	FirstName        string    `gorm:"not null"`
	LastName         string    `gorm:"not null"`
	Email            string    `gorm:"not null;index"`
	ProgramID        uint      `gorm:"not null;index"`
	IsActive         bool      `gorm:"default:true;index"`
	CreatedAt        time.Time
	UpdatedAt        time.Time
}
func (Student) TableName() string { return "student.students" }

// Hostel
type Hostel struct {
	ID       uint   `gorm:"primaryKey"`
	Name     string `gorm:"not null"`
	Code     string `gorm:"unique;not null;index"`
	CampusID *uint  `gorm:"index"`
	GenderID *uint  `gorm:"index"`
	IsActive bool   `gorm:"default:true;index"`
	CreatedAt time.Time
}
func (Hostel) TableName() string { return "hostel.hostels" }

type HostelRoom struct {
	ID         uint    `gorm:"primaryKey"`
	HostelID   uint    `gorm:"not null;index"`
	RoomNumber string  `gorm:"not null"`
	RoomType   string  `gorm:"type:varchar(20);index"`
	Capacity   int     `gorm:"not null"`
	IsAvailable bool   `gorm:"default:true;index"`
	CreatedAt  time.Time
}
func (HostelRoom) TableName() string { return "hostel.rooms" }

type HostelBed struct {
	ID        uint   `gorm:"primaryKey"`
	RoomID    uint   `gorm:"not null;index"`
	BedNumber string
	IsOccupied bool `gorm:"default:false"`
}
func (HostelBed) TableName() string { return "hostel.beds" }

type HostelAllocation struct {
	ID            uint       `gorm:"primaryKey"`
	StudentID     uint       `gorm:"not null;index"`
	RoomID        uint       `gorm:"not null;index"`
	BedID         *uint      `gorm:"index"`
	AllocatedFrom time.Time  `gorm:"not null;index"`
	AllocatedTo   *time.Time
	StatusID      *uint      `gorm:"index"`
	CreatedBy     *uint
	CreatedAt     time.Time
	UpdatedAt     time.Time
}
func (HostelAllocation) TableName() string { return "hostel.allocations" }

// Transport
type Route struct {
	ID          uint   `gorm:"primaryKey"`
	RouteName   string `gorm:"not null;index"`
	IsActive    bool   `gorm:"default:true;index"`
	CreatedAt   time.Time
}
func (Route) TableName() string { return "transport.routes" }

type Stop struct {
	ID          uint      `gorm:"primaryKey"`
	RouteID     uint      `gorm:"not null;index"`
	StopName    string    `gorm:"not null"`
	StopOrder   int       `gorm:"not null"`
	CreatedAt   time.Time
}
func (Stop) TableName() string { return "transport.stops" }

type StudentPass struct {
	ID           uint       `gorm:"primaryKey"`
	StudentID    uint       `gorm:"not null;index"`
	RouteID      uint       `gorm:"not null;index"`
	PickupStopID uint       `gorm:"not null"`
	DropStopID   uint       `gorm:"not null"`
	ValidFrom    time.Time  `gorm:"not null;index"`
	ValidTo      time.Time  `gorm:"not null;index"`
	FeePaid      float64
	StatusID     *uint      `gorm:"index"`
	CreatedAt    time.Time
}
func (StudentPass) TableName() string { return "transport.student_passes" }

// Library
type BookCopy struct {
	ID          uint   `gorm:"primaryKey"`
	BookID      uint   `gorm:"not null;index"`
	Barcode     string `gorm:"unique;index"`
	CopyNumber  int
	Condition   string `gorm:"type:varchar(20)"`
	ShelfLocation string
	StatusID    *uint  `gorm:"index"`
	CreatedAt   time.Time
}
func (BookCopy) TableName() string { return "library.book_copies" }

type Circulation struct {
	ID           uint       `gorm:"primaryKey"`
	BookCopyID   uint       `gorm:"not null;index"`
	StudentID    uint       `gorm:"not null;index"`
	IssuedDate   time.Time  `gorm:"default:CURRENT_DATE;index"`
	DueDate      time.Time  `gorm:"not null;index"`
	ReturnedDate *time.Time `gorm:"index"`
	StatusID     *uint      `gorm:"index"`
	FineAmount   float64    `gorm:"default:0"`
	FinePaid     bool       `gorm:"default:false"`
	IssuedBy     *uint
	CreatedAt    time.Time
}
func (Circulation) TableName() string { return "library.circulations" }

// ============================================================================
// HELPER: Random data generators
// ============================================================================

func randomDate(start, end time.Time) time.Time {
	delta := end.Sub(start)
	sec := rand.Int63n(int64(delta.Seconds()))
	return start.Add(time.Duration(sec) * time.Second)
}

func randomBool() bool {
	return rand.Intn(2) == 1
}

func randomInt(min, max int) int {
	return min + rand.Intn(max-min+1)
}

func randomFloat(min, max float64) float64 {
	return min + rand.Float64()*(max-min)
}

// ============================================================================
// INSERT ADDITIONAL DATA
// ============================================================================

func seedAdditionalData() {
	log.Println("\n🌱 Seeding additional operational data...")

	// --- 1. Course Offerings ---
	seedCourseOfferings()

	// --- 2. Timetables ---
	seedTimetables()

	// --- 3. Exam Schedules ---
	seedExamSchedules()

	// --- 4. Hostel Allocations ---
	seedHostelAllocations()

	// --- 5. Transport Passes ---
	seedTransportPasses()

	// --- 6. Library Circulations ---
	seedLibraryCirculations()

	log.Println("\n✅ Additional data seeded successfully!")
}

// --- 1. Course Offerings ---
func seedCourseOfferings() {
	log.Println("  📚 Seeding Course Offerings...")

	// Get required IDs
	var (
		term      AcademicTerm
		batch     Batch
		section   Section
		subjects  []Subject
		faculties []Faculty
		rooms     []Room
	)

	DB.Where("is_current = ?", true).First(&term)
	DB.Where("batch_year = ?", 2024).First(&batch)
	DB.Where("batch_id = ?", batch.ID).First(&section)
	DB.Find(&subjects)
	DB.Find(&faculties)
	DB.Find(&rooms)

	if len(subjects) == 0 || len(faculties) == 0 || len(rooms) == 0 {
		log.Println("    ⚠️  No subjects/faculties/rooms found. Skipping course offerings.")
		return
	}

	// Create course offerings for each subject
	for _, sub := range subjects {
		// Pick a random faculty and room
		faculty := faculties[rand.Intn(len(faculties))]
		room := rooms[rand.Intn(len(rooms))]

		offering := CourseOffering{
			ProgramID:        1, // Assuming BTECH-CSE is ID 1
			SubjectID:        sub.ID,
			AcademicTermID:   term.ID,
			BatchID:          batch.ID,
			SectionID:        &section.ID,
			FacultyEmployeeID: faculty.EmployeeID,
			RoomID:           &room.ID,
			MaxCapacity:      60,
			Status:           "Active",
			CreatedAt:        time.Now(),
		}
		DB.Clauses(clause.OnConflict{DoNothing: true}).Create(&offering)
	}
	log.Println("    ✅ Course Offerings seeded")
}

// --- 2. Timetables ---
func seedTimetables() {
	log.Println("  ⏰ Seeding Timetables...")

	var offerings []CourseOffering
	DB.Find(&offerings)

	if len(offerings) == 0 {
		log.Println("    ⚠️  No course offerings found. Skipping timetables.")
		return
	}

	days := []int{1, 2, 3, 4, 5} // Mon-Fri
	times := []struct {
		start string
		end   string
	}{
		{"09:00", "10:30"},
		{"10:30", "12:00"},
		{"13:00", "14:30"},
		{"14:30", "16:00"},
	}

	for _, offering := range offerings {
		// Assign 2 random slots per offering
		for i := 0; i < 2; i++ {
			day := days[rand.Intn(len(days))]
			timeSlot := times[rand.Intn(len(times))]
			timetable := Timetable{
				OfferingID: offering.ID,
				DayOfWeek:  day,
				StartTime:  timeSlot.start,
				EndTime:    timeSlot.end,
				CreatedAt:  time.Now(),
			}
			DB.Clauses(clause.OnConflict{DoNothing: true}).Create(&timetable)
		}
	}
	log.Println("    ✅ Timetables seeded")
}

// --- 3. Exam Schedules ---
func seedExamSchedules() {
	log.Println("  📝 Seeding Exam Schedules...")

	var (
		term     AcademicTerm
		subjects []Subject
		rooms    []Room
	)

	DB.Where("is_current = ?", true).First(&term)
	DB.Find(&subjects)
	DB.Find(&rooms)

	if len(subjects) == 0 || len(rooms) == 0 {
		log.Println("    ⚠️  No subjects/rooms found. Skipping exam schedules.")
		return
	}

	// Create exam schedules for each subject
	for _, sub := range subjects {
		room := rooms[rand.Intn(len(rooms))]
		examDate := randomDate(term.StartDate, term.EndDate)

		schedule := ExamSchedule{
			SubjectID:      sub.ID,
			AcademicTermID: term.ID,
			ExamDate:       examDate,
			StartTime:      "10:00",
			EndTime:        "13:00",
			ExamType:       "Midterm",
			Venue:          room.RoomNumber,
			TotalMarks:     100,
			PassingMarks:   40,
			CreatedAt:      time.Now(),
		}
		DB.Clauses(clause.OnConflict{DoNothing: true}).Create(&schedule)
	}
	log.Println("    ✅ Exam Schedules seeded")
}

// --- 4. Hostel Allocations ---
func seedHostelAllocations() {
	log.Println("  🏠 Seeding Hostel Allocations...")

	var (
		students []Student
		hostels  []Hostel
		rooms    []HostelRoom
		beds     []HostelBed
	)

	DB.Find(&students)
	DB.Find(&hostels)
	DB.Find(&rooms)
	DB.Find(&beds)

	if len(students) == 0 || len(hostels) == 0 || len(rooms) == 0 || len(beds) == 0 {
		log.Println("    ⚠️  No students/hostels/rooms/beds found. Skipping hostel allocations.")
		return
	}

	// Allocate hostel to 50% of students
	for _, stud := range students {
		if randomBool() {
			room := rooms[rand.Intn(len(rooms))]
			bed := beds[rand.Intn(len(beds))]

			allocation := HostelAllocation{
				StudentID:   stud.ID,
				RoomID:      room.ID,
				BedID:       &bed.ID,
				AllocatedFrom: time.Now(),
				AllocatedTo:   nil, // Open-ended
				StatusID:    nil, // Default to active
				CreatedBy:   nil,
				CreatedAt:   time.Now(),
				UpdatedAt:   time.Now(),
			}
			DB.Clauses(clause.OnConflict{DoNothing: true}).Create(&allocation)
		}
	}
	log.Println("    ✅ Hostel Allocations seeded")
}

// --- 5. Transport Passes ---
func seedTransportPasses() {
	log.Println("  🚌 Seeding Transport Passes...")

	var (
		students []Student
		routes   []Route
		stops    []Stop
	)

	DB.Find(&students)
	DB.Find(&routes)
	DB.Find(&stops)

	if len(students) == 0 || len(routes) == 0 || len(stops) < 2 {
		log.Println("    ⚠️  No students/routes/stops found. Skipping transport passes.")
		return
	}

	// Assign transport passes to 30% of students
	for _, stud := range students {
		if rand.Float64() < 0.3 {
			route := routes[rand.Intn(len(routes))]
			pickupStop := stops[rand.Intn(len(stops))]
			dropStop := stops[rand.Intn(len(stops))]

			pass := StudentPass{
				StudentID:    stud.ID,
				RouteID:      route.ID,
				PickupStopID: pickupStop.ID,
				DropStopID:   dropStop.ID,
				ValidFrom:    time.Now(),
				ValidTo:      time.Now().AddDate(1, 0, 0), // 1 year
				FeePaid:      5000.0,
				StatusID:     nil, // Default to active
				CreatedAt:    time.Now(),
			}
			DB.Clauses(clause.OnConflict{DoNothing: true}).Create(&pass)
		}
	}
	log.Println("    ✅ Transport Passes seeded")
}

// --- 6. Library Circulations ---
func seedLibraryCirculations() {
	log.Println("  📖 Seeding Library Circulations...")

	var (
		students    []Student
		bookCopies  []BookCopy
		issuedStatus StatusCode
	)

	DB.Find(&students)
	DB.Find(&bookCopies)
	DB.Where("module = ? AND code = ?", "library", "ISSUED").First(&issuedStatus)

	if len(students) == 0 || len(bookCopies) == 0 {
		log.Println("    ⚠️  No students/book copies found. Skipping library circulations.")
		return
	}

	// Issue books to students
	for _, stud := range students {
		// Each student borrows 1-3 books
		for i := 0; i < rand.Intn(3)+1; i++ {
			copy := bookCopies[rand.Intn(len(bookCopies))]
			issueDate := time.Now().AddDate(0, 0, -rand.Intn(30))
			dueDate := issueDate.AddDate(0, 0, 14) // 2 weeks

			circulation := Circulation{
				BookCopyID:   copy.ID,
				StudentID:    stud.ID,
				IssuedDate:   issueDate,
				DueDate:      dueDate,
				ReturnedDate: nil, // Not returned yet
				StatusID:     &issuedStatus.ID,
				FineAmount:   0,
				FinePaid:     false,
				IssuedBy:     nil,
				CreatedAt:    time.Now(),
			}
			DB.Clauses(clause.OnConflict{DoNothing: true}).Create(&circulation)
		}
	}
	log.Println("    ✅ Library Circulations seeded")
}

// ============================================================================
// MAIN
// ============================================================================

func main() {
	log.Println("\n" + strings.Repeat("=", 80))
	log.Println("🚀 UNIVERSITY ERP - ADDITIONAL DATA SEEDER")
	log.Println(strings.Repeat("=", 80) + "\n")

	// Initialize database connection
	initDB()

	// Seed additional data
	seedAdditionalData()

	log.Println("\n" + strings.Repeat("=", 80))
	log.Println("✅ ALL ADDITIONAL DATA INSERTED SUCCESSFULLY!")
	log.Println(strings.Repeat("=", 80) + "\n")
}