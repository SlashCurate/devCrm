package main

import (
	"fmt"
	"log"
	"os"
	"time"

	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
	"university-erp-backend/internal/db"
	"university-erp-backend/internal/models"
)

func hashPassword(p string) string {
	b, _ := bcrypt.GenerateFromPassword([]byte(p), 10)
	return string(b)
}

func ptr[T any](v T) *T { return &v }

func clearData() {
	schemas := []string{"auth", "core", "academic", "student", "faculty", "finance", "library", "hostel", "audit", "notify", "admissions"}
	for _, s := range schemas {
		db.DB.Exec(fmt.Sprintf("DROP SCHEMA IF EXISTS %s CASCADE", s))
	}
	log.Println("✅ Schemas dropped (clean slate)")
}
func seedData() {
log.Println("🌱 Seeding university data...")

// ROLES
roleNames := []string{"university_admin", "finance_controller", "registrar", "college_admin", "hod", "faculty", "student", "staff"}
roles := make([]models.Role, len(roleNames))
for i, name := range roleNames {
role := models.Role{RoleName: name}
db.DB.FirstOrCreate(&role, models.Role{RoleName: name})
roles[i] = role
}
log.Println("✅ Roles seeded")

// UNIVERSITY
univ := models.University{
Name: "National Technology University", ShortName: "NTU", EstablishedYear: 1985,
Address: "University Road", City: "Hyderabad", State: "Telangana", Pincode: "500032",
Phone: "040-12345678", Email: "info@ntu.edu.in", Website: "www.ntu.edu.in",
IsActive: true,
}
db.DB.Create(&univ)

// COLLEGES
cet := models.College{
UniversityID: univ.ID, Name: "College of Engineering & Technology", ShortName: "CET", Code: "CET",
EstablishedYear: 2000, CollegeType: "Engineering", City: "Hyderabad", IsActive: true,
}
db.DB.Create(&cet)
csa := models.College{
UniversityID: univ.ID, Name: "College of Science & Arts", ShortName: "CSA", Code: "CSA",
EstablishedYear: 1990, CollegeType: "Science/Arts", City: "Hyderabad", IsActive: true,
}
db.DB.Create(&csa)

// DEPARTMENTS
deptCSE := models.Department{CollegeID: cet.ID, Name: "Computer Science & Engineering", Code: "CSE", EstablishedYear: 2000, IsActive: true}
deptECE := models.Department{CollegeID: cet.ID, Name: "Electronics & Communication", Code: "ECE", EstablishedYear: 2001, IsActive: true}
db.DB.Create(&deptCSE)
db.DB.Create(&deptECE)

// ACADEMIC YEARS & SEMESTERS
ay24 := models.AcademicYear{YearLabel: "2024-2025", StartDate: ptr(time.Date(2024, 7, 1, 0, 0, 0, 0, time.UTC)), EndDate: ptr(time.Date(2025, 6, 30, 0, 0, 0, 0, time.UTC)), IsCurrent: true}
db.DB.Create(&ay24)
sem1 := models.Semester{AcademicYearID: ay24.ID, SemesterNumber: 1, SemesterName: "Odd", StartDate: ay24.StartDate, EndDate: ptr(time.Date(2024, 11, 30, 0, 0, 0, 0, time.UTC)), IsCurrent: false}
sem2 := models.Semester{AcademicYearID: ay24.ID, SemesterNumber: 2, SemesterName: "Even", StartDate: ptr(time.Date(2025, 1, 1, 0, 0, 0, 0, time.UTC)), EndDate: ay24.EndDate, IsCurrent: true}
db.DB.Create(&sem1)
db.DB.Create(&sem2)

// PROGRAMS
btechCSE := models.Program{DepartmentID: deptCSE.ID, Name: "B.Tech Computer Science & Engineering", Code: "BTECH-CSE", DegreeType: "B.Tech", DurationYears: 4, TotalSemesters: 8, TotalCredits: 160, IsActive: true}
btechECE := models.Program{DepartmentID: deptECE.ID, Name: "B.Tech Electronics & Communication", Code: "BTECH-ECE", DegreeType: "B.Tech", DurationYears: 4, TotalSemesters: 8, TotalCredits: 160, IsActive: true}
db.DB.Create(&btechCSE)
db.DB.Create(&btechECE)

// SUBJECTS
subCSE1 := models.Subject{DepartmentID: deptCSE.ID, SubjectCode: "CSE101", SubjectName: "Programming Fundamentals", Credits: 4, SubjectType: "Theory", SemesterNumber: 1, IsActive: true}
subCSE2 := models.Subject{DepartmentID: deptCSE.ID, SubjectCode: "CSE102", SubjectName: "Data Structures", Credits: 4, SubjectType: "Theory", SemesterNumber: 2, IsActive: true}
db.DB.Create(&subCSE1)
db.DB.Create(&subCSE2)

log.Println("✅ Academic structure seeded")

// USERS (Admins & Faculty)
users := []models.User{
{Username: "univ.admin", Email: "univadmin@ntu.edu.in", PasswordHash: hashPassword("Admin@123"), RoleID: roles[0].ID, IsActive: true},
{Username: "finance.ctrl", Email: "finance@ntu.edu.in", PasswordHash: hashPassword("Admin@123"), RoleID: roles[1].ID, IsActive: true},
{Username: "registrar.ctrl", Email: "registrar@ntu.edu.in", PasswordHash: hashPassword("Admin@123"), RoleID: roles[2].ID, IsActive: true},
{Username: "cet.admin", Email: "cetadmin@ntu.edu.in", PasswordHash: hashPassword("Admin@123"), RoleID: roles[3].ID, IsActive: true},
{Username: "rajesh.kumar", Email: "rajesh.kumar@ntu.edu.in", PasswordHash: hashPassword("Faculty@123"), RoleID: roles[5].ID, IsActive: true},
}
for i := range users {
db.DB.Create(&users[i])
}
log.Println("✅ Admin/Faculty users seeded")

// LINK ADMIN PROFILES
db.DB.Create(&models.UniversityAdmin{UniversityID: univ.ID, UserID: &users[0].ID, Designation: "Super Admin"})
db.DB.Create(&models.CollegeAdmin{CollegeID: cet.ID, UserID: &users[3].ID, Designation: "Dean"})

// FACULTY PROFILE
fac1 := models.Faculty{UserID: users[4].ID, DepartmentID: &deptCSE.ID, EmployeeCode: "FAC001", FirstName: "Rajesh", LastName: "Kumar", IsActive: true}
db.DB.Create(&fac1)

// FEE STRUCTURES
feeCat1 := models.FeeCategory{Name: "Tuition Fee", Description: "Academic tuition"}
feeCat2 := models.FeeCategory{Name: "Exam Fee", Description: "Semester exams"}
db.DB.Create(&feeCat1)

	db.DB.Create(&models.FeeStructure{ProgramID: btechCSE.ID, AcademicYearID: ay24.ID, SemesterNumber: 1, CategoryID: feeCat1.ID, Amount: 60000.0, IsActive: true, CreatedBy: users[1].ID})
	db.DB.Create(&models.FeeStructure{ProgramID: btechCSE.ID, AcademicYearID: ay24.ID, SemesterNumber: 1, CategoryID: feeCat2.ID, Amount: 3000.0, IsActive: true, CreatedBy: users[1].ID})
	db.DB.Create(&models.FeeStructure{ProgramID: btechCSE.ID, AcademicYearID: ay24.ID, SemesterNumber: 2, CategoryID: feeCat1.ID, Amount: 60000.0, IsActive: true, CreatedBy: users[1].ID})

	// ADMISSION CYCLE
	cycle := models.AdmissionCycle{
		Name:                 "B.Tech 2024-25 Admission",
		Description:          "Admission cycle for B.Tech programs for academic year 2024-25",
		AcademicYearID:       ay24.ID,
		ApplicationStartDate: time.Now().AddDate(0, -1, 0), // Started 1 month ago
		ApplicationEndDate:   time.Now().AddDate(0, 2, 0),  // Ends 2 months from now
		IsActive:             true,
		IsPublished:          true,
		ApplicationFee:       500,
		AdmissionFee:         50000,
		MaxApplications:      100,
		CreatedBy:            users[0].ID,
	}
	db.DB.Create(&cycle)
	log.Println("✅ Admission cycle created")

	// PUBLIC APPLICANTS (Not enrolled yet)
	app1 := models.Applicant{
		ApplicationID:    "APP-2024-0001",
		AdmissionCycleID: &cycle.ID,
		ProgramID:        btechCSE.ID,
		CollegeID:        cet.ID,
		AcademicYearID:   ay24.ID,
		FirstName:        "Ramesh",
		LastName:         "Singh",
		Email:            "ramesh.singh@gmail.com",
		Phone:            "9876543210",
		Status:           models.ApplicationSubmitted,
		SubmittedAt:      ptr(time.Now()),
		ApplicationFee:   cycle.ApplicationFee,
		AdmissionFee:     cycle.AdmissionFee,
	}
	db.DB.Create(&app1)

	// ENROLLED STUDENTS
	studUser := models.User{Username: "24cse001", Email: "24cse001@student.ntu.edu.in", PasswordHash: hashPassword("Student@123"), RoleID: roles[6].ID, IsActive: true}
	db.DB.Create(&studUser)

	student1 := models.Student{
		UserID:          studUser.ID,
		ProgramID:       &btechCSE.ID,
		RollNumber:      "24CSE001",
		UniversityRegNo: "NTU24CSE001",
		FirstName:       "Divya",
		LastName:        "Kapoor",
		CurrentSemester: 1,
		IsActive:        true,
	}
	db.DB.Create(&student1)

// INVOICES & PAYMENTS
inv1 := models.StudentFeeInvoice{StudentID: student1.ID, AcademicYearID: ay24.ID, SemesterNumber: 1, TotalAmount: 63000, NetAmount: 63000, PaidAmount: 63000, BalanceDue: 0, Status: "Paid"}
db.DB.Create(&inv1)
db.DB.Create(&models.Payment{InvoiceID: inv1.ID, StudentID: student1.ID, AmountPaid: 63000, PaymentDate: time.Now(), PaymentMode: "UPI", Status: models.PaymentSuccess, IsVerified: true})

// TIMETABLE & ATTENDANCE
tt := models.Timetable{ProgramID: btechCSE.ID, SubjectID: subCSE1.ID, FacultyID: fac1.ID, SemesterID: sem1.ID, Section: "A", DayOfWeek: 1, StartTime: time.Date(0,0,0,9,0,0,0,time.UTC), EndTime: time.Date(0,0,0,10,0,0,0,time.UTC), IsActive: true}
db.DB.Create(&tt)
db.DB.Create(&models.Enrollment{StudentID: student1.ID, SubjectID: subCSE1.ID, SemesterID: sem1.ID, Status: "Active"})
db.DB.Create(&models.Attendance{StudentID: student1.ID, SubjectID: subCSE1.ID, FacultyID: &fac1.ID, SemesterID: sem1.ID, AttendanceDate: time.Now(), Status: "Present"})

log.Println("✅ Data seeded successfully")
}

func main() {
log.Println("🌱 University ERP Database Seeder")
godotenv.Load()

if err := db.Connect(); err != nil {
log.Fatalf("❌ DB Connect failed: %v", err)
}

force := false
for _, arg := range os.Args {
if arg == "--force" { force = true }
}

if force {
clearData()
}

if err := db.CreateSchemas(); err != nil {
log.Fatalf("❌ Schema creation failed: %v", err)
}

if err := db.AutoMigrate(); err != nil {
log.Fatalf("❌ Migration failed: %v", err)
}

seedData()
}
