# University ERP Backend - Complete Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Project Structure](#project-structure)
4. [Database Schema](#database-schema)
5. [Domain Models](#domain-models)
6. [Platform Layer](#platform-layer)
7. [Modules](#modules)
8. [API Endpoints](#api-endpoints)
9. [Authentication & Authorization](#authentication--authorization)
10. [Event-Driven Architecture](#event-driven-architecture)
11. [Configuration](#configuration)
12. [Known Issues & Potential Bugs](#known-issues--potential-bugs)
13. [Deployment](#deployment)

---

## System Overview

The University ERP Backend is a comprehensive REST API built with Go (Golang) that manages all aspects of university operations including:
- Student management and enrollment
- Academic programs and curriculum
- Admissions and applications
- Finance and payments
- HR and payroll
- Examinations and results
- Hostel and transport
- Library management
- Security and audit

**Tech Stack:**
- **Language:** Go 1.21
- **Web Framework:** Gorilla Mux
- **ORM:** GORM
- **Database:** PostgreSQL
- **Authentication:** JWT (golang-jwt/jwt/v5)
- **Password Hashing:** bcrypt (golang.org/x/crypto)
- **Payment Gateway:** Razorpay
- **Environment:** godotenv

---

## Architecture

### Layered Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    HTTP Layer (Handlers)                  │
│              (Request/Response Handling)                   │
├─────────────────────────────────────────────────────────┤
│                  Business Logic (Services)                │
│              (Domain Rules & Validation)                  │
├─────────────────────────────────────────────────────────┤
│                  Data Access (Repositories)               │
│              (Database Operations)                        │
├─────────────────────────────────────────────────────────┤
│                  Domain Models (Entities)                 │
│              (Business Objects)                           │
├─────────────────────────────────────────────────────────┤
│                  Platform Layer                           │
│         (Database, Auth, Middleware, EventBus)            │
└─────────────────────────────────────────────────────────┘
```

### Design Patterns Used

1. **Repository Pattern:** Separates data access logic from business logic
2. **Service Layer Pattern:** Encapsulates business logic
3. **Transactional Outbox Pattern:** Ensures event delivery consistency
4. **Event-Driven Architecture:** Decoupled module communication via EventBus
5. **Middleware Pattern:** Cross-cutting concerns (auth, logging, CORS)
6. **Dependency Injection:** Clean separation of concerns

---

## Project Structure

```
backend/
├── cmd/
│   ├── main.go                 # Application entry point
│   └── seed/
│       ├── main.go            # Database seeder entry
│       ├── seed.go            # Additional data seeder
│       └── productionReady.go # Production-ready seeder
├── internal/
│   ├── config/
│   │   └── config.go          # Configuration management
│   ├── domain/                # Domain models (entities)
│   │   ├── shared.go          # Shared entities (User, Role, AuditLog, Outbox)
│   │   ├── core.go            # Core entities (University, Campus, Department, Room)
│   │   ├── academic.go        # Academic entities (Program, Subject, CourseOffering, etc.)
│   │   ├── student.go         # Student entities (Student, Guardian, Grievance, etc.)
│   │   ├── admissions.go      # Admission entities (AdmissionCycle, Applicant, Document)
│   │   ├── finance.go         # Finance entities (Invoice, Payment, Scholarship)
│   │   ├── hr.go              # HR entities (Employee, Faculty, Salary, Leave)
│   │   ├── exam.go            # Exam entities (ExamSchedule, Result, Revaluation)
│   │   ├── facilities.go      # Facilities (Hostel, Transport, Library, Security)
│   │   └── system.go          # System entities (StatusCode, Configuration, Notification)
│   ├── modules/               # Business modules
│   │   ├── auth/
│   │   │   ├── handler.go     # HTTP handlers
│   │   │   ├── service.go     # Business logic
│   │   │   └── repository.go  # Data access
│   │   └── student/
│   │       ├── handler.go
│   │       ├── service.go
│   │       └── repository.go
│   └── platform/              # Cross-cutting concerns
│       ├── database/
│       │   └── postgres.go    # Database connection & migration
│       ├── middleware/
│       │   └── middleware.go  # Auth, CORS, Logging, Audit
│       ├── auth/
│       │   └── jwt.go         # JWT token management
│       ├── response/
│       │   └── response.go    # HTTP response helpers
│       ├── apperrors/
│       │   └── errors.go      # Application error types
│       ├── eventbus/
│       │   ├── bus.go         # In-process event bus
│       │   └── events.go      # Event type definitions
│       └── outbox/
│           └── outbox.go      # Transactional outbox pattern
├── .env                        # Environment variables
├── go.mod                      # Go module dependencies
├── go.sum                      # Dependency checksums
├── Dockerfile                  # Docker image definition
└── README.md                   # Project documentation
```

---

## Database Schema

### PostgreSQL Schemas (15 schemas)

The database is organized into 15 schemas for logical separation:

1. **shared** - Identity & Access (users, roles, audit logs, outbox events)
2. **system** - System lookups (genders, categories, status codes, configurations)
3. **core** - Organization structure (universities, campuses, departments, rooms)
4. **academic** - Academic management (programs, subjects, courses, timetable)
5. **hr** - Human resources (employees, faculty, salary, leave, recruitment)
6. **student** - Student records (students, guardians, attendance, grievances)
7. **admissions** - Admission management (cycles, applicants, documents, seat allocation)
8. **finance** - Financial management (invoices, payments, scholarships, refunds)
9. **exam** - Examination management (schedules, results, revaluation)
10. **hostel** - Hostel management (hostels, rooms, allocations, mess bills)
11. **transport** - Transport management (buses, routes, passes, maintenance)
12. **library** - Library management (books, circulation, reservations, fines)
13. **security** - Security & access control (permissions, sessions, login attempts)
14. **audit** - System events and logging
15. **notify** - Notifications (if separate from system)

### Key Tables

#### Shared Schema
- **users** - User accounts with authentication
- **roles** - Role definitions (university_admin, finance_controller, registrar, college_admin, student, faculty, staff)
- **user_roles** - Many-to-many user-role mapping
- **audit_logs** - Audit trail for all write operations
- **outbox_events** - Transactional outbox for event publishing

#### System Schema
- **genders** - Gender lookup (Male, Female, Other)
- **categories** - Category lookup (General, OBC, SC, ST)
- **blood_groups** - Blood group lookup
- **status_codes** - Status codes for all modules (student, finance, admission, etc.)
- **configurations** - System configuration key-value pairs
- **notifications** - User notifications
- **scheduled_jobs** - Background job tracking

#### Core Schema
- **universities** - University information
- **campuses** - Campus locations
- **departments** - Academic departments
- **rooms** - Physical rooms (classrooms, labs, offices)

#### Academic Schema
- **academic_terms** - Academic terms/semesters
- **academic_calendar** - Academic calendar events
- **programs** - Degree programs (B.Tech, M.Tech, etc.)
- **program_semesters** - Program semester definitions
- **subjects** - Course subjects
- **program_subjects** - Subject-program mapping
- **subject_prerequisites** - Subject prerequisites
- **batches** - Student batches by year
- **sections** - Student sections
- **course_offerings** - Specific course offerings
- **term_registrations** - Student term registrations
- **course_registrations** - Student course registrations
- **timetable** - Class schedules

#### Student Schema
- **students** - Student profiles
- **student_status_history** - Student status changes
- **guardians** - Guardian information
- **medical_records** - Medical information
- **grievances** - Student grievances
- **class_sessions** - Individual class sessions
- **student_attendance** - Attendance records
- **student_enrollments** - Course enrollment records
- **alumni** - Alumni information

#### Admissions Schema
- **admission_cycles** - Admission cycles
- **applicants** - Applicant information
- **application_status_history** - Application status changes
- **documents** - Applicant documents
- **seat_allocations** - Seat allocations
- **applicant_student_map** - Mapping applicants to students
- **waitlist** - Waitlist management

#### Finance Schema
- **fee_heads** - Fee categories (tuition, exam, hostel)
- **fee_structures** - Fee structure definitions
- **invoices** - Student invoices
- **invoice_items** - Invoice line items
- **payments** - Payment records
- **payment_allocations** - Payment-to-invoice allocation
- **scholarships** - Scholarship definitions
- **student_scholarships** - Student scholarship awards
- **student_discounts** - Student discounts
- **installment_plans** - Installment plans
- **refunds** - Refund records

#### HR Schema
- **designations** - Job designations
- **employment_types** - Employment types
- **leave_types** - Leave type definitions
- **employees** - Employee records
- **employee_department_history** - Department change history
- **employee_designation_history** - Designation change history
- **faculties** - Faculty-specific information
- **staffs** - Staff-specific information
- **salary_components** - Salary components
- **salaries** - Salary structures
- **salary_details** - Salary detail breakdown
- **payroll_runs** - Payroll processing
- **leave_balances** - Leave balance tracking
- **leave_requests** - Leave requests
- **hr_attendance** - Employee attendance
- **recruitment_jobs** - Job postings
- **job_applications** - Job applications

#### Exam Schema
- **exam_components** - Exam components (midterm, final, practical)
- **exam_schedules** - Exam schedules
- **component_marks** - Component-wise marks
- **results** - Student results
- **revaluation_requests** - Revaluation requests
- **supplementary_exams** - Supplementary exams

#### Facilities Schema

**Hostel:**
- **hostels** - Hostel information
- **hostel_rooms** - Hostel rooms
- **hostel_beds** - Bed assignments
- **hostel_allocations** - Room allocations
- **hostel_allocation_history** - Allocation history
- **mess_bills** - Mess bills
- **maintenance_requests** - Maintenance requests
- **visitor_logs** - Visitor logs

**Transport:**
- **buses** - Bus information
- **routes** - Transport routes
- **stops** - Bus stops
- **bus_assignments** - Bus-route assignments
- **student_passes** - Student transport passes
- **vehicle_maintenance** - Maintenance records

**Library:**
- **authors** - Book authors
- **books** - Book catalog
- **book_copies** - Physical book copies
- **book_authors** - Book-author mapping
- **digital_resources** - Digital resources
- **circulations** - Book circulation
- **reservations** - Book reservations
- **library_fines** - Fine records
- **purchase_requests** - Purchase requests

**Security:**
- **permissions** - Permission definitions
- **role_permissions** - Role-permission mapping
- **user_sessions** - User sessions
- **login_attempts** - Login attempt tracking
- **password_resets** - Password reset tokens
- **api_keys** - API key management

**Audit:**
- **system_events** - System event logging

---

## Domain Models

### Shared Domain

#### User
```go
type User struct {
    ID           uint       `gorm:"primaryKey"`
    Username     string     `gorm:"unique;not null;index"`
    Email        string     `gorm:"unique;not null;index"`
    PasswordHash string     `gorm:"not null"`
    IsActive     bool       `gorm:"default:true;index"`
    LastLoginAt  *time.Time
    CreatedAt    time.Time
    UpdatedAt    time.Time
}
```

#### Role
```go
type Role struct {
    ID          uint   `gorm:"primaryKey"`
    RoleName    string `gorm:"unique;not null"`
    Description string
    CreatedAt   time.Time
}
```

#### OutboxEvent
```go
type OutboxEvent struct {
    ID            uint       `gorm:"primaryKey"`
    AggregateType string    `gorm:"type:varchar(100);not null;index"`
    AggregateID   string    `gorm:"type:varchar(100);not null;index"`
    EventType     string    `gorm:"type:varchar(100);not null;index"`
    Payload       string    `gorm:"type:jsonb;not null"`
    Published     bool      `gorm:"default:false;index"`
    PublishedAt   *time.Time
    RetryCount    int       `gorm:"default:0"`
    LastError     string
    CreatedAt     time.Time
}
```

### Core Domain

#### University
```go
type University struct {
    ID              uint
    Name            string
    ShortName       string `gorm:"unique;not null;index"`
    EstablishedYear int
    Address         string
    City            string
    State           string
    PostalCode      string
    Phone           string
    Email           string
    Website         string
    Vision          string
    Mission         string
    IsActive        bool `gorm:"default:true;index"`
    CreatedAt       time.Time
    UpdatedAt       time.Time
}
```

### Student Domain

#### Student
```go
type Student struct {
    ID                  uint
    UserID              uint `gorm:"unique;not null;index"`
    EnrollmentNumber    string `gorm:"unique;not null;index"`
    RollNumber          string `gorm:"unique;index"`
    FirstName           string `gorm:"not null"`
    LastName            string `gorm:"not null"`
    DateOfBirth         time.Time `gorm:"not null"`
    GenderID            *uint `gorm:"index"`
    Phone               string
    Email               string `gorm:"not null;index"`
    AlternateEmail      string
    Address             string
    City                string
    State               string
    PostalCode          string
    Nationality         string `gorm:"default:'Indian'"`
    CategoryID          *uint `gorm:"index"`
    ProgramID           uint `gorm:"not null;index"`
    AdmissionYear       int `gorm:"not null;index"`
    AdmissionQuota      string
    IsHostelRequired    bool `gorm:"default:false"`
    IsTransportRequired bool `gorm:"default:false"`
    StatusID            *uint `gorm:"index"`
    AcademicStanding    string `gorm:"type:varchar(30);default:'Good'"`
    ProfilePhoto        string
    CreatedAt           time.Time
    UpdatedAt           time.Time
}
```

### Finance Domain

#### Invoice
```go
type Invoice struct {
    ID             uint
    StudentID      uint `gorm:"not null;index"`
    InvoiceNumber  string `gorm:"unique;not null;index"`
    AcademicTermID uint `gorm:"not null;index"`
    GeneratedDate  time.Time `gorm:"default:CURRENT_DATE;index"`
    DueDate        time.Time `gorm:"not null;index"`
    TotalAmount    float64 `gorm:"not null"`
    PaidAmount     float64 `gorm:"default:0"`
    LateFeeApplied float64 `gorm:"default:0"`
    StatusID       *uint `gorm:"index"`
    CreatedAt      time.Time
    UpdatedAt      time.Time
}
```

---

## Platform Layer

### Database (platform/database/postgres.go)

**Responsibilities:**
- Database connection management
- Schema creation (15 schemas)
- Auto-migration of all domain models
- Trigger installation (updated_at triggers)
- Row-Level Security (RLS) on sensitive tables

**Key Functions:**
- `Connect(cfg *config.Config) *gorm.DB` - Establishes connection and runs migrations
- `createSchemas(db *gorm.DB)` - Creates all 15 schemas
- `autoMigrate(db *gorm.DB)` - Auto-migrates all domain models
- `installTriggers(db *gorm.DB)` - Installs triggers and RLS

**Connection Pool Settings:**
- Max Open Connections: 25
- Max Idle Connections: 10

### Middleware (platform/middleware/middleware.go)

**Available Middleware:**

1. **CORS(allowedOrigins []string)** - Cross-Origin Resource Sharing
   - Configurable allowed origins
   - Supports credentials
   - Preflight handling

2. **Authenticate(jwtMgr *JWTManager)** - JWT Authentication
   - Validates Bearer token
   - Extracts user ID, username, roles
   - Sets context values for downstream handlers

3. **RequireRoles(allowed ...string)** - Role-Based Authorization
   - Checks if user has required role
   - Returns 403 Forbidden if unauthorized

4. **AuditLog(db *gorm.DB)** - Audit Logging
   - Logs all write operations (POST, PUT, PATCH, DELETE)
   - Records user ID, action, IP address, user agent
   - Writes to shared.audit_logs table

5. **RequestLogger** - Request Logging
   - Logs method, path, and duration
   - Helps with debugging and monitoring

**Context Keys:**
- `ContextUserID` - Authenticated user ID
- `ContextUsername` - Authenticated username
- `ContextRoles` - User roles

### Authentication (platform/auth/jwt.go)

**JWTManager:**
- Token generation with 24-hour expiry
- Token validation
- HS256 signing algorithm
- Claims include: UserID, Username, Roles, Issuer, ExpiresAt, IssuedAt

**Claims Structure:**
```go
type Claims struct {
    UserID   uint     `json:"user_id"`
    Username string   `json:"username"`
    Roles    []string `json:"roles"`
    jwt.RegisteredClaims
}
```

### Response Helpers (platform/response/response.go)

**Functions:**
- `JSON(w, code, data)` - Standard JSON response
- `List(w, data, total, page, pageSize)` - Paginated list response
- `Error(w, err)` - Error response (handles AppError and plain error)
- `Created(w, data)` - 201 Created response
- `NoContent(w)` - 204 No Content response

**Response Format:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error Format:**
```json
{
  "success": false,
  "error": "error message",
  "detail": "detailed error information"
}
```

### Application Errors (platform/apperrors/errors.go)

**Error Types:**
- `NotFound(resource)` - 404 Not Found
- `BadRequest(msg)` - 400 Bad Request
- `Unauthorized(msg)` - 401 Unauthorized
- `Forbidden(msg)` - 403 Forbidden
- `Conflict(msg)` - 409 Conflict
- `Internal(msg, err)` - 500 Internal Server Error
- `Validation(msg)` - 422 Unprocessable Entity

### Event Bus (platform/eventbus/bus.go)

**In-Process Event Bus:**
- Synchronous fanout to all subscribers
- Multiple handlers can subscribe to same event type
- Errors are logged but don't stop other handlers
- Thread-safe with mutex protection

**Key Functions:**
- `Subscribe(eventType, handler)` - Register event handler
- `Publish(ctx, event)` - Publish event synchronously
- `PublishAsync(ctx, event)` - Publish event asynchronously

**Event Structure:**
```go
type Event struct {
    Type          string      // e.g., "student.enrolled"
    AggregateType string      // e.g., "Student"
    AggregateID   string      // e.g., "42"
    Payload       interface{} // Event data
}
```

**Event Types (platform/eventbus/events.go):**
- `EventUserRegistered` - User registration
- `EventUserLoggedIn` - User login
- `EventStudentEnrolled` - Student enrollment
- `EventPaymentCompleted` - Payment success
- `EventInvoiceGenerated` - Invoice creation
- `EventApplicationApproved` - Admission approval
- And many more...

### Transactional Outbox (platform/outbox/outbox.go)

**Purpose:** Ensures event delivery consistency with database transactions

**Writer:**
- `WriteEvent(tx, aggregateType, aggregateID, eventType, payload)` - Writes event within transaction
- Must be called inside `db.Transaction()` callback
- Guarantees atomicity of state change + event publishing

**Worker:**
- Background goroutine that polls outbox table
- Publishes unpublished events to EventBus
- Configurable poll interval and batch size
- Retry mechanism (max 5 retries)
- Marks events as published after successful dispatch

**Configuration:**
- Poll Interval: 2 seconds (configurable)
- Batch Size: 50 (configurable)
- Max Retries: 5

---

## Modules

### Auth Module (internal/modules/auth/)

**Responsibilities:**
- User authentication (login)
- User registration
- Profile management
- Session management
- Login attempt tracking

**Service Methods:**

1. **Login(ctx, req, ip, ua)**
   - Validates username and password
   - Generates JWT token
   - Records login attempt
   - Creates user session
   - Updates last_login_at
   - Publishes `EventUserLoggedIn` event

2. **Register(ctx, req)**
   - Validates input
   - Checks for duplicate username/email
   - Hashes password with bcrypt
   - Creates user record
   - Assigns role
   - Writes outbox event (transactional)
   - Publishes `EventUserRegistered` event

3. **GetProfile(ctx, userID)**
   - Retrieves user profile
   - Includes user roles

**Repository Methods:**
- `FindUserByUsername(username)`
- `FindUserByEmail(email)`
- `FindUserByID(id)`
- `GetUserRoles(userID)`
- `RecordLoginAttempt(attempt)`
- `CreateSession(session)`
- `InvalidateSession(token)`

**API Endpoints:**
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `GET /api/v1/auth/profile` - Get user profile (protected)

### Student Module (internal/modules/student/)

**Responsibilities:**
- Student enrollment
- Student profile management
- Guardian management
- Grievance handling
- Student dashboard

**Service Methods:**

1. **EnrollStudent(ctx, req)**
   - Validates enrollment request
   - Generates enrollment and roll numbers
   - Creates student record
   - Creates status history
   - Writes outbox event (transactional)
   - Publishes `EventStudentEnrolled` event
   - Format: `NTU{year}{rollNumber}`

2. **GetByID(ctx, id)**
   - Retrieves student by ID

3. **GetByUserID(ctx, userID)**
   - Retrieves student by user ID

4. **List(ctx, page, pageSize)**
   - Paginated student list

5. **GetDashboard(ctx, studentID)**
   - Aggregates dashboard data
   - Includes: student info, program, guardians, enrollment count, pending invoices

6. **AddGuardian(ctx, guardian)**
   - Adds guardian for student

7. **FileGrievance(ctx, grievance)**
   - Files student grievance

**Repository Methods:**
- `Create(student)`
- `FindByID(id)`
- `FindByUserID(userID)`
- `FindByEnrollment(enrollment)`
- `ListByProgram(programID, page, pageSize)`
- `ListAll(page, pageSize)`
- `Update(student)`
- `CreateGuardian(guardian)`
- `GetGuardians(studentID)`
- `CreateMedicalRecord(medical)`
- `GetMedicalRecord(studentID)`
- `CreateStatusHistory(history)`
- `GetStatusHistory(studentID)`
- `CreateGrievance(grievance)`
- `GetGrievances(studentID)`
- `GetDashboard(studentID)`

**API Endpoints:**
- `GET /api/v1/students` - List students (protected)
- `POST /api/v1/students/enroll` - Enroll student (protected)
- `GET /api/v1/students/me` - Get my profile (protected)
- `GET /api/v1/students/me/dashboard` - Get my dashboard (protected)
- `GET /api/v1/students/{id}` - Get student by ID (protected)
- `GET /api/v1/students/{id}/guardians` - Get guardians (protected)
- `POST /api/v1/students/{id}/guardians` - Add guardian (protected)
- `GET /api/v1/students/{id}/grievances` - Get grievances (protected)
- `POST /api/v1/students/{id}/grievances` - File grievance (protected)

---

## API Endpoints

### Authentication Endpoints

#### Login
```
POST /api/v1/auth/login
Request Body:
{
  "username": "string",
  "password": "string"
}
Response:
{
  "success": true,
  "data": {
    "token": "jwt_token",
    "user_id": 1,
    "username": "username",
    "roles": ["student"]
  }
}
```

#### Register
```
POST /api/v1/auth/register
Request Body:
{
  "username": "string",
  "email": "string",
  "password": "string",
  "role_name": "student"
}
Response:
{
  "success": true,
  "data": {
    "user_id": 1,
    "username": "username",
    "email": "email"
  }
}
```

#### Get Profile
```
GET /api/v1/auth/profile
Headers: Authorization: Bearer <token>
Response:
{
  "success": true,
  "data": {
    "user_id": 1,
    "username": "username",
    "email": "email",
    "roles": ["student"],
    "is_active": true
  }
}
```

### Student Endpoints

#### Enroll Student
```
POST /api/v1/students/enroll
Headers: Authorization: Bearer <token>
Request Body:
{
  "user_id": 1,
  "program_id": 1,
  "first_name": "John",
  "last_name": "Doe",
  "date_of_birth": "2005-01-15",
  "email": "john@example.com",
  "phone": "1234567890",
  "gender_id": 1,
  "category_id": 1,
  "admission_year": 2024,
  "admission_quota": "General"
}
Response:
{
  "success": true,
  "data": {
    "id": 1,
    "enrollment_number": "NTU20242024P1S001",
    "roll_number": "2024P1S001",
    ...
  }
}
```

#### List Students
```
GET /api/v1/students?page=1&page_size=20
Headers: Authorization: Bearer <token>
Response:
{
  "success": true,
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "page_size": 20
  }
}
```

#### Get My Profile
```
GET /api/v1/students/me
Headers: Authorization: Bearer <token>
Response:
{
  "success": true,
  "data": {
    "id": 1,
    "enrollment_number": "NTU20242024P1S001",
    ...
  }
}
```

#### Get My Dashboard
```
GET /api/v1/students/me/dashboard
Headers: Authorization: Bearer <token>
Response:
{
  "success": true,
  "data": {
    "student": {...},
    "program": {...},
    "guardians": [...],
    "enrollment_count": 5,
    "pending_invoices": 2
  }
}
```

---

## Authentication & Authorization

### Authentication Flow

1. **Login Request**
   - Client sends POST /api/v1/auth/login with username/password
   - Service validates credentials
   - Service generates JWT token (24h expiry)
   - Service records login attempt
   - Service creates user session
   - Service returns token and user info

2. **Token Usage**
   - Client includes token in Authorization header: `Bearer <token>`
   - Middleware validates token on each protected request
   - Middleware extracts user ID, username, roles
   - Middleware sets context values
   - Handlers use context values for authorization

### Authorization Flow

1. **Role-Based Access Control (RBAC)**
   - Each user has one or more roles
   - Each endpoint requires specific roles
   - Middleware checks user roles before allowing access
   - Returns 403 Forbidden if unauthorized

2. **Available Roles**
   - `university_admin` - Full system access
   - `finance_controller` - Finance module access
   - `registrar` - Exam and results access
   - `college_admin` - College-specific access
   - `student` - Student-specific access
   - `faculty` - Faculty-specific access
   - `staff` - Staff-specific access

### Security Features

1. **Password Hashing**
   - Uses bcrypt with cost factor 12
   - Never stores plain-text passwords

2. **JWT Security**
   - HS256 signing algorithm
   - 24-hour token expiry
   - Secret key from environment variable

3. **Session Management**
   - Tracks active sessions
   - Records IP address and user agent
   - Supports session invalidation

4. **Login Attempt Tracking**
   - Records all login attempts (success/failure)
   - Tracks IP address and user agent
   - Records failure reason

5. **Audit Logging**
   - Logs all write operations
   - Records user ID, action, IP, user agent
   - Stored in shared.audit_logs table

---

## Event-Driven Architecture

### Event Flow

```
┌─────────────────────────────────────────────────────────┐
│                   Service Layer                         │
│              (Business Logic)                            │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ Transaction
                     │
┌────────────────────▼────────────────────────────────────┐
│              Database Transaction                        │
│         (State Change + Outbox Write)                   │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ Commit
                     │
┌────────────────────▼────────────────────────────────────┐
│              Outbox Table                               │
│         (Unpublished Events)                             │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ Poll (every 2s)
                     │
┌────────────────────▼────────────────────────────────────┐
│              Outbox Worker                              │
│         (Background Goroutine)                           │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ Publish
                     │
┌────────────────────▼────────────────────────────────────┐
│              Event Bus                                   │
│         (In-Process Fanout)                              │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ Dispatch
                     │
┌────────────────────▼────────────────────────────────────┐
│              Event Handlers                              │
│         (Subscribed Modules)                             │
└─────────────────────────────────────────────────────────┘
```

### Key Events

1. **Student Enrollment**
   - Event: `student.enrolled`
   - Payload: StudentID, UserID, ProgramID, TermID, RollNumber
   - Subscribers: Finance (auto-generate invoice), Academic (create term registration)

2. **Payment Completion**
   - Event: `finance.payment_completed`
   - Payload: PaymentID, InvoiceID, StudentID, Amount, TransactionID
   - Subscribers: Student (update dashboard), Finance (update invoice status)

3. **Application Approval**
   - Event: `admission.application_approved`
   - Payload: ApplicantID, ProgramID, Email
   - Subscribers: Student (create student record), Notification (send email)

### Benefits

1. **Decoupling** - Modules communicate via events, not direct calls
2. **Consistency** - Transactional outbox ensures event delivery
3. **Scalability** - Easy to add new subscribers
4. **Reliability** - Retry mechanism for failed events
5. **Auditability** - All events are logged in outbox table

---

## Configuration

### Environment Variables (.env)

```bash
# Database
DB_HOST=192.168.1.201
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=root
DB_NAME=university_erp_prod

# JWT
JWT_SECRET=mySecretKeyAs123#

# Server
SERVER_PORT=8080
APP_ENV=development
APP_URL=http://192.168.1.14:3000

# SMTP (Email)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_email_password

# Razorpay (Payment Gateway)
RAZORPAY_KEY_ID=rzp_test_RvORW1HCWwBwoy
RAZORPAY_KEY_SECRET=flUuBMvaa95ciih3HyEyc4P9

# Outbox
OUTBOX_POLL_INTERVAL=2  # seconds
OUTBOX_BATCH_SIZE=50
```

### Config Structure (internal/config/config.go)

```go
type Config struct {
    // Database
    DBHost     string
    DBPort     string
    DBUser     string
    DBPassword string
    DBName     string

    // JWT
    JWTSecret string

    // Server
    ServerPort string
    AppEnv     string
    AppURL     string

    // SMTP
    SMTPHost string
    SMTPPort string
    SMTPUser string
    SMTPPass string

    // Razorpay
    RazorpayKeyID     string
    RazorpayKeySecret string

    // Outbox
    OutboxPollInterval int
    OutboxBatchSize    int
}
```

---

## Known Issues & Potential Bugs

### 1. **Missing Routes Registration**
**Location:** `cmd/main.go`
**Issue:** The main.go file references `routes.SetupRoutes(r)` but there's no routes package in the current structure. The modules have their own `RegisterRoutes` methods.
**Fix:** Create a routes package or wire up module routes directly in main.go.

### 2. **Incomplete Module Implementation**
**Issue:** Only Auth and Student modules are implemented. Other modules (Finance, HR, Admissions, Exam, etc.) are defined in domain but have no handlers/services/repositories.
**Impact:** Cannot perform finance operations, HR management, exam management, etc.
**Fix:** Implement remaining modules following the same pattern as Auth and Student.

### 3. **No Actual Routes File**
**Issue:** The README.md references `internal/routes/routes.go` but this file doesn't exist in the current structure.
**Impact:** Application won't start as main.go tries to import non-existent package.
**Fix:** Create routes package or refactor main.go to use module route registration.

### 4. **Database Connection in Seed Files**
**Issue:** Seed files reference `internal/db` package but the actual database code is in `internal/platform/database`.
**Impact:** Seed commands will fail to compile.
**Fix:** Update import paths in seed files to use correct package.

### 5. **Missing Error Handling in Some Places**
**Issue:** Some repository methods don't handle GORM errors properly (e.g., not checking for record not found vs other errors).
**Impact:** Generic error messages instead of specific "not found" errors.
**Fix:** Add proper error handling to distinguish between different error types.

### 6. **No Input Validation on Some Endpoints**
**Issue:** Some endpoints lack comprehensive input validation (e.g., email format, phone number format).
**Impact:** Invalid data may be stored in database.
**Fix:** Add validation middleware or validate in service layer.

### 7. **SQL Injection Risk**
**Issue:** While GORM generally prevents SQL injection, there are some raw SQL queries in seed files and trigger installation.
**Impact:** Potential SQL injection if user input is used in raw queries.
**Fix:** Use parameterized queries for all raw SQL.

### 8. **Missing Transaction Rollback Handling**
**Issue:** Some transactions may not properly rollback on error.
**Impact:** Partial data updates if transaction fails midway.
**Fix:** Ensure all transaction callbacks return errors properly.

### 9. **No Rate Limiting**
**Issue:** No rate limiting on authentication endpoints.
**Impact:** Vulnerable to brute force attacks.
**Fix:** Implement rate limiting middleware.

### 10. **JWT Secret in .env**
**Issue:** JWT secret is stored in .env file which may be committed to version control.
**Impact:** Security risk if .env is exposed.
**Fix:** Use environment variables or secret management in production.

### 11. **Hardcoded Password in Seed**
**Issue:** Seed files use hardcoded password "Admin@123" for all admin accounts.
**Impact:** Security risk if not changed in production.
**Fix:** Generate random passwords or require password change on first login.

### 12. **Missing CORS Configuration**
**Issue:** CORS middleware is defined but not configured with specific origins.
**Impact:** May allow requests from any origin if not properly configured.
**Fix:** Configure allowed origins in main.go.

### 13. **No Request Size Limit**
**Issue:** No limit on request body size.
**Impact:** Potential denial of service via large requests.
**Fix:** Add request size limiting middleware.

### 14. **Missing Health Check Endpoint**
**Issue:** No health check endpoint for monitoring.
**Impact:** Cannot monitor service health easily.
**Fix:** Add /health endpoint.

### 15. **Outbox Worker Not Started**
**Issue:** Outbox worker is defined but not started in main.go.
**Impact:** Events won't be published from outbox table.
**Fix:** Start outbox worker in main.go with context cancellation.

### 16. **No Graceful Shutdown**
**Issue:** No graceful shutdown handling.
**Impact:** In-flight requests may be terminated abruptly.
**Fix:** Implement graceful shutdown with signal handling.

### 17. **Missing Database Indexes**
**Issue:** Some frequently queried fields may lack indexes.
**Impact:** Slow query performance.
**Fix:** Add appropriate indexes based on query patterns.

### 18. **No Connection Pooling Configuration**
**Issue:** Connection pool settings are hardcoded.
**Impact:** May not be optimal for all environments.
**Fix:** Make connection pool settings configurable.

### 19. **Missing API Versioning Strategy**
**Issue:** API uses /api/v1 prefix but no versioning strategy for breaking changes.
**Impact:** Difficult to introduce breaking changes.
**Fix:** Define API versioning strategy and deprecation policy.

### 20. **No Request ID Generation**
**Issue:** No request ID for tracing requests across logs.
**Impact:** Difficult to debug distributed issues.
**Fix:** Add request ID middleware.

---

## Deployment

### Prerequisites

1. Go 1.21 or higher
2. PostgreSQL 12 or higher
3. Environment variables configured

### Building

```bash
cd backend
go mod download
go build -o university-erp-backend cmd/main.go
```

### Running

```bash
# Set environment variables
export DB_HOST=localhost
export DB_PORT=5432
export DB_USER=postgres
export DB_PASSWORD=your_password
export DB_NAME=university_erp_prod
export JWT_SECRET=your_secret_key

# Run the application
./university-erp-backend
```

### Database Seeding

```bash
# Run basic seeder
go run cmd/seed/main.go

# Run with force (drops all data first)
go run cmd/seed/main.go --force

# Run additional data seeder
go run cmd/seed/seed.go

# Run production-ready seeder
go run cmd/seed/productionReady.go
```

### Docker Deployment

```bash
# Build Docker image
docker build -t university-erp-backend .

# Run container
docker run -p 8080:8080 \
  -e DB_HOST=host.docker.internal \
  -e DB_PORT=5432 \
  -e DB_USER=postgres \
  -e DB_PASSWORD=your_password \
  -e DB_NAME=university_erp_prod \
  -e JWT_SECRET=your_secret_key \
  university-erp-backend
```

### Docker Compose

```bash
# Start with docker-compose
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop
docker-compose down
```

---

## Testing

### Running Tests

```bash
# Run all tests
go test ./...

# Run tests with coverage
go test -cover ./...

# Run tests for specific package
go test ./internal/modules/auth

# Run tests with verbose output
go test -v ./...
```

### Test Structure

Tests should be organized as:
```
internal/
├── modules/
│   ├── auth/
│   │   ├── handler_test.go
│   │   ├── service_test.go
│   │   └── repository_test.go
│   └── student/
│       ├── handler_test.go
│       ├── service_test.go
│       └── repository_test.go
```

---

## Monitoring & Logging

### Logging

- Request logging via RequestLogger middleware
- Audit logging via AuditLog middleware
- Error logging in services
- Event bus logging

### Metrics

Consider adding:
- Request count by endpoint
- Request duration by endpoint
- Error rate by endpoint
- Database connection pool metrics
- Outbox queue depth

### Health Checks

Add `/health` endpoint that checks:
- Database connectivity
- Outbox worker status
- Memory usage
- Goroutine count

---

## Security Best Practices

1. **Never commit .env files** - Use environment variables in production
2. **Use strong JWT secrets** - Generate cryptographically secure secrets
3. **Enable HTTPS** - Always use TLS in production
4. **Implement rate limiting** - Protect against brute force attacks
5. **Validate all inputs** - Never trust user input
6. **Use parameterized queries** - Prevent SQL injection
7. **Implement proper error handling** - Don't expose sensitive information
8. **Regular security audits** - Review dependencies and code regularly
9. **Use prepared statements** - Even with ORM, be careful with raw SQL
10. **Implement proper CORS** - Only allow trusted origins

---

## Performance Optimization

1. **Database Indexing** - Add indexes on frequently queried fields
2. **Connection Pooling** - Tune connection pool settings
3. **Caching** - Implement caching for frequently accessed data
4. **Pagination** - Always paginate list endpoints
5. **Query Optimization** - Use GORM's Preload for eager loading
6. **Batch Operations** - Use batch inserts/updates for bulk operations
7. **Compression** - Enable gzip compression for API responses
8. **CDN** - Serve static assets via CDN
9. **Load Balancing** - Use load balancer for horizontal scaling
10. **Database Read Replicas** - Offload read queries to replicas

---

## Future Enhancements

1. **Complete Module Implementation** - Implement all remaining modules
2. **API Documentation** - Add Swagger/OpenAPI documentation
3. **WebSocket Support** - Add real-time notifications
4. **File Upload** - Add file upload handling for documents
5. **Email Service** - Implement email sending service
6. **SMS Service** - Add SMS notifications
7. **Background Jobs** - Add scheduled job processing
8. **Caching Layer** - Implement Redis caching
9. **Message Queue** - Replace in-process event bus with message queue (RabbitMQ/Kafka)
10. **GraphQL** - Add GraphQL API alongside REST
11. **GraphQL Subscriptions** - Real-time data updates
12. **Multi-tenancy** - Support multiple universities
13. **Internationalization** - Add i18n support
14. **Mobile API** - Optimize for mobile clients
15. **Admin Panel** - Build admin management interface

---

## Support & Maintenance

### Troubleshooting

**Database Connection Issues:**
- Check PostgreSQL is running
- Verify connection parameters in .env
- Check network connectivity
- Review PostgreSQL logs

**Authentication Issues:**
- Verify JWT secret is correct
- Check token hasn't expired
- Verify user is active
- Review login attempt logs

**Performance Issues:**
- Check database query performance
- Review slow query logs
- Check connection pool usage
- Monitor memory usage

### Backup Strategy

1. **Database Backups**
   - Daily full backups
   - Point-in-time recovery
   - Backup retention policy

2. **Application Backups**
   - Version control for code
   - Configuration backups
   - Environment variable backups

### Disaster Recovery

1. **Database Recovery**
   - Restore from backup
   - Replay WAL logs
   - Verify data integrity

2. **Application Recovery**
   - Deploy from version control
   - Restore configuration
   - Verify all services

---

## Conclusion

This University ERP Backend provides a comprehensive foundation for managing university operations. The architecture follows best practices with clear separation of concerns, event-driven communication, and transactional consistency. However, several modules remain to be implemented, and there are known issues that need to be addressed before production deployment.

**Key Strengths:**
- Clean architecture with layered design
- Event-driven architecture with transactional outbox
- Comprehensive domain model
- Role-based access control
- Audit logging
- Database schema organization

**Areas for Improvement:**
- Complete module implementations
- Add comprehensive error handling
- Implement rate limiting
- Add health checks
- Implement graceful shutdown
- Add API documentation
- Improve security measures
- Add monitoring and metrics
- Implement caching strategy
- Add comprehensive testing

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-15  
**Maintained By:** Development Team
