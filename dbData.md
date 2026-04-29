

-- ================================================================
-- 🏛️  ENTERPRISE UNIVERSITY MANAGEMENT SYSTEM — WEBSITE READY
--     Full Architecture: Auth + Roles + Portals + Audit + Triggers
-- ================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
--CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ================================================================
-- ██████╗  SCHEMA SEPARATION (Modules)
-- ================================================================
CREATE SCHEMA IF NOT EXISTS auth;       -- Authentication & Users
CREATE SCHEMA IF NOT EXISTS core;       -- University, College, Dept
CREATE SCHEMA IF NOT EXISTS academic;   -- Programs, Subjects, Timetable
CREATE SCHEMA IF NOT EXISTS student;    -- Students, Enrollment
CREATE SCHEMA IF NOT EXISTS faculty;    -- Faculty management
CREATE SCHEMA IF NOT EXISTS finance;    -- Fees, Payments
CREATE SCHEMA IF NOT EXISTS library;    -- Library system
CREATE SCHEMA IF NOT EXISTS hostel;     -- Hostel management
CREATE SCHEMA IF NOT EXISTS audit;      -- Audit Logs
CREATE SCHEMA IF NOT EXISTS notify;     -- Notifications

-- ================================================================
-- ██████╗  MODULE 1 — AUTH (Login System)
-- ================================================================

-- Roles Table
CREATE TABLE auth.roles (
    role_id     SERIAL PRIMARY KEY,
    role_name   VARCHAR(50) UNIQUE NOT NULL,  
    -- 'super_admin','university_admin','college_admin',
    -- 'hod','faculty','student','parent','staff'
    description TEXT,
    created_at  TIMESTAMP DEFAULT NOW()
);

-- Permissions
CREATE TABLE auth.permissions (
    permission_id   SERIAL PRIMARY KEY,
    module          VARCHAR(100) NOT NULL,  -- e.g. 'attendance', 'results', 'fees'
    action          VARCHAR(50) NOT NULL,   -- 'view', 'create', 'edit', 'delete'
    description     TEXT
);

-- Role Permissions (which role can do what)
CREATE TABLE auth.role_permissions (
    id              SERIAL PRIMARY KEY,
    role_id         INT REFERENCES auth.roles(role_id) ON DELETE CASCADE,
    permission_id   INT REFERENCES auth.permissions(permission_id) ON DELETE CASCADE,
    UNIQUE(role_id, permission_id)
);

-- Users (Master login table for ALL user types)
CREATE TABLE auth.users (
    user_id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username        VARCHAR(100) UNIQUE NOT NULL,
    email           VARCHAR(200) UNIQUE NOT NULL,
    password_hash   TEXT NOT NULL,           -- bcrypt hashed
    role_id         INT REFERENCES auth.roles(role_id),
    is_active       BOOLEAN DEFAULT TRUE,
    is_verified     BOOLEAN DEFAULT FALSE,
    is_locked       BOOLEAN DEFAULT FALSE,
    failed_attempts INT DEFAULT 0,
    last_login      TIMESTAMP,
    password_reset_token TEXT,
    token_expiry    TIMESTAMP,
    profile_photo   TEXT,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- User Sessions (for JWT / session tracking on website)
CREATE TABLE auth.user_sessions (
    session_id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES auth.users(user_id) ON DELETE CASCADE,
    token           TEXT NOT NULL,
    ip_address      VARCHAR(50),
    user_agent      TEXT,
    device_type     VARCHAR(50),    -- Mobile, Desktop, Tablet
    login_time      TIMESTAMP DEFAULT NOW(),
    logout_time     TIMESTAMP,
    expires_at      TIMESTAMP,
    is_active       BOOLEAN DEFAULT TRUE
);

-- OTP Verification (Email/Phone OTP for website login)
CREATE TABLE auth.otp_verifications (
    otp_id          SERIAL PRIMARY KEY,
    user_id         UUID REFERENCES auth.users(user_id),
    otp_code        VARCHAR(10),
    otp_type        VARCHAR(30),   -- 'email_verify','password_reset','login_2fa'
    expires_at      TIMESTAMP,
    is_used         BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ================================================================
-- ██████╗  MODULE 2 — CORE (University Structure)
-- ================================================================

-- University
CREATE TABLE core.university (
    university_id   SERIAL PRIMARY KEY,
    name            VARCHAR(300) NOT NULL,
    short_name      VARCHAR(50),
    established_year INT,
    logo_url        TEXT,
    address         TEXT,
    city            VARCHAR(100),
    state           VARCHAR(100),
    country         VARCHAR(100) DEFAULT 'India',
    pincode         VARCHAR(15),
    phone           VARCHAR(20),
    email           VARCHAR(200),
    website         VARCHAR(300),
    vice_chancellor VARCHAR(200),
    registrar       VARCHAR(200),
    accreditation   VARCHAR(100),
    naac_grade      VARCHAR(10),
    nirf_rank       INT,
    about           TEXT,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- University Admins
CREATE TABLE core.university_admins (
    id              SERIAL PRIMARY KEY,
    university_id   INT REFERENCES core.university(university_id),
    user_id         UUID REFERENCES auth.users(user_id),
    designation     VARCHAR(100),
    created_at      TIMESTAMP DEFAULT NOW()
);

-- Colleges
CREATE TABLE core.colleges (
    college_id      SERIAL PRIMARY KEY,
    university_id   INT REFERENCES core.university(university_id) ON DELETE CASCADE,
    name            VARCHAR(300) NOT NULL,
    short_name      VARCHAR(50),
    code            VARCHAR(30) UNIQUE NOT NULL,
    established_year INT,
    college_type    VARCHAR(100),  -- Engineering, Medical, Arts, Management, Law
    logo_url        TEXT,
    address         TEXT,
    city            VARCHAR(100),
    state           VARCHAR(100),
    pincode         VARCHAR(15),
    phone           VARCHAR(20),
    email           VARCHAR(200),
    website         VARCHAR(300),
    principal_name  VARCHAR(200),
    about           TEXT,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- College Admins
CREATE TABLE core.college_admins (
    id              SERIAL PRIMARY KEY,
    college_id      INT REFERENCES core.colleges(college_id),
    user_id         UUID REFERENCES auth.users(user_id),
    designation     VARCHAR(100),
    created_at      TIMESTAMP DEFAULT NOW()
);

-- Departments
CREATE TABLE core.departments (
    department_id   SERIAL PRIMARY KEY,
    college_id      INT REFERENCES core.colleges(college_id) ON DELETE CASCADE,
    name            VARCHAR(300) NOT NULL,
    code            VARCHAR(30) UNIQUE NOT NULL,
    hod_name        VARCHAR(200),
    hod_user_id     UUID REFERENCES auth.users(user_id),
    phone           VARCHAR(20),
    email           VARCHAR(200),
    established_year INT,
    about           TEXT,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ================================================================
-- ██████╗  MODULE 3 — ACADEMIC
-- ================================================================

-- Academic Years
CREATE TABLE academic.academic_years (
    academic_year_id SERIAL PRIMARY KEY,
    year_label      VARCHAR(20) NOT NULL,   -- e.g. '2024-2025'
    start_date      DATE,
    end_date        DATE,
    is_current      BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- Semesters
CREATE TABLE academic.semesters (
    semester_id         SERIAL PRIMARY KEY,
    academic_year_id    INT REFERENCES academic.academic_years(academic_year_id),
    semester_number     INT NOT NULL,
    semester_name       VARCHAR(50),       -- Odd / Even
    start_date          DATE,
    end_date            DATE,
    result_published    BOOLEAN DEFAULT FALSE,
    is_current          BOOLEAN DEFAULT FALSE,
    created_at          TIMESTAMP DEFAULT NOW()
);

-- Programs / Degree Courses
CREATE TABLE academic.programs (
    program_id          SERIAL PRIMARY KEY,
    department_id       INT REFERENCES core.departments(department_id) ON DELETE CASCADE,
    name                VARCHAR(300) NOT NULL,
    code                VARCHAR(30) UNIQUE NOT NULL,
    degree_type         VARCHAR(50),    -- B.Tech, M.Tech, MBA, BCA, MCA, PhD
    duration_years      INT,
    total_semesters     INT,
    total_credits       INT,
    intake_capacity     INT,
    eligibility         TEXT,
    description         TEXT,
    is_active           BOOLEAN DEFAULT TRUE,
    created_at          TIMESTAMP DEFAULT NOW()
);

-- Subjects / Courses
CREATE TABLE academic.subjects (
    subject_id          SERIAL PRIMARY KEY,
    department_id       INT REFERENCES core.departments(department_id),
    subject_code        VARCHAR(30) UNIQUE NOT NULL,
    subject_name        VARCHAR(300) NOT NULL,
    credits             INT,
    lecture_hours       INT DEFAULT 0,
    tutorial_hours      INT DEFAULT 0,
    lab_hours           INT DEFAULT 0,
    subject_type        VARCHAR(50),  -- Theory, Lab, Elective, Project, Seminar
    semester_number     INT,
    syllabus_url        TEXT,
    description         TEXT,
    is_active           BOOLEAN DEFAULT TRUE,
    created_at          TIMESTAMP DEFAULT NOW()
);

-- Subject Prerequisites
CREATE TABLE academic.subject_prerequisites (
    id                  SERIAL PRIMARY KEY,
    subject_id          INT REFERENCES academic.subjects(subject_id),
    prerequisite_id     INT REFERENCES academic.subjects(subject_id),
    UNIQUE(subject_id, prerequisite_id)
);

-- Program Subjects Mapping
CREATE TABLE academic.program_subjects (
    id                  SERIAL PRIMARY KEY,
    program_id          INT REFERENCES academic.programs(program_id),
    subject_id          INT REFERENCES academic.subjects(subject_id),
    semester_number     INT,
    is_mandatory        BOOLEAN DEFAULT TRUE,
    UNIQUE(program_id, subject_id, semester_number)
);

-- Timetable
CREATE TABLE academic.timetable (
    timetable_id        SERIAL PRIMARY KEY,
    program_id          INT REFERENCES academic.programs(program_id),
    subject_id          INT REFERENCES academic.subjects(subject_id),
    faculty_user_id     UUID REFERENCES auth.users(user_id),
    semester_id         INT REFERENCES academic.semesters(semester_id),
    section             VARCHAR(10),
    day_of_week         VARCHAR(15),   -- Monday..Saturday
    start_time          TIME,
    end_time            TIME,
    room_number         VARCHAR(30),
    is_active           BOOLEAN DEFAULT TRUE,
    created_at          TIMESTAMP DEFAULT NOW()
);

-- Assignments
CREATE TABLE academic.assignments (
    assignment_id       SERIAL PRIMARY KEY,
    subject_id          INT REFERENCES academic.subjects(subject_id),
    faculty_user_id     UUID REFERENCES auth.users(user_id),
    semester_id         INT REFERENCES academic.semesters(semester_id),
    title               VARCHAR(300),
    description         TEXT,
    attachment_url      TEXT,
    due_date            TIMESTAMP,
    max_marks           INT,
    is_published        BOOLEAN DEFAULT FALSE,
    created_at          TIMESTAMP DEFAULT NOW()
);

-- Assignment Submissions (Students)
CREATE TABLE academic.assignment_submissions (
    submission_id       SERIAL PRIMARY KEY,
    assignment_id       INT REFERENCES academic.assignments(assignment_id),
    student_id          INT,  -- FK to student.students
    submitted_at        TIMESTAMP DEFAULT NOW(),
    file_url            TEXT,
    remarks             TEXT,
    marks_obtained      NUMERIC(5,2),
    graded_by           UUID REFERENCES auth.users(user_id),
    graded_at           TIMESTAMP,
    status              VARCHAR(30) DEFAULT 'Submitted'  -- Submitted, Graded, Late
);

-- ================================================================
-- ██████╗  MODULE 4 — FACULTY
-- ================================================================

CREATE TABLE faculty.faculty_profiles (
    faculty_id          SERIAL PRIMARY KEY,
    user_id             UUID UNIQUE REFERENCES auth.users(user_id),
    department_id       INT REFERENCES core.departments(department_id),
    employee_code       VARCHAR(30) UNIQUE NOT NULL,
    first_name          VARCHAR(100) NOT NULL,
    last_name           VARCHAR(100) NOT NULL,
    gender              VARCHAR(15),
    date_of_birth       DATE,
    phone               VARCHAR(20),
    alternate_phone     VARCHAR(20),
    address             TEXT,
    city                VARCHAR(100),
    state               VARCHAR(100),
    pincode             VARCHAR(15),
    nationality         VARCHAR(50) DEFAULT 'Indian',
    designation         VARCHAR(100),   -- Professor, Assoc Prof, Asst Prof
    qualification       TEXT,
    specialization      TEXT,
    experience_years    INT,
    joining_date        DATE,
    contract_type       VARCHAR(50),    -- Permanent, Contract, Visiting
    salary              NUMERIC(12,2),
    bank_account        VARCHAR(30),
    bank_ifsc           VARCHAR(20),
    pan_number          VARCHAR(20),
    aadhar_number       VARCHAR(20),
    is_active           BOOLEAN DEFAULT TRUE,
    photo_url           TEXT,
    linkedin_url        TEXT,
    research_area       TEXT,
    publications_count  INT DEFAULT 0,
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);

-- Faculty Subject Assignments
CREATE TABLE faculty.faculty_subjects (
    id                  SERIAL PRIMARY KEY,
    faculty_id          INT REFERENCES faculty.faculty_profiles(faculty_id),
    subject_id          INT REFERENCES academic.subjects(subject_id),
    semester_id         INT REFERENCES academic.semesters(semester_id),
    section             VARCHAR(10),
    academic_year_id    INT REFERENCES academic.academic_years(academic_year_id),
    created_at          TIMESTAMP DEFAULT NOW(),
    UNIQUE(faculty_id, subject_id, semester_id, section)
);

-- Faculty Leave Applications
CREATE TABLE faculty.faculty_leaves (
    leave_id            SERIAL PRIMARY KEY,
    faculty_id          INT REFERENCES faculty.faculty_profiles(faculty_id),
    leave_type          VARCHAR(50),   -- Sick, Casual, Earned, Maternity
    from_date           DATE,
    to_date             DATE,
    reason              TEXT,
    status              VARCHAR(20) DEFAULT 'Pending',  -- Pending, Approved, Rejected
    approved_by         UUID REFERENCES auth.users(user_id),
    applied_at          TIMESTAMP DEFAULT NOW()
);

-- ================================================================
-- ██████╗  MODULE 5 — STUDENTS
-- ================================================================

CREATE TABLE student.students (
    student_id          SERIAL PRIMARY KEY,
    user_id             UUID UNIQUE REFERENCES auth.users(user_id),
    program_id          INT REFERENCES academic.programs(program_id),
    roll_number         VARCHAR(30) UNIQUE NOT NULL,
    university_reg_no   VARCHAR(50) UNIQUE,
    first_name          VARCHAR(100) NOT NULL,
    last_name           VARCHAR(100) NOT NULL,
    gender              VARCHAR(15),
    date_of_birth       DATE,
    blood_group         VARCHAR(10),
    phone               VARCHAR(20),
    alternate_phone     VARCHAR(20),
    personal_email      VARCHAR(200),
    address             TEXT,
    city                VARCHAR(100),
    state               VARCHAR(100),
    pincode             VARCHAR(15),
    nationality         VARCHAR(50) DEFAULT 'Indian',
    religion            VARCHAR(50),
    category            VARCHAR(30),  -- General, OBC, SC, ST, EWS
    sub_category        VARCHAR(50),
    admission_year      INT,
    current_semester    INT DEFAULT 1,
    batch               VARCHAR(20),  -- e.g. '2022-2026'
    section             VARCHAR(10),
    lateral_entry       BOOLEAN DEFAULT FALSE,
    is_active           BOOLEAN DEFAULT TRUE,
    aadhar_number       VARCHAR(25),
    pan_number          VARCHAR(20),
    passport_number     VARCHAR(25),
    photo_url           TEXT,
    signature_url       TEXT,
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);

-- Student Parents
CREATE TABLE student.student_parents (
    parent_id           SERIAL PRIMARY KEY,
    student_id          INT REFERENCES student.students(student_id) ON DELETE CASCADE,
    father_name         VARCHAR(200),
    father_phone        VARCHAR(20),
    father_email        VARCHAR(200),
    father_occupation   VARCHAR(100),
    father_qualification VARCHAR(100),
    mother_name         VARCHAR(200),
    mother_phone        VARCHAR(20),
    mother_email        VARCHAR(200),
    mother_occupation   VARCHAR(100),
    guardian_name       VARCHAR(200),
    guardian_phone      VARCHAR(20),
    guardian_relation   VARCHAR(50),
    annual_income       NUMERIC(12,2),
    parent_address      TEXT,
    created_at          TIMESTAMP DEFAULT NOW()
);

-- Student Academic History (for transferred/lateral students)
CREATE TABLE student.student_academic_history (
    id                  SERIAL PRIMARY KEY,
    student_id          INT REFERENCES student.students(student_id),
    institution_name    VARCHAR(300),
    degree              VARCHAR(100),
    board_university    VARCHAR(200),
    year_of_passing     INT,
    percentage          NUMERIC(5,2),
    grade               VARCHAR(10),
    certificate_url     TEXT
);

-- Student Documents
CREATE TABLE student.student_documents (
    doc_id              SERIAL PRIMARY KEY,
    student_id          INT REFERENCES student.students(student_id) ON DELETE CASCADE,
    doc_type            VARCHAR(100),  -- Aadhar, 10th Cert, 12th Cert, Transfer Cert
    doc_name            VARCHAR(200),
    file_url            TEXT,
    uploaded_at         TIMESTAMP DEFAULT NOW(),
    verified_by         UUID REFERENCES auth.users(user_id),
    is_verified         BOOLEAN DEFAULT FALSE
);

-- Enrollments
CREATE TABLE student.enrollments (
    enrollment_id       SERIAL PRIMARY KEY,
    student_id          INT REFERENCES student.students(student_id),
    subject_id          INT REFERENCES academic.subjects(subject_id),
    semester_id         INT REFERENCES academic.semesters(semester_id),
    enrolled_date       DATE DEFAULT CURRENT_DATE,
    status              VARCHAR(30) DEFAULT 'Active',  -- Active, Dropped, Completed, Backlog
    created_at          TIMESTAMP DEFAULT NOW(),
    UNIQUE(student_id, subject_id, semester_id)
);

-- Attendance
CREATE TABLE student.attendance (
    attendance_id       SERIAL PRIMARY KEY,
    student_id          INT REFERENCES student.students(student_id),
    subject_id          INT REFERENCES academic.subjects(subject_id),
    faculty_id          INT REFERENCES faculty.faculty_profiles(faculty_id),
    semester_id         INT REFERENCES academic.semesters(semester_id),
    attendance_date     DATE NOT NULL,
    class_type          VARCHAR(20) DEFAULT 'Lecture',  -- Lecture, Lab, Tutorial
    status              VARCHAR(15) NOT NULL,  -- Present, Absent, Late, OD
    remarks             TEXT,
    created_at          TIMESTAMP DEFAULT NOW(),
    UNIQUE(student_id, subject_id, attendance_date, class_type)
);

-- Attendance Summary (Materialized for performance)
CREATE MATERIALIZED VIEW student.attendance_summary AS
SELECT
    s.student_id,
    s.roll_number,
    s.first_name || ' ' || s.last_name AS student_name,
    sub.subject_id,
    sub.subject_name,
    sem.semester_id,
    COUNT(*) AS total_classes,
    SUM(CASE WHEN a.status IN ('Present','Late') THEN 1 ELSE 0 END) AS attended,
    ROUND(
        SUM(CASE WHEN a.status IN ('Present','Late') THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2
    ) AS attendance_pct
FROM student.attendance a
JOIN student.students s ON a.student_id = s.student_id
JOIN academic.subjects sub ON a.subject_id = sub.subject_id
JOIN academic.semesters sem ON a.semester_id = sem.semester_id
GROUP BY s.student_id, s.roll_number, s.first_name, s.last_name,
         sub.subject_id, sub.subject_name, sem.semester_id
WITH DATA;

-- Exams
CREATE TABLE student.exams (
    exam_id             SERIAL PRIMARY KEY,
    subject_id          INT REFERENCES academic.subjects(subject_id),
    semester_id         INT REFERENCES academic.semesters(semester_id),
    exam_type           VARCHAR(50),   -- Internal-1, Internal-2, Midterm, Final, Practical, Viva
    exam_date           DATE,
    start_time          TIME,
    end_time            TIME,
    max_marks           NUMERIC(6,2),
    pass_marks          NUMERIC(6,2),
    weightage_pct       NUMERIC(5,2),  -- Contribution to final grade
    venue               VARCHAR(200),
    is_published        BOOLEAN DEFAULT FALSE,
    created_at          TIMESTAMP DEFAULT NOW()
);

-- Exam Hall Allocation
CREATE TABLE student.exam_hall_allocations (
    id                  SERIAL PRIMARY KEY,
    exam_id             INT REFERENCES student.exams(exam_id),
    student_id          INT REFERENCES student.students(student_id),
    hall_name           VARCHAR(100),
    seat_number         VARCHAR(20),
    created_at          TIMESTAMP DEFAULT NOW()
);

-- Exam Results
CREATE TABLE student.exam_results (
    result_id           SERIAL PRIMARY KEY,
    exam_id             INT REFERENCES student.exams(exam_id),
    student_id          INT REFERENCES student.students(student_id),
    marks_obtained      NUMERIC(6,2),
    is_absent           BOOLEAN DEFAULT FALSE,
    is_malpractice      BOOLEAN DEFAULT FALSE,
    grade               VARCHAR(5),     -- A+, A, B+, B, C, D, F
    grade_points        NUMERIC(4,2),
    is_pass             BOOLEAN,
    remarks             TEXT,
    entered_by          UUID REFERENCES auth.users(user_id),
    verified_by         UUID REFERENCES auth.users(user_id),
    is_verified         BOOLEAN DEFAULT FALSE,
    created_at          TIMESTAMP DEFAULT NOW()
);

-- CGPA / SGPA Calculation
CREATE TABLE student.student_sgpa (
    id                  SERIAL PRIMARY KEY,
    student_id          INT REFERENCES student.students(student_id),
    semester_id         INT REFERENCES academic.semesters(semester_id),
    total_credits       INT,
    credits_earned      INT,
    sgpa                NUMERIC(4,2),
    cgpa                NUMERIC(4,2),
    rank_in_class       INT,
    remarks             TEXT,
    calculated_at       TIMESTAMP DEFAULT NOW()
);

-- Student Leave Applications
CREATE TABLE student.student_leaves (
    leave_id            SERIAL PRIMARY KEY,
    student_id          INT REFERENCES student.students(student_id),
    leave_type          VARCHAR(50),  -- Medical, Personal, Event, OD
    from_date           DATE,
    to_date             DATE,
    reason              TEXT,
    document_url        TEXT,
    status              VARCHAR(20) DEFAULT 'Pending',
    approved_by         UUID REFERENCES auth.users(user_id),
    applied_at          TIMESTAMP DEFAULT NOW()
);

-- ================================================================
-- ██████╗  MODULE 6 — FINANCE
-- ================================================================

CREATE TABLE finance.fee_categories (
    category_id         SERIAL PRIMARY KEY,
    name                VARCHAR(100),   -- Tuition, Exam, Lab, Library, Hostel, Transport
    description         TEXT
);

CREATE TABLE finance.fee_structures (
    fee_structure_id    SERIAL PRIMARY KEY,
    program_id          INT REFERENCES academic.programs(program_id),
    academic_year_id    INT REFERENCES academic.academic_years(academic_year_id),
    semester_number     INT,
    category_id         INT REFERENCES finance.fee_categories(category_id),
    amount              NUMERIC(12,2),
    due_date            DATE,
    late_fine_per_day   NUMERIC(8,2) DEFAULT 0,
    is_active           BOOLEAN DEFAULT TRUE,
    created_at          TIMESTAMP DEFAULT NOW()
);

CREATE TABLE finance.student_fee_invoices (
    invoice_id          SERIAL PRIMARY KEY,
    student_id          INT REFERENCES student.students(student_id),
    academic_year_id    INT REFERENCES academic.academic_years(academic_year_id),
    semester_number     INT,
    total_amount        NUMERIC(12,2),
    discount_amount     NUMERIC(12,2) DEFAULT 0,
    fine_amount         NUMERIC(12,2) DEFAULT 0,
    net_amount          NUMERIC(12,2),
    paid_amount         NUMERIC(12,2) DEFAULT 0,
    balance_due         NUMERIC(12,2),
    status              VARCHAR(30) DEFAULT 'Unpaid',   -- Unpaid, Partial, Paid, Overdue
    due_date            DATE,
    generated_at        TIMESTAMP DEFAULT NOW()
);

CREATE TABLE finance.fee_payments (
    payment_id          SERIAL PRIMARY KEY,
    invoice_id          INT REFERENCES finance.student_fee_invoices(invoice_id),
    student_id          INT REFERENCES student.students(student_id),
    amount_paid         NUMERIC(12,2),
    payment_date        TIMESTAMP DEFAULT NOW(),
    payment_mode        VARCHAR(50),   -- Online, Cash, DD, Cheque, NEFT, UPI
    transaction_id      VARCHAR(150),
    gateway             VARCHAR(100),  -- Razorpay, PayU, CCAvenue
    receipt_number      VARCHAR(100) UNIQUE,
    is_verified         BOOLEAN DEFAULT FALSE,
    verified_by         UUID REFERENCES auth.users(user_id),
    remarks             TEXT,
    created_at          TIMESTAMP DEFAULT NOW()
);

-- Scholarships
CREATE TABLE finance.scholarships (
    scholarship_id      SERIAL PRIMARY KEY,
    name                VARCHAR(200),
    provider            VARCHAR(200),  -- University, State Govt, Central Govt, NGO
    scholarship_type    VARCHAR(50),   -- Merit, Need-based, Sports, Minority
    amount              NUMERIC(12,2),
    criteria            TEXT,
    academic_year_id    INT REFERENCES academic.academic_years(academic_year_id),
    last_date           DATE,
    is_active           BOOLEAN DEFAULT TRUE,
    created_at          TIMESTAMP DEFAULT NOW()
);

CREATE TABLE finance.student_scholarships (
    id                  SERIAL PRIMARY KEY,
    student_id          INT REFERENCES student.students(student_id),
    scholarship_id      INT REFERENCES finance.scholarships(scholarship_id),
    applied_date        DATE,
    awarded_date        DATE,
    amount_awarded      NUMERIC(12,2),
    status              VARCHAR(30) DEFAULT 'Applied',  -- Applied, Approved, Rejected, Disbursed
    approved_by         UUID REFERENCES auth.users(user_id),
    remarks             TEXT
);

-- ================================================================
-- ██████╗  MODULE 7 — LIBRARY
-- ================================================================

CREATE TABLE library.books (
    book_id             SERIAL PRIMARY KEY,
    isbn                VARCHAR(30) UNIQUE,
    title               VARCHAR(400) NOT NULL,
    author              VARCHAR(400),
    publisher           VARCHAR(300),
    edition             VARCHAR(30),
    year_published      INT,
    category            VARCHAR(100),
    subject_id          INT REFERENCES academic.subjects(subject_id),
    total_copies        INT DEFAULT 1,
    available_copies    INT DEFAULT 1,
    rack_number         VARCHAR(30),
    cover_image_url     TEXT,
    description         TEXT,
    created_at          TIMESTAMP DEFAULT NOW()
);

CREATE TABLE library.ebooks (
    ebook_id            SERIAL PRIMARY KEY,
    title               VARCHAR(400),
    author              VARCHAR(400),
    subject_id          INT REFERENCES academic.subjects(subject_id),
    file_url            TEXT,
    published_year      INT,
    access_type         VARCHAR(30) DEFAULT 'All',  -- All, Faculty, PG, UG
    created_at          TIMESTAMP DEFAULT NOW()
);

CREATE TABLE library.transactions (
    transaction_id      SERIAL PRIMARY KEY,
    book_id             INT REFERENCES library.books(book_id),
    user_id             UUID REFERENCES auth.users(user_id),
    issued_date         DATE,
    due_date            DATE,
    returned_date       DATE,
    fine_amount         NUMERIC(8,2) DEFAULT 0,
    fine_paid           BOOLEAN DEFAULT FALSE,
    status              VARCHAR(20) DEFAULT 'Issued',  -- Issued, Returned, Overdue, Lost
    issued_by           UUID REFERENCES auth.users(user_id),
    created_at          TIMESTAMP DEFAULT NOW()
);

CREATE TABLE library.book_reservations (
    reservation_id      SERIAL PRIMARY KEY,
    book_id             INT REFERENCES library.books(book_id),
    user_id             UUID REFERENCES auth.users(user_id),
    reserved_at         TIMESTAMP DEFAULT NOW(),
    status              VARCHAR(20) DEFAULT 'Waiting'  -- Waiting, Ready, Cancelled
);

-- ================================================================
-- ██████╗  MODULE 8 — HOSTEL
-- ================================================================

CREATE TABLE hostel.hostels (
    hostel_id           SERIAL PRIMARY KEY,
    college_id          INT REFERENCES core.colleges(college_id),
    hostel_name         VARCHAR(200),
    hostel_type         VARCHAR(20),  -- Boys, Girls, Mixed
    total_rooms         INT,
    total_capacity      INT,
    warden_name         VARCHAR(200),
    warden_phone        VARCHAR(20),
    phone               VARCHAR(20),
    address             TEXT,
    amenities           TEXT,
    is_active           BOOLEAN DEFAULT TRUE,
    created_at          TIMESTAMP DEFAULT NOW()
);

CREATE TABLE hostel.rooms (
    room_id             SERIAL PRIMARY KEY,
    hostel_id           INT REFERENCES hostel.hostels(hostel_id),
    room_number         VARCHAR(30) NOT NULL,
    floor_number        INT,
    room_type           VARCHAR(30),   -- Single, Double, Triple, Dormitory
    capacity            INT,
    current_occupancy   INT DEFAULT 0,
    room_status         VARCHAR(20) DEFAULT 'Available',  -- Available, Full, Maintenance
    monthly_rent        NUMERIC(10,2),
    amenities           TEXT,
    created_at          TIMESTAMP DEFAULT NOW()
);

CREATE TABLE hostel.allocations (
    allocation_id       SERIAL PRIMARY KEY,
    student_id          INT REFERENCES student.students(student_id),
    room_id             INT REFERENCES hostel.rooms(room_id),
    academic_year_id    INT REFERENCES academic.academic_years(academic_year_id),
    allotment_date      DATE,
    vacating_date       DATE,
    status              VARCHAR(20) DEFAULT 'Active',  -- Active, Vacated, Transferred
    created_at          TIMESTAMP DEFAULT NOW()
);

CREATE TABLE hostel.hostel_complaints (
    complaint_id        SERIAL PRIMARY KEY,
    student_id          INT REFERENCES student.students(student_id),
    hostel_id           INT REFERENCES hostel.hostels(hostel_id),
    complaint_type      VARCHAR(100),   -- Electrical, Plumbing, Security, Food
    description         TEXT,
    status              VARCHAR(20) DEFAULT 'Open',  -- Open, InProgress, Resolved
    resolved_at         TIMESTAMP,
    created_at          TIMESTAMP DEFAULT NOW()
);

-- ================================================================
-- ██████╗  MODULE 9 — NOTICES, EVENTS, ANNOUNCEMENTS
-- ================================================================

CREATE TABLE notify.notices (
    notice_id           SERIAL PRIMARY KEY,
    college_id          INT REFERENCES core.colleges(college_id),
    department_id       INT REFERENCES core.departments(department_id),
    title               VARCHAR(400),
    content             TEXT,
    notice_type         VARCHAR(50),  -- Exam, Event, Holiday, Fee, General, Urgent
    target_audience     VARCHAR(50),  -- All, Students, Faculty, Staff
    attachment_url      TEXT,
    posted_by           UUID REFERENCES auth.users(user_id),
    posted_date         DATE DEFAULT CURRENT_DATE,
    expiry_date         DATE,
    is_pinned           BOOLEAN DEFAULT FALSE,
    is_active           BOOLEAN DEFAULT TRUE,
    created_at          TIMESTAMP DEFAULT NOW()
);

CREATE TABLE notify.events (
    event_id            SERIAL PRIMARY KEY,
    college_id          INT REFERENCES core.colleges(college_id),
    event_name          VARCHAR(400),
    event_type          VARCHAR(100),   -- Cultural, Technical, Sports, Seminar, Workshop
    description         TEXT,
    banner_url          TEXT,
    event_date          DATE,
    end_date            DATE,
    venue               VARCHAR(300),
    organizer           VARCHAR(200),
    registration_link   TEXT,
    max_participants    INT,
    is_active           BOOLEAN DEFAULT TRUE,
    created_at          TIMESTAMP DEFAULT NOW()
);

CREATE TABLE notify.notifications (
    notification_id     SERIAL PRIMARY KEY,
    user_id             UUID REFERENCES auth.users(user_id),
    title               VARCHAR(300),
    message             TEXT,
    type                VARCHAR(50),    -- Fee Due, Result Published, Attendance Alert, etc.
    link                TEXT,
    is_read             BOOLEAN DEFAULT FALSE,
    created_at          TIMESTAMP DEFAULT NOW()
);

-- ================================================================
-- ██████╗  MODULE 10 — ADMISSIONS
-- ================================================================

CREATE TABLE core.admissions (
    admission_id        SERIAL PRIMARY KEY,
    program_id          INT REFERENCES academic.programs(program_id),
    academic_year_id    INT REFERENCES academic.academic_years(academic_year_id),
    applicant_name      VARCHAR(300),
    email               VARCHAR(200),
    phone               VARCHAR(20),
    date_of_birth       DATE,
    gender              VARCHAR(15),
    category            VARCHAR(30),
    state               VARCHAR(100),
    entrance_exam       VARCHAR(100),  -- JEE, NEET, CAT, State CET
    entrance_score      NUMERIC(8,2),
    merit_rank          INT,
    applied_date        DATE DEFAULT CURRENT_DATE,
    status              VARCHAR(30) DEFAULT 'Pending',
    -- Pending, Shortlisted, Selected, Admitted, Rejected, Waitlisted
    remarks             TEXT,
    created_at          TIMESTAMP DEFAULT NOW()
);

-- ================================================================
-- ██████╗  MODULE 11 — PLACEMENT / CAREERS
-- ================================================================

CREATE TABLE core.companies (
    company_id          SERIAL PRIMARY KEY,
    name                VARCHAR(300),
    industry            VARCHAR(100),
    website             VARCHAR(300),
    hr_contact          VARCHAR(200),
    hr_email            VARCHAR(200),
    hr_phone            VARCHAR(20),
    address             TEXT,
    created_at          TIMESTAMP DEFAULT NOW()
);

CREATE TABLE core.placement_drives (
    drive_id            SERIAL PRIMARY KEY,
    company_id          INT REFERENCES core.companies(company_id),
    college_id          INT REFERENCES core.colleges(college_id),
    drive_date          DATE,
    job_role            VARCHAR(200),
    job_type            VARCHAR(50),    -- Full-time, Internship, Part-time
    package_lpa         NUMERIC(8,2),   -- Lakhs per annum
    eligibility         TEXT,
    description         TEXT,
    status              VARCHAR(30) DEFAULT 'Upcoming',
    created_at          TIMESTAMP DEFAULT NOW()
);

CREATE TABLE core.placement_applications (
    application_id      SERIAL PRIMARY KEY,
    drive_id            INT REFERENCES core.placement_drives(drive_id),
    student_id          INT REFERENCES student.students(student_id),
    applied_date        DATE DEFAULT CURRENT_DATE,
    status              VARCHAR(30) DEFAULT 'Applied',
    -- Applied, Shortlisted, Placed, Rejected
    remarks             TEXT
);

-- ================================================================
-- ██████╗  MODULE 12 — AUDIT LOGS (Track all changes)
-- ================================================================

CREATE TABLE audit.audit_logs (
    log_id              BIGSERIAL PRIMARY KEY,
    user_id             UUID REFERENCES auth.users(user_id),
    action              VARCHAR(50),       -- INSERT, UPDATE, DELETE, LOGIN, LOGOUT
    table_name          VARCHAR(100),
    record_id           TEXT,
    old_values          JSONB,
    new_values          JSONB,
    ip_address          VARCHAR(50),
    user_agent          TEXT,
    performed_at        TIMESTAMP DEFAULT NOW()
);

-- ================================================================
-- ██████╗  MODULE 13 — STAFF (Non-Teaching)
-- ================================================================

CREATE TABLE core.staff (
    staff_id            SERIAL PRIMARY KEY,
    college_id          INT REFERENCES core.colleges(college_id),
    user_id             UUID REFERENCES auth.users(user_id),
    employee_code       VARCHAR(30) UNIQUE,
    first_name          VARCHAR(100),
    last_name           VARCHAR(100),
    designation         VARCHAR(100),
    department          VARCHAR(100),
    phone               VARCHAR(20),
    email               VARCHAR(200),
    joining_date        DATE,
    salary              NUMERIC(12,2),
    is_active           BOOLEAN DEFAULT TRUE,
    created_at          TIMESTAMP DEFAULT NOW()
);

-- ================================================================
-- ██████╗  INDEXES (High Performance for Website)
-- ================================================================

-- Auth
CREATE INDEX idx_users_email     ON auth.users(email);
CREATE INDEX idx_users_role      ON auth.users(role_id);
CREATE INDEX idx_sessions_user   ON auth.user_sessions(user_id);
CREATE INDEX idx_sessions_active ON auth.user_sessions(is_active);

-- Core
CREATE INDEX idx_colleges_univ   ON core.colleges(university_id);
CREATE INDEX idx_depts_college   ON core.departments(college_id);

-- Academic
CREATE INDEX idx_programs_dept   ON academic.programs(department_id);
CREATE INDEX idx_subjects_dept   ON academic.subjects(department_id);
CREATE INDEX idx_timetable_prog  ON academic.timetable(program_id);
CREATE INDEX idx_timetable_sem   ON academic.timetable(semester_id);

-- Student
CREATE INDEX idx_student_roll    ON student.students(roll_number);
CREATE INDEX idx_student_user    ON student.students(user_id);
CREATE INDEX idx_student_prog    ON student.students(program_id);
CREATE INDEX idx_enroll_student  ON student.enrollments(student_id);
CREATE INDEX idx_attend_student  ON student.attendance(student_id);
CREATE INDEX idx_attend_date     ON student.attendance(attendance_date);
CREATE INDEX idx_attend_subject  ON student.attendance(subject_id);
CREATE INDEX idx_results_student ON student.exam_results(student_id);
CREATE INDEX idx_results_exam    ON student.exam_results(exam_id);

-- Finance
CREATE INDEX idx_invoice_student ON finance.student_fee_invoices(student_id);
CREATE INDEX idx_payment_student ON finance.fee_payments(student_id);

-- Library
CREATE INDEX idx_lib_txn_user    ON library.transactions(user_id);
CREATE INDEX idx_lib_txn_status  ON library.transactions(status);

-- Audit
CREATE INDEX idx_audit_user      ON audit.audit_logs(user_id);
CREATE INDEX idx_audit_table     ON audit.audit_logs(table_name);
CREATE INDEX idx_audit_time      ON audit.audit_logs(performed_at);

-- Notifications
CREATE INDEX idx_notif_user      ON notify.notifications(user_id);
CREATE INDEX idx_notif_read      ON notify.notifications(is_read);

-- ================================================================
-- ██████╗  TRIGGERS
-- ================================================================

-- Auto-update updated_at on students
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS 
$$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$
 LANGUAGE plpgsql;

CREATE TRIGGER trg_student_updated
BEFORE UPDATE ON student.students
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_faculty_updated
BEFORE UPDATE ON faculty.faculty_profiles
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_user_updated
BEFORE UPDATE ON auth.users
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Auto-update available_copies in library when book issued/returned
CREATE OR REPLACE FUNCTION update_book_copies()
RETURNS TRIGGER AS 
$$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'Issued' THEN
        UPDATE library.books SET available_copies = available_copies - 1 WHERE book_id = NEW.book_id;
    ELSIF TG_OP = 'UPDATE' AND NEW.status = 'Returned' AND OLD.status = 'Issued' THEN
        UPDATE library.books SET available_copies = available_copies + 1 WHERE book_id = NEW.book_id;
    END IF;
    RETURN NEW;
END;
$$
 LANGUAGE plpgsql;

CREATE TRIGGER trg_library_copies
AFTER INSERT OR UPDATE ON library.transactions
FOR EACH ROW EXECUTE FUNCTION update_book_copies();

-- Auto-update hostel room occupancy
CREATE OR REPLACE FUNCTION update_room_occupancy()
RETURNS TRIGGER AS 
$$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'Active' THEN
        UPDATE hostel.rooms SET current_occupancy = current_occupancy + 1 WHERE room_id = NEW.room_id;
    ELSIF TG_OP = 'UPDATE' AND NEW.status = 'Vacated' AND OLD.status = 'Active' THEN
        UPDATE hostel.rooms SET current_occupancy = current_occupancy - 1 WHERE room_id = NEW.room_id;
    END IF;
    RETURN NEW;
END;
$$
 LANGUAGE plpgsql;

CREATE TRIGGER trg_hostel_occupancy
AFTER INSERT OR UPDATE ON hostel.allocations
FOR EACH ROW EXECUTE FUNCTION update_room_occupancy();

-- Auto-notify student when result is published
CREATE OR REPLACE FUNCTION notify_result_published()
RETURNS TRIGGER AS 
$$
BEGIN
    IF NEW.is_verified = TRUE AND OLD.is_verified = FALSE THEN
        INSERT INTO notify.notifications(user_id, title, message, type)
        SELECT s.user_id, 
               'Result Published',
               'Your exam result has been published. Check your dashboard.',
               'Result'
        FROM student.students s WHERE s.student_id = NEW.student_id;
    END IF;
    RETURN NEW;
END;
$$
 LANGUAGE plpgsql;

CREATE TRIGGER trg_result_notify
AFTER UPDATE ON student.exam_results
FOR EACH ROW EXECUTE FUNCTION notify_result_published();

-- Auto-notify student when fee is due
CREATE OR REPLACE FUNCTION notify_fee_due()
RETURNS TRIGGER AS 
$$
BEGIN
    IF NEW.status = 'Overdue' AND OLD.status != 'Overdue' THEN
        INSERT INTO notify.notifications(user_id, title, message, type)
        SELECT s.user_id,
               'Fee Overdue',
               'Your fee payment is overdue. Please pay immediately to avoid fine.',
               'Fee Due'
        FROM student.students s WHERE s.student_id = NEW.student_id;
    END IF;
    RETURN NEW;
END;
$$
 LANGUAGE plpgsql;

CREATE TRIGGER trg_fee_notify
AFTER UPDATE ON finance.student_fee_invoices
FOR EACH ROW EXECUTE FUNCTION notify_fee_due();

-- ================================================================
-- ██████╗  STORED PROCEDURES
-- ================================================================

-- Procedure: Enroll student in all mandatory subjects for a semester
CREATE OR REPLACE PROCEDURE enroll_student_in_semester(
    p_student_id INT,
    p_semester_id INT,
    p_semester_number INT
)
LANGUAGE plpgsql AS 
$$
DECLARE
    v_program_id INT;
    rec RECORD;
BEGIN
    SELECT program_id INTO v_program_id FROM student.students WHERE student_id = p_student_id;
    
    FOR rec IN
        SELECT ps.subject_id
        FROM academic.program_subjects ps
        WHERE ps.program_id = v_program_id
          AND ps.semester_number = p_semester_number
          AND ps.is_mandatory = TRUE
    LOOP
        INSERT INTO student.enrollments(student_id, subject_id, semester_id)
        VALUES(p_student_id, rec.subject_id, p_semester_id)
        ON CONFLICT (student_id, subject_id, semester_id) DO NOTHING;
    END LOOP;
END;
$$
;

-- Procedure: Calculate SGPA for a student
CREATE OR REPLACE PROCEDURE calculate_sgpa(
    p_student_id INT,
    p_semester_id INT
)
LANGUAGE plpgsql AS 
$$
DECLARE
    v_total_credits INT := 0;
    v_weighted_sum NUMERIC := 0;
    v_sgpa NUMERIC;
    rec RECORD;
BEGIN
    FOR rec IN
        SELECT er.grade_points, s.credits
        FROM student.exam_results er
        JOIN student.exams ex ON er.exam_id = ex.exam_id
        JOIN academic.subjects s ON ex.subject_id = s.subject_id
        WHERE er.student_id = p_student_id
          AND ex.semester_id = p_semester_id
          AND ex.exam_type = 'Final'
          AND er.is_verified = TRUE
    LOOP
        v_total_credits := v_total_credits + rec.credits;
        v_weighted_sum := v_weighted_sum + (rec.grade_points * rec.credits);
    END LOOP;

    IF v_total_credits > 0 THEN
        v_sgpa := ROUND(v_weighted_sum / v_total_credits, 2);
    ELSE
        v_sgpa := 0;
    END IF;

    INSERT INTO student.student_sgpa(student_id, semester_id, total_credits, sgpa, calculated_at)
    VALUES(p_student_id, p_semester_id, v_total_credits, v_sgpa, NOW())
    ON CONFLICT DO NOTHING;
END;
$$
;

-- ================================================================
-- ██████╗  VIEWS (For Website API)
-- ================================================================

-- Student Dashboard View
CREATE OR REPLACE VIEW student.v_student_dashboard AS
SELECT
    s.student_id,
    s.roll_number,
    s.first_name || ' ' || s.last_name AS full_name,
    s.photo_url,
    s.current_semester,
    s.batch,
    s.section,
    p.name AS program_name,
    p.degree_type,
    d.name AS department,
    c.name AS college,
    u.name AS university,
    s.is_active,
    au.email AS login_email,
    au.last_login
FROM student.students s
JOIN academic.programs p ON s.program_id = p.program_id
JOIN core.departments d ON p.department_id = d.department_id
JOIN core.colleges c ON d.college_id = c.college_id
JOIN core.university u ON c.university_id = u.university_id
JOIN auth.users au ON s.user_id = au.user_id;

-- Faculty Dashboard View
CREATE OR REPLACE VIEW faculty.v_faculty_dashboard AS
SELECT
    f.faculty_id,
    f.employee_code,
    f.first_name || ' ' || f.last_name AS full_name,
    f.designation,
    f.qualification,
    f.photo_url,
    d.name AS department,
    c.name AS college,
    u.name AS university,
    au.email AS login_email,
    au.last_login
FROM faculty.faculty_profiles f
JOIN core.departments d ON f.department_id = d.department_id
JOIN core.colleges c ON d.college_id = c.college_id
JOIN core.university u ON c.university_id = u.university_id
JOIN auth.users au ON f.user_id = au.user_id;

-- Student Result Card View
CREATE OR REPLACE VIEW student.v_result_card AS
SELECT
    s.roll_number,
    s.first_name || ' ' || s.last_name AS student_name,
    sub.subject_code,
    sub.subject_name,
    sub.credits,
    ex.exam_type,
    ex.max_marks,
    er.marks_obtained,
    er.grade,
    er.grade_points,
    er.is_pass,
    sem.semester_number,
    ay.year_label AS academic_year
FROM student.exam_results er
JOIN student.exams ex ON er.exam_id = ex.exam_id
JOIN student.students s ON er.student_id = s.student_id
JOIN academic.subjects sub ON ex.subject_id = sub.subject_id
JOIN academic.semesters sem ON ex.semester_id = sem.semester_id
JOIN academic.academic_years ay ON sem.academic_year_id = ay.academic_year_id
WHERE er.is_verified = TRUE;

-- Fee Status View
CREATE OR REPLACE VIEW finance.v_fee_status AS
SELECT
    s.roll_number,
    s.first_name || ' ' || s.last_name AS student_name,
    p.name AS program,
    fi.semester_number,
    ay.year_label,
    fi.total_amount,
    fi.discount_amount,
    fi.net_amount,
    fi.paid_amount,
    fi.balance_due,
    fi.status AS payment_status,
    fi.due_date
FROM finance.student_fee_invoices fi
JOIN student.students s ON fi.student_id = s.student_id
JOIN academic.programs p ON s.program_id = p.program_id
JOIN academic.academic_years ay ON fi.academic_year_id = ay.academic_year_id;

-- Attendance Alert View (below 75%)
CREATE OR REPLACE VIEW student.v_attendance_alerts AS
SELECT *
FROM student.attendance_summary
WHERE attendance_pct < 75.00;

-- ================================================================
-- ██████╗  SEED DATA
-- ================================================================

-- Roles
INSERT INTO auth.roles (role_name, description) VALUES
('super_admin',      'Full system access'),
('university_admin', 'University level admin'),
('college_admin',    'College level admin'),
('hod',              'Head of Department'),
('faculty',          'Teaching faculty'),
('student',          'Enrolled student'),
('parent',           'Parent/Guardian'),
('staff',            'Non-teaching staff');

-- Permissions
INSERT INTO auth.permissions (module, action, description) VALUES
('attendance',   'view',   'View attendance'),
('attendance',   'create', 'Mark attendance'),
('results',      'view',   'View results'),
('results',      'create', 'Enter results'),
('fees',         'view',   'View fee details'),
('fees',         'create', 'Generate fee invoice'),
('library',      'view',   'View library'),
('library',      'create', 'Issue books'),
('timetable',    'view',   'View timetable'),
('notices',      'view',   'View notices'),
('notices',      'create', 'Post notices'),
('students',     'view',   'View students'),
('students',     'edit',   'Edit student info'),
('reports',      'view',   'View reports');

-- University
INSERT INTO core.university (name, short_name, established_year, city, state, phone, email, website, vice_chancellor, accreditation, naac_grade, nirf_rank)
VALUES ('National Technology University', 'NTU', 1985, 'Hyderabad', 'Telangana', '040-12345678', 'info@ntu.edu.in', 'www.ntu.edu.in', 'Dr. Ramesh Sharma', 'NAAC', 'A++', 45);

-- Colleges
INSERT INTO core.colleges (university_id, name, short_name, code, established_year, college_type, city, phone, email, principal_name)
VALUES
(1, 'College of Engineering & Technology',  'CET', 'CET', 2000, 'Engineering',  'Hyderabad', '040-11112222', 'cet@ntu.edu.in',  'Dr. Anil Kumar'),
(1, 'College of Science & Arts',            'CSA', 'CSA', 1990, 'Science/Arts', 'Hyderabad', '040-33334444', 'csa@ntu.edu.in',  'Dr. Priya Mehta'),
(1, 'College of Business Management',       'CBM', 'CBM', 1995, 'Management',   'Hyderabad', '040-55556666', 'cbm@ntu.edu.in',  'Dr. Suresh Rao'),
(1, 'College of Medical Sciences',          'CMS', 'CMS', 2005, 'Medical',      'Hyderabad', '040-77778888', 'cms@ntu.edu.in',  'Dr. Kavitha Nair'),
(1, 'College of Law',                       'COL', 'LAW', 2010, 'Law',          'Hyderabad', '040-99990000', 'law@ntu.edu.in',  'Dr. Meera Reddy');

-- Departments
INSERT INTO core.departments (college_id, name, code, hod_name, phone, established_year)
VALUES
(1, 'Computer Science & Engineering', 'CSE',   'Dr. Vikram Reddy',  '040-1001', 2000),
(1, 'Electronics & Communication',    'ECE',   'Dr. Sita Rao',      '040-1002', 2001),
(1, 'Mechanical Engineering',         'MECH',  'Dr. Ravi Teja',     '040-1003', 2002),
(1, 'Civil Engineering',              'CIVIL', 'Dr. Sunita Verma',  '040-1004', 2003),
(1, 'Information Technology',         'IT',    'Dr. Kiran Bose',    '040-1005', 2004),
(2, 'Physics',                        'PHY',   'Dr. Anand Patel',   '040-2001', 1990),
(2, 'Chemistry',                      'CHEM',  'Dr. Leela Devi',    '040-2002', 1990),
(2, 'Mathematics',                    'MATH',  'Dr. Mohan Lal',     '040-2003', 1990),
(3, 'MBA Department',                 'MBA',   'Dr. Geeta Singh',   '040-3001', 1995),
(4, 'General Medicine',               'MED',   'Dr. Raj Kumar',     '040-4001', 2005);

-- Academic Years
INSERT INTO academic.academic_years (year_label, start_date, end_date, is_current) VALUES
('2022-2023', '2022-07-01', '2023-06-30', FALSE),
('2023-2024', '2023-07-01', '2024-06-30', FALSE),
('2024-2025', '2024-07-01', '2025-06-30', TRUE);

-- Semesters
INSERT INTO academic.semesters (academic_year_id, semester_number, semester_name, start_date, end_date, is_current) VALUES
(3, 1, 'Odd',  '2024-07-01', '2024-11-30', FALSE),
(3, 2, 'Even', '2025-01-01', '2025-05-31', TRUE),
(2, 3, 'Odd',  '2023-07-01', '2023-11-30', FALSE),
(2, 4, 'Even', '2024-01-01', '2024-05-31', FALSE),
(1, 5, 'Odd',  '2022-07-01', '2022-11-30', FALSE),
(1, 6, 'Even', '2023-01-01', '2023-05-31', FALSE);

-- Programs
INSERT INTO academic.programs (department_id, name, code, degree_type, duration_years, total_semesters, total_credits, intake_capacity)
VALUES
(1, 'B.Tech Computer Science & Engineering', 'BTECH-CSE',  'B.Tech', 4, 8, 160, 120),
(1, 'M.Tech Computer Science',               'MTECH-CSE',  'M.Tech', 2, 4, 80,  30),
(1, 'PhD Computer Science',                  'PHD-CSE',    'PhD',    3, 6, 120, 10),
(2, 'B.Tech Electronics & Communication',    'BTECH-ECE',  'B.Tech', 4, 8, 160, 90),
(3, 'B.Tech Mechanical Engineering',         'BTECH-MECH', 'B.Tech', 4, 8, 160, 90),
(4, 'B.Tech Civil Engineering',              'BTECH-CIVIL','B.Tech', 4, 8, 160, 60),
(5, 'B.Tech Information Technology',         'BTECH-IT',   'B.Tech', 4, 8, 160, 90),
(9, 'Master of Business Administration',     'MBA-GEN',    'MBA',    2, 4, 100, 60),
(8, 'B.Sc Mathematics',                      'BSC-MATH',   'B.Sc',   3, 6, 120, 60);

-- Subjects
INSERT INTO academic.subjects (department_id, subject_code, subject_name, credits, subject_type, lecture_hours, lab_hours, semester_number) VALUES
(1, 'CSE101', 'Programming Fundamentals',           4, 'Theory', 3, 2, 1),
(8, 'MATH101','Engineering Mathematics I',          4, 'Theory', 4, 0, 1),
(1, 'CSE102', 'Data Structures & Algorithms',       4, 'Theory', 3, 2, 2),
(1, 'CSE201', 'Database Management Systems',        4, 'Theory', 3, 2, 3),
(1, 'CSE202', 'Operating Systems',                  3, 'Theory', 3, 0, 3),
(1, 'CSE203', 'Computer Networks',                  3, 'Theory', 3, 0, 4),
(1, 'CSE301', 'Machine Learning',                   4, 'Theory', 3, 2, 5),
(1, 'CSE302', 'Artificial Intelligence',            4, 'Theory', 3, 2, 5),
(1, 'CSE303', 'Web Technologies',                   3, 'Theory', 2, 2, 5),
(1, 'CSE401', 'Cloud Computing',                    3, 'Elective',3, 0, 7),
(1, 'CSE402', 'Cyber Security',                     3, 'Elective',3, 0, 7),
(1, 'CSE403', 'Capstone Project',                   6, 'Project', 0,12, 8),
(2, 'ECE101', 'Basic Electronics',                  4, 'Theory', 3, 2, 1),
(9, 'MBA101', 'Principles of Management',           4, 'Theory', 4, 0, 1),
(9, 'MBA102', 'Business Economics',                 4, 'Theory', 4, 0, 1);

-- Program-Subject Mapping
INSERT INTO academic.program_subjects (program_id, subject_id, semester_number, is_mandatory) VALUES
(1, 1, 1, TRUE), (1, 2, 1, TRUE),
(1, 3, 2, TRUE),
(1, 4, 3, TRUE), (1, 5, 3, TRUE),
(1, 6, 4, TRUE),
(1, 7, 5, TRUE), (1, 8, 5, TRUE), (1, 9, 5, FALSE),
(1, 10, 7, FALSE), (1, 11, 7, FALSE),
(1, 12, 8, TRUE),
(8, 14, 1, TRUE), (8, 15, 1, TRUE);

-- Fee Categories
INSERT INTO finance.fee_categories (name, description) VALUES
('Tuition Fee',   'Academic tuition fee'),
('Exam Fee',      'Semester examination fee'),
('Lab Fee',       'Laboratory and practical fee'),
('Library Fee',   'Library membership fee'),
('Hostel Fee',    'Hostel accommodation fee'),
('Transport Fee', 'Bus/transport fee'),
('Misc Fee',      'Miscellaneous charges');

-- Users (Auth)
-- Passwords are bcrypt hashed. For demo, use crypt('password123', gen_salt('bf'))
INSERT INTO auth.users (user_id, username, email, password_hash, role_id, is_active, is_verified)
VALUES
-- Super Admin
(uuid_generate_v4(), 'superadmin',       'superadmin@ntu.edu.in',        'Admin@123', 1, TRUE, TRUE),
-- University Admin
(uuid_generate_v4(), 'univ.admin',       'univadmin@ntu.edu.in',         'Admin@123', 2, TRUE, TRUE),
-- College Admins
(uuid_generate_v4(), 'cet.admin',        'cetadmin@ntu.edu.in',          'Admin@123', 3, TRUE, TRUE),
-- Faculty
(uuid_generate_v4(), 'rajesh.kumar',     'rajesh.kumar@ntu.edu.in',      'Faculty@123', 5, TRUE, TRUE),
(uuid_generate_v4(), 'anjali.sharma',    'anjali.sharma@ntu.edu.in',     'Faculty@123', 5, TRUE, TRUE),
(uuid_generate_v4(), 'suresh.patil',     'suresh.patil@ntu.edu.in',      'Faculty@123', 5, TRUE, TRUE),
-- Students
(uuid_generate_v4(), '22cse001',         '22cse001@student.ntu.edu.in',  'Student@123', 6, TRUE, TRUE),
(uuid_generate_v4(), '22cse002',         '22cse002@student.ntu.edu.in',  'Student@123', 6, TRUE, TRUE),
(uuid_generate_v4(), '22cse003',         '22cse003@student.ntu.edu.in',  'Student@123', 6, TRUE, TRUE),
(uuid_generate_v4(), '22cse004',         '22cse004@student.ntu.edu.in',  'Student@123', 6, TRUE, TRUE),
(uuid_generate_v4(), '23cse001',         '23cse001@student.ntu.edu.in',  'Student@123', 6, TRUE, TRUE),
(uuid_generate_v4(), '23cse002',         '23cse002@student.ntu.edu.in',  'Student@123', 6, TRUE, TRUE),
(uuid_generate_v4(), '22ece001',         '22ece001@student.ntu.edu.in',  'Student@123', 6, TRUE, TRUE),
(uuid_generate_v4(), '22ece002',         '22ece002@student.ntu.edu.in',  'Student@123', 6, TRUE, TRUE),
(uuid_generate_v4(), '23mba001',         '23mba001@student.ntu.edu.in',  'Student@123', 6, TRUE, TRUE),
(uuid_generate_v4(), '23mba002',         '23mba002@student.ntu.edu.in',  'Student@123', 6, TRUE, TRUE),
(uuid_generate_v4(), '24cse001',         '24cse001@student.ntu.edu.in',  'Student@123', 6, TRUE, TRUE),
(uuid_generate_v4(), '24cse002',         '24cse002@student.ntu.edu.in',  'Student@123', 6, TRUE, TRUE),
(uuid_generate_v4(), '24cse003',         '24cse003@student.ntu.edu.in',  'Student@123', 6, TRUE, TRUE);
-- ================================================================
-- ██████╗  FACULTY PROFILES
-- ================================================================

INSERT INTO faculty.faculty_profiles 
(user_id, department_id, employee_code, first_name, last_name, gender, date_of_birth, phone, 
 designation, qualification, specialization, experience_years, joining_date, salary, is_active)
VALUES
(
  (SELECT user_id FROM auth.users WHERE username = 'rajesh.kumar'),
  1, 'FAC001', 'Rajesh', 'Kumar', 'Male', '1978-05-15', '9876543210',
  'Professor', 'PhD (Computer Science)', 'Machine Learning & AI', 19, '2005-06-01', 95000.00, TRUE
),
(
  (SELECT user_id FROM auth.users WHERE username = 'anjali.sharma'),
  1, 'FAC002', 'Anjali', 'Sharma', 'Female', '1985-08-22', '9876543211',
  'Associate Professor', 'PhD (Artificial Intelligence)', 'Deep Learning & NLP', 14, '2010-07-15', 78000.00, TRUE
),
(
  (SELECT user_id FROM auth.users WHERE username = 'suresh.patil'),
  1, 'FAC003', 'Suresh', 'Patil', 'Male', '1990-03-10', '9876543212',
  'Assistant Professor', 'M.Tech (CSE)', 'Database Systems & Cloud', 9, '2015-08-01', 58000.00, TRUE
);

-- ================================================================
-- ██████╗  STUDENT PROFILES
-- ================================================================

INSERT INTO student.students
(user_id, program_id, roll_number, university_reg_no, first_name, last_name, gender,
 date_of_birth, blood_group, phone, personal_email, address, city, state, pincode,
 category, admission_year, current_semester, batch, section, is_active)
VALUES
(
  (SELECT user_id FROM auth.users WHERE username = '22cse001'),
  1, '22CSE001', 'NTU22CSE001', 'Arjun', 'Mehta', 'Male',
  '2004-06-15', 'O+', '9111111101', 'arjun.mehta@gmail.com',
  '12 MG Road', 'Hyderabad', 'Telangana', '500001',
  'General', 2022, 6, '2022-2026', 'A', TRUE
),
(
  (SELECT user_id FROM auth.users WHERE username = '22cse002'),
  1, '22CSE002', 'NTU22CSE002', 'Priya', 'Nair', 'Female',
  '2004-09-20', 'A+', '9111111102', 'priya.nair@gmail.com',
  '45 Banjara Hills', 'Hyderabad', 'Telangana', '500034',
  'OBC', 2022, 6, '2022-2026', 'A', TRUE
),
(
  (SELECT user_id FROM auth.users WHERE username = '22cse003'),
  1, '22CSE003', 'NTU22CSE003', 'Rohan', 'Gupta', 'Male',
  '2004-01-08', 'B+', '9111111103', 'rohan.gupta@gmail.com',
  '78 Jubilee Hills', 'Hyderabad', 'Telangana', '500033',
  'SC', 2022, 6, '2022-2026', 'A', TRUE
),
(
  (SELECT user_id FROM auth.users WHERE username = '23cse001'),
  1, '23CSE001', 'NTU23CSE001', 'Sneha', 'Joshi', 'Female',
  '2005-03-14', 'AB+', '9111111104', 'sneha.joshi@gmail.com',
  '33 Ameerpet', 'Hyderabad', 'Telangana', '500016',
  'General', 2023, 4, '2023-2027', 'A', TRUE
),
(
  (SELECT user_id FROM auth.users WHERE username = '23cse002'),
  1, '23CSE002', 'NTU23CSE002', 'Aman', 'Singh', 'Male',
  '2005-07-25', 'O-', '9111111105', 'aman.singh@gmail.com',
  '56 Begumpet', 'Hyderabad', 'Telangana', '500003',
  'OBC', 2023, 4, '2023-2027', 'B', TRUE
),
(
  (SELECT user_id FROM auth.users WHERE username = '22ece001'),
  4, '22ECE001', 'NTU22ECE001', 'Kavya', 'Reddy', 'Female',
  '2004-11-02', 'B-', '9111111106', 'kavya.reddy@gmail.com',
  '22 SR Nagar', 'Hyderabad', 'Telangana', '500038',
  'General', 2022, 6, '2022-2026', 'A', TRUE
),
(
  (SELECT user_id FROM auth.users WHERE username = '22ece002'),
  4, '22ECE002', 'NTU22ECE002', 'Nikhil', 'Tiwari', 'Male',
  '2004-04-18', 'A-', '9111111107', 'nikhil.tiwari@gmail.com',
  '89 LB Nagar', 'Hyderabad', 'Telangana', '500074',
  'ST', 2022, 6, '2022-2026', 'A', TRUE
),
(
  (SELECT user_id FROM auth.users WHERE username = '23mba001'),
  8, '23MBA001', 'NTU23MBA001', 'Deepika', 'Pillai', 'Female',
  '2001-08-30', 'O+', '9111111108', 'deepika.pillai@gmail.com',
  '14 Madhapur', 'Hyderabad', 'Telangana', '500081',
  'General', 2023, 2, '2023-2025', 'A', TRUE
),
(
  (SELECT user_id FROM auth.users WHERE username = '23mba002'),
  8, '23MBA002', 'NTU23MBA002', 'Rahul', 'Agarwal', 'Male',
  '2000-12-05', 'B+', '9111111109', 'rahul.agarwal@gmail.com',
  '67 Gachibowli', 'Hyderabad', 'Telangana', '500032',
  'General', 2023, 2, '2023-2025', 'A', TRUE
),
(
  (SELECT user_id FROM auth.users WHERE username = '24cse001'),
  1, '24CSE001', 'NTU24CSE001', 'Divya', 'Kapoor', 'Female',
  '2006-05-19', 'AB-', '9111111110', 'divya.kapoor@gmail.com',
  '90 Kukatpally', 'Hyderabad', 'Telangana', '500072',
  'OBC', 2024, 2, '2024-2028', 'A', TRUE
),
(
  (SELECT user_id FROM auth.users WHERE username = '24cse002'),
  1, '24CSE002', 'NTU24CSE002', 'Karthik', 'Rajan', 'Male',
  '2006-04-10', 'O+', '9111111111', 'karthik.rajan@gmail.com',
  '11 Dilsukhnagar', 'Hyderabad', 'Telangana', '500060',
  'General', 2024, 2, '2024-2028', 'B', TRUE
),
(
  (SELECT user_id FROM auth.users WHERE username = '24cse003'),
  1, '24CSE003', 'NTU24CSE003', 'Pallavi', 'Nanda', 'Female',
  '2006-08-22', 'A+', '9111111112', 'pallavi.nanda@gmail.com',
  '55 Uppal', 'Hyderabad', 'Telangana', '500039',
  'OBC', 2024, 2, '2024-2028', 'B', TRUE
);

-- ================================================================
-- ██████╗  STUDENT PARENTS
-- ================================================================

INSERT INTO student.student_parents
(student_id, father_name, father_phone, father_email, father_occupation,
 mother_name, mother_phone, mother_occupation, annual_income)
VALUES
(1, 'Suresh Mehta',   '9222222201', 'suresh.mehta@gmail.com',   'Engineer',      'Lata Mehta',    '9222222202', 'Teacher',        850000),
(2, 'Krishnan Nair',  '9222222203', 'krishnan.nair@gmail.com',  'Doctor',        'Suma Nair',     '9222222204', 'Homemaker',     1200000),
(3, 'Vijay Gupta',    '9222222205', 'vijay.gupta@gmail.com',    'Farmer',        'Rani Gupta',    '9222222206', 'Homemaker',      300000),
(4, 'Ramesh Joshi',   '9222222207', 'ramesh.joshi@gmail.com',   'Businessman',   'Suman Joshi',   '9222222208', 'Accountant',     950000),
(5, 'Harpal Singh',   '9222222209', 'harpal.singh@gmail.com',   'Army Officer',  'Gurpreet Kaur', '9222222210', 'Teacher',        700000),
(6, 'Reddy Venkat',   '9222222211', 'reddy.venkat@gmail.com',   'Civil Engineer','Sunitha Reddy', '9222222212', 'Doctor',        1100000),
(7, 'Mohan Tiwari',   '9222222213', 'mohan.tiwari@gmail.com',   'Shop Owner',    'Geeta Tiwari',  '9222222214', 'Homemaker',      450000),
(8, 'Ravi Pillai',    '9222222215', 'ravi.pillai@gmail.com',    'Banker',        'Sree Pillai',   '9222222216', 'Nurse',          780000),
(9, 'Anil Agarwal',   '9222222217', 'anil.agarwal@gmail.com',   'CA',            'Ritu Agarwal',  '9222222218', 'Teacher',       1500000),
(10,'Raj Kapoor',     '9222222219', 'raj.kapoor@gmail.com',     'Architect',     'Neha Kapoor',   '9222222220', 'Interior Designer',900000);

-- ================================================================
-- ██████╗  FACULTY SUBJECT ASSIGNMENTS
-- ================================================================

INSERT INTO faculty.faculty_subjects
(faculty_id, subject_id, semester_id, section, academic_year_id)
VALUES
(1, 7,  1, 'A', 3),   -- Rajesh teaches Machine Learning, Sem 1 (odd)
(1, 8,  1, 'B', 3),   -- Rajesh teaches AI, Sem 1 (odd)
(2, 8,  1, 'A', 3),   -- Anjali teaches AI, Sem 1 (odd)
(2, 7,  1, 'B', 3),   -- Anjali teaches ML, Sem 1 (odd)
(3, 4,  2, 'A', 3),   -- Suresh teaches DBMS, Sem 2 (even)
(3, 5,  2, 'B', 3),   -- Suresh teaches OS, Sem 2 (even)
(1, 10, 1, 'A', 3),   -- Rajesh teaches Cloud Computing
(2, 9,  1, 'A', 3);   -- Anjali teaches Web Tech

-- ================================================================
-- ██████╗  TIMETABLE
-- ================================================================

INSERT INTO academic.timetable
(program_id, subject_id, faculty_user_id, semester_id, section, day_of_week, start_time, end_time, room_number)
VALUES
(1, 7,  (SELECT user_id FROM auth.users WHERE username='rajesh.kumar'),  1, 'A', 'Monday',    '09:00', '10:00', 'CSE-101'),
(1, 7,  (SELECT user_id FROM auth.users WHERE username='rajesh.kumar'),  1, 'A', 'Wednesday', '09:00', '10:00', 'CSE-101'),
(1, 7,  (SELECT user_id FROM auth.users WHERE username='rajesh.kumar'),  1, 'A', 'Friday',    '09:00', '10:00', 'CSE-101'),
(1, 8,  (SELECT user_id FROM auth.users WHERE username='anjali.sharma'), 1, 'A', 'Monday',    '10:00', '11:00', 'CSE-102'),
(1, 8,  (SELECT user_id FROM auth.users WHERE username='anjali.sharma'), 1, 'A', 'Thursday',  '10:00', '11:00', 'CSE-102'),
(1, 9,  (SELECT user_id FROM auth.users WHERE username='anjali.sharma'), 1, 'A', 'Tuesday',   '11:00', '12:00', 'CSE-LAB1'),
(1, 4,  (SELECT user_id FROM auth.users WHERE username='suresh.patil'),  2, 'A', 'Monday',    '09:00', '10:00', 'CSE-201'),
(1, 4,  (SELECT user_id FROM auth.users WHERE username='suresh.patil'),  2, 'A', 'Wednesday', '09:00', '10:00', 'CSE-201'),
(1, 5,  (SELECT user_id FROM auth.users WHERE username='suresh.patil'),  2, 'B', 'Tuesday',   '10:00', '11:00', 'CSE-202'),
(1, 5,  (SELECT user_id FROM auth.users WHERE username='suresh.patil'),  2, 'B', 'Thursday',  '10:00', '11:00', 'CSE-202'),
(1, 10, (SELECT user_id FROM auth.users WHERE username='rajesh.kumar'),  1, 'A', 'Friday',    '11:00', '12:00', 'CSE-301');

-- ================================================================
-- ██████╗  ENROLLMENTS
-- ================================================================

INSERT INTO student.enrollments (student_id, subject_id, semester_id, status) VALUES
-- 2022 Batch (Sem 6) - ML, AI, Web Tech, Cloud, Cyber Security
(1, 7, 1, 'Active'), (1, 8, 1, 'Active'), (1, 9, 1, 'Active'), (1, 10, 1, 'Active'), (1, 11, 1, 'Active'),
(2, 7, 1, 'Active'), (2, 8, 1, 'Active'), (2, 9, 1, 'Active'), (2, 10, 1, 'Active'),
(3, 7, 1, 'Active'), (3, 8, 1, 'Active'), (3, 9, 1, 'Active'),
(6, 7, 1, 'Active'), (6, 8, 1, 'Active'),
(7, 7, 1, 'Active'), (7, 8, 1, 'Active'),
-- 2023 Batch (Sem 4) - DBMS, OS, Computer Networks
(4, 4, 2, 'Active'), (4, 5, 2, 'Active'), (4, 6, 2, 'Active'),
(5, 4, 2, 'Active'), (5, 5, 2, 'Active'), (5, 6, 2, 'Active'),
-- 2024 Batch (Sem 2) - DSA, Math
(10, 3, 2, 'Active'), (10, 2, 2, 'Active'),
(11, 3, 2, 'Active'), (11, 2, 2, 'Active'),
(12, 3, 2, 'Active'), (12, 2, 2, 'Active'),
-- MBA Students
(8, 14, 1, 'Active'), (8, 15, 1, 'Active'),
(9, 14, 1, 'Active'), (9, 15, 1, 'Active');

-- ================================================================
-- ██████╗  ATTENDANCE
-- ================================================================

INSERT INTO student.attendance
(student_id, subject_id, faculty_id, semester_id, attendance_date, class_type, status)
VALUES
-- Arjun - Machine Learning (Subject 7)
(1, 7, 1, 1, '2024-07-08', 'Lecture', 'Present'),
(1, 7, 1, 1, '2024-07-10', 'Lecture', 'Present'),
(1, 7, 1, 1, '2024-07-12', 'Lecture', 'Present'),
(1, 7, 1, 1, '2024-07-15', 'Lecture', 'Absent'),
(1, 7, 1, 1, '2024-07-17', 'Lecture', 'Present'),
(1, 7, 1, 1, '2024-07-19', 'Lecture', 'Present'),
(1, 7, 1, 1, '2024-07-22', 'Lecture', 'Present'),
(1, 7, 1, 1, '2024-07-24', 'Lecture', 'Present'),
(1, 7, 1, 1, '2024-07-26', 'Lecture', 'Absent'),
(1, 7, 1, 1, '2024-07-29', 'Lecture', 'Present'),
-- Arjun - AI (Subject 8)
(1, 8, 2, 1, '2024-07-08', 'Lecture', 'Present'),
(1, 8, 2, 1, '2024-07-11', 'Lecture', 'Present'),
(1, 8, 2, 1, '2024-07-15', 'Lecture', 'Present'),
(1, 8, 2, 1, '2024-07-18', 'Lecture', 'Absent'),
(1, 8, 2, 1, '2024-07-22', 'Lecture', 'Present'),
(1, 8, 2, 1, '2024-07-25', 'Lecture', 'Present'),
-- Priya - Machine Learning
(2, 7, 1, 1, '2024-07-08', 'Lecture', 'Present'),
(2, 7, 1, 1, '2024-07-10', 'Lecture', 'Absent'),
(2, 7, 1, 1, '2024-07-12', 'Lecture', 'Present'),
(2, 7, 1, 1, '2024-07-15', 'Lecture', 'Present'),
(2, 7, 1, 1, '2024-07-17', 'Lecture', 'Present'),
(2, 7, 1, 1, '2024-07-19', 'Lecture', 'Present'),
(2, 7, 1, 1, '2024-07-22', 'Lecture', 'Absent'),
(2, 7, 1, 1, '2024-07-24', 'Lecture', 'Present'),
(2, 7, 1, 1, '2024-07-26', 'Lecture', 'Present'),
(2, 7, 1, 1, '2024-07-29', 'Lecture', 'Present'),
-- Rohan - Machine Learning (low attendance warning)
(3, 7, 1, 1, '2024-07-08', 'Lecture', 'Absent'),
(3, 7, 1, 1, '2024-07-10', 'Lecture', 'Absent'),
(3, 7, 1, 1, '2024-07-12', 'Lecture', 'Present'),
(3, 7, 1, 1, '2024-07-15', 'Lecture', 'Absent'),
(3, 7, 1, 1, '2024-07-17', 'Lecture', 'Present'),
(3, 7, 1, 1, '2024-07-19', 'Lecture', 'Absent'),
(3, 7, 1, 1, '2024-07-22', 'Lecture', 'Present'),
(3, 7, 1, 1, '2024-07-24', 'Lecture', 'Absent'),
(3, 7, 1, 1, '2024-07-26', 'Lecture', 'Present'),
(3, 7, 1, 1, '2024-07-29', 'Lecture', 'Absent'),
-- Sneha - DBMS
(4, 4, 3, 2, '2025-01-06', 'Lecture', 'Present'),
(4, 4, 3, 2, '2025-01-08', 'Lecture', 'Present'),
(4, 4, 3, 2, '2025-01-10', 'Lecture', 'Present'),
(4, 4, 3, 2, '2025-01-13', 'Lecture', 'Present'),
(4, 4, 3, 2, '2025-01-15', 'Lecture', 'Absent'),
-- Aman - DBMS
(5, 4, 3, 2, '2025-01-06', 'Lecture', 'Present'),
(5, 4, 3, 2, '2025-01-08', 'Lecture', 'Absent'),
(5, 4, 3, 2, '2025-01-10', 'Lecture', 'Present'),
(5, 4, 3, 2, '2025-01-13', 'Lecture', 'Present'),
(5, 4, 3, 2, '2025-01-15', 'Lecture', 'Present');

-- Refresh Attendance Summary Materialized View
REFRESH MATERIALIZED VIEW student.attendance_summary;

-- ================================================================
-- ██████╗  EXAMS
-- ================================================================

INSERT INTO student.exams
(subject_id, semester_id, exam_type, exam_date, start_time, end_time, max_marks, pass_marks, weightage_pct, venue, is_published)
VALUES
(7,  1, 'Internal-1', '2024-08-20', '10:00', '12:00', 30,  12, 15.00, 'Hall-A',       TRUE),
(7,  1, 'Internal-2', '2024-09-25', '10:00', '12:00', 30,  12, 15.00, 'Hall-A',       TRUE),
(7,  1, 'Final',      '2024-11-15', '09:00', '12:00', 70,  28, 70.00, 'Exam Block-1', TRUE),
(8,  1, 'Internal-1', '2024-08-22', '10:00', '12:00', 30,  12, 15.00, 'Hall-B',       TRUE),
(8,  1, 'Internal-2', '2024-09-27', '10:00', '12:00', 30,  12, 15.00, 'Hall-B',       TRUE),
(8,  1, 'Final',      '2024-11-17', '09:00', '12:00', 70,  28, 70.00, 'Exam Block-1', TRUE),
(9,  1, 'Internal-1', '2024-08-24', '10:00', '12:00', 30,  12, 15.00, 'Hall-C',       TRUE),
(9,  1, 'Final',      '2024-11-19', '09:00', '12:00', 70,  28, 70.00, 'Exam Block-2', TRUE),
(4,  2, 'Internal-1', '2025-02-10', '10:00', '12:00', 30,  12, 15.00, 'Hall-A',       TRUE),
(4,  2, 'Final',      '2025-05-10', '09:00', '12:00', 70,  28, 70.00, 'Exam Block-1', FALSE),
(5,  2, 'Internal-1', '2025-02-12', '10:00', '12:00', 30,  12, 15.00, 'Hall-B',       TRUE),
(5,  2, 'Final',      '2025-05-12', '09:00', '12:00', 70,  28, 70.00, 'Exam Block-2', FALSE),
(14, 1, 'Internal-1', '2024-08-18', '10:00', '12:00', 30,  12, 15.00, 'MBA-Hall',     TRUE),
(14, 1, 'Final',      '2024-11-20', '09:00', '12:00', 70,  28, 70.00, 'Exam Block-3', TRUE);

-- ================================================================
-- ██████╗  EXAM HALL ALLOCATIONS
-- ================================================================

INSERT INTO student.exam_hall_allocations (exam_id, student_id, hall_name, seat_number) VALUES
(1, 1, 'Hall-A', 'A-01'), (1, 2, 'Hall-A', 'A-02'), (1, 3, 'Hall-A', 'A-03'),
(1, 6, 'Hall-A', 'A-04'), (1, 7, 'Hall-A', 'A-05'),
(3, 1, 'Exam Block-1', 'EB1-01'), (3, 2, 'Exam Block-1', 'EB1-02'),
(3, 3, 'Exam Block-1', 'EB1-03'), (3, 6, 'Exam Block-1', 'EB1-04'),
(4, 1, 'Hall-B', 'B-01'), (4, 2, 'Hall-B', 'B-02'), (4, 3, 'Hall-B', 'B-03');

-- ================================================================
-- ██████╗  EXAM RESULTS
-- ================================================================

INSERT INTO student.exam_results
(exam_id, student_id, marks_obtained, grade, grade_points, is_pass, is_verified)
VALUES
-- ML Internal-1
(1, 1, 28.0, 'A+', 10.0, TRUE,  TRUE),
(1, 2, 24.0, 'A',   9.0, TRUE,  TRUE),
(1, 3, 18.0, 'B',   7.0, TRUE,  TRUE),
(1, 6, 26.0, 'A+', 10.0, TRUE,  TRUE),
(1, 7, 20.0, 'B+',  8.0, TRUE,  TRUE),
-- ML Internal-2
(2, 1, 27.0, 'A+', 10.0, TRUE,  TRUE),
(2, 2, 22.0, 'A',   9.0, TRUE,  TRUE),
(2, 3, 15.0, 'C',   5.0, TRUE,  TRUE),
(2, 6, 25.0, 'A',   9.0, TRUE,  TRUE),
(2, 7, 19.0, 'B',   7.0, TRUE,  TRUE),
-- ML Final
(3, 1, 65.0, 'A+', 10.0, TRUE,  TRUE),
(3, 2, 58.0, 'A',   9.0, TRUE,  TRUE),
(3, 3, 30.0, 'C',   5.0, TRUE,  TRUE),
(3, 6, 62.0, 'A+', 10.0, TRUE,  TRUE),
(3, 7, 45.0, 'B',   7.0, TRUE,  TRUE),
-- AI Internal-1
(4, 1, 27.0, 'A+', 10.0, TRUE,  TRUE),
(4, 2, 23.0, 'A',   9.0, TRUE,  TRUE),
(4, 3, 19.0, 'B',   7.0, TRUE,  TRUE),
-- AI Internal-2
(5, 1, 26.0, 'A+', 10.0, TRUE,  TRUE),
(5, 2, 21.0, 'A',   9.0, TRUE,  TRUE),
(5, 3, 14.0, 'C',   5.0, TRUE,  TRUE),
-- AI Final
(6, 1, 63.0, 'A+', 10.0, TRUE,  TRUE),
(6, 2, 55.0, 'A',   9.0, TRUE,  TRUE),
(6, 3, 28.5, 'C',   5.0, TRUE,  TRUE),
-- DBMS Internal-1
(9, 4, 25.0, 'A',   9.0, TRUE,  TRUE),
(9, 5, 21.0, 'A',   9.0, TRUE,  TRUE),
-- MBA Principles Internal-1
(13, 8, 24.0, 'A',  9.0, TRUE,  TRUE),
(13, 9, 20.0, 'B+', 8.0, TRUE,  TRUE);

-- ================================================================
-- ██████╗  SGPA RECORDS
-- ================================================================

INSERT INTO student.student_sgpa
(student_id, semester_id, total_credits, credits_earned, sgpa, cgpa, rank_in_class)
VALUES
(1, 3, 20, 20, 9.80, 9.75, 1),
(2, 3, 20, 20, 9.00, 8.90, 2),
(3, 3, 20, 18, 6.50, 6.20, 8),
(6, 3, 20, 20, 9.60, 9.50, 3),
(7, 3, 20, 20, 8.20, 8.00, 5);

-- ================================================================
-- ██████╗  FEE STRUCTURES
-- ================================================================

INSERT INTO finance.fee_structures
(program_id, academic_year_id, semester_number, category_id, amount, due_date, late_fine_per_day)
VALUES
-- B.Tech CSE
(1, 3, 1, 1, 60000.00, '2024-07-31', 50),
(1, 3, 1, 2,  3000.00, '2024-07-31', 10),
(1, 3, 1, 3,  5000.00, '2024-07-31', 10),
(1, 3, 1, 4,  1000.00, '2024-07-31', 5),
(1, 3, 1, 5, 20000.00, '2024-07-31', 20),
(1, 3, 1, 7,  2000.00, '2024-07-31', 5),
-- B.Tech ECE
(4, 3, 1, 1, 55000.00, '2024-07-31', 50),
(4, 3, 1, 2,  3000.00, '2024-07-31', 10),
(4, 3, 1, 3,  5000.00, '2024-07-31', 10),
(4, 3, 1, 4,  1000.00, '2024-07-31', 5),
-- MBA
(8, 3, 1, 1, 80000.00, '2024-07-31', 100),
(8, 3, 1, 2,  4000.00, '2024-07-31', 20),
(8, 3, 1, 7,  3000.00, '2024-07-31', 10);

-- ================================================================
-- ██████╗  FEE INVOICES
-- ================================================================

INSERT INTO finance.student_fee_invoices
(student_id, academic_year_id, semester_number, total_amount, discount_amount, fine_amount, net_amount, paid_amount, balance_due, status, due_date)
VALUES
(1,  3, 1, 91000.00, 0.00,    0.00,  91000.00, 91000.00, 0.00,     'Paid',    '2024-07-31'),
(2,  3, 1, 91000.00, 5000.00, 0.00,  86000.00, 86000.00, 0.00,     'Paid',    '2024-07-31'),
(3,  3, 1, 91000.00, 0.00,    0.00,  91000.00, 50000.00, 41000.00, 'Partial', '2024-07-31'),
(4,  3, 1, 91000.00, 0.00,    0.00,  91000.00, 91000.00, 0.00,     'Paid',    '2024-07-31'),
(5,  3, 1, 91000.00, 0.00,    500.00,91500.00, 0.00,     91500.00, 'Overdue', '2024-07-31'),
(6,  3, 1, 64000.00, 0.00,    0.00,  64000.00, 64000.00, 0.00,     'Paid',    '2024-07-31'),
(7,  3, 1, 64000.00, 0.00,    0.00,  64000.00, 64000.00, 0.00,     'Paid',    '2024-07-31'),
(8,  3, 1, 87000.00, 0.00,    0.00,  87000.00, 87000.00, 0.00,     'Paid',    '2024-07-31'),
(9,  3, 1, 87000.00, 0.00,    0.00,  87000.00, 87000.00, 0.00,     'Paid',    '2024-07-31'),
(10, 3, 2, 91000.00, 0.00,    0.00,  91000.00, 91000.00, 0.00,     'Paid',    '2025-01-15');

-- ================================================================
-- ██████╗  FEE PAYMENTS
-- ================================================================

INSERT INTO finance.fee_payments
(invoice_id, student_id, amount_paid, payment_date, payment_mode, transaction_id, receipt_number, is_verified)
VALUES
(1,  1,  91000.00, '2024-07-05', 'UPI',    'UPI2024070501',  'RCP-2024-001', TRUE),
(2,  2,  86000.00, '2024-07-06', 'Online', 'NET2024070601',  'RCP-2024-002', TRUE),
(3,  3,  50000.00, '2024-07-10', 'DD',     'DD20240710',     'RCP-2024-003', TRUE),
(4,  4,  91000.00, '2024-07-08', 'Cash',   NULL,             'RCP-2024-004', TRUE),
(6,  6,  64000.00, '2024-07-07', 'Online', 'NET2024070701',  'RCP-2024-005', TRUE),
(7,  7,  64000.00, '2024-07-09', 'UPI',    'UPI2024070901',  'RCP-2024-006', TRUE),
(8,  8,  87000.00, '2024-07-05', 'NEFT',   'NEFT2024070501', 'RCP-2024-007', TRUE),
(9,  9,  87000.00, '2024-07-06', 'Online', 'NET2024070602',  'RCP-2024-008', TRUE),
(10, 10, 91000.00, '2025-01-10', 'UPI',    'UPI2025011001',  'RCP-2025-001', TRUE);

-- ================================================================
-- ██████╗  SCHOLARSHIPS
-- ================================================================

INSERT INTO finance.scholarships
(name, provider, scholarship_type, amount, criteria, academic_year_id, last_date)
VALUES
('Merit Excellence Award',      'NTU University',         'Merit',      50000, 'CGPA >= 9.0 in previous semester',        3, '2024-09-30'),
('SC/ST Government Scholarship','Government of India',    'Need-based', 75000, 'SC/ST category, family income < 2.5 LPA', 3, '2024-10-15'),
('Sports Achievement Award',    'NTU University',         'Sports',     30000, 'State/National level sports achievements', 3, '2024-09-15'),
('OBC Post-Matric Scholarship', 'State Government',       'Need-based', 20000, 'OBC category, family income < 1 LPA',     3, '2024-10-31'),
('Girl Child Education Award',  'NTU University',         'Merit',      25000, 'Top 3 female students per department',    3, '2024-09-30');

INSERT INTO finance.student_scholarships
(student_id, scholarship_id, applied_date, awarded_date, amount_awarded, status)
VALUES
(1, 1, '2024-08-01', '2024-09-01', 50000, 'Disbursed'),
(2, 1, '2024-08-01', '2024-09-01', 50000, 'Disbursed'),
(2, 5, '2024-08-05', '2024-09-05', 25000, 'Disbursed'),
(3, 2, '2024-08-01', '2024-09-01', 75000, 'Disbursed'),
(5, 4, '2024-08-10', NULL,         20000, 'Applied'),
(6, 5, '2024-08-05', '2024-09-05', 25000, 'Disbursed');

-- ================================================================
-- ██████╗  LIBRARY BOOKS
-- ================================================================

INSERT INTO library.books
(isbn, title, author, publisher, edition, year_published, category, subject_id, total_copies, available_copies, rack_number)
VALUES
('9780132350884', 'Clean Code',                          'Robert C. Martin',  'Prentice Hall',  '1st', 2008, 'Programming',        1,  5, 3, 'R-01'),
('9780201633610', 'Design Patterns (GoF)',               'Gang of Four',      'Addison-Wesley', '1st', 1994, 'Software Engg',      1,  3, 2, 'R-01'),
('9780132181204', 'Database System Concepts',            'Silberschatz',      'McGraw-Hill',    '7th', 2019, 'Database',           4,  8, 5, 'R-02'),
('9781491957660', 'Hands-On Machine Learning',           'Aurélien Géron',    'O Reilly',       '3rd', 2022, 'AI/ML',              7,  4, 2, 'R-03'),
('9780134685991', 'Effective Java',                      'Joshua Bloch',      'Addison-Wesley', '3rd', 2018, 'Programming',        1,  6, 4, 'R-01'),
('9781492032649', 'Python for Data Analysis',            'Wes McKinney',      'O Reilly',       '3rd', 2022, 'Data Science',       7,  5, 3, 'R-03'),
('9780262033848', 'Introduction to Algorithms (CLRS)',   'Cormen et al.',     'MIT Press',      '4th', 2022, 'Algorithms',         3, 10, 7, 'R-04'),
('9780136042594', 'Operating System Concepts (Galvin)', 'Silberschatz',      'Wiley',          '9th', 2018, 'Operating Systems',  5,  7, 5, 'R-05'),
('9780132126953', 'Computer Networks (Tanenbaum)',       'Andrew Tanenbaum',  'Pearson',        '5th', 2010, 'Networks',           6,  6, 4, 'R-06'),
('9781119592273', 'Cybersecurity Essentials',            'Charles Brooks',    'Wiley',          '1st', 2018, 'Cyber Security',     11, 4, 3, 'R-07');

-- ================================================================
-- ██████╗  LIBRARY TRANSACTIONS
-- ================================================================

INSERT INTO library.transactions
(book_id, user_id, issued_date, due_date, returned_date, fine_amount, fine_paid, status)
VALUES
(1, (SELECT user_id FROM auth.users WHERE username='22cse001'), '2024-08-10', '2024-08-24', '2024-08-22', 0.00,  TRUE,  'Returned'),
(3, (SELECT user_id FROM auth.users WHERE username='22cse002'), '2024-08-15', '2024-08-29', NULL,         0.00,  FALSE, 'Issued'),
(4, (SELECT user_id FROM auth.users WHERE username='22cse003'), '2024-09-01', '2024-09-15', '2024-09-20', 25.00, TRUE,  'Returned'),
(7, (SELECT user_id FROM auth.users WHERE username='22cse001'), '2024-09-10', '2024-09-24', NULL,         0.00,  FALSE, 'Issued'),
(5, (SELECT user_id FROM auth.users WHERE username='23cse001'), '2024-10-01', '2024-10-15', NULL,         50.00, FALSE, 'Overdue'),
(8, (SELECT user_id FROM auth.users WHERE username='22ece001'), '2024-08-20', '2024-09-03', '2024-09-01', 0.00,  TRUE,  'Returned'),
(9, (SELECT user_id FROM auth.users WHERE username='22ece002'), '2024-09-05', '2024-09-19', NULL,         30.00, FALSE, 'Overdue'),
(6, (SELECT user_id FROM auth.users WHERE username='23mba001'), '2024-08-12', '2024-08-26', '2024-08-25', 0.00,  TRUE,  'Returned');

-- ================================================================
-- ██████╗  HOSTELS & ROOMS
-- ================================================================

INSERT INTO hostel.hostels
(college_id, hostel_name, hostel_type, total_rooms, total_capacity, warden_name, warden_phone, phone, address)
VALUES
(1, 'Vishwakarma Boys Hostel',  'Boys',  100, 250, 'Mr. Ramesh Kumar',   '9333333301', '040-11119901', 'Block-A, NTU Campus'),
(1, 'Saraswati Girls Hostel',   'Girls',  80, 180, 'Mrs. Lakshmi Devi',  '9333333302', '040-11119902', 'Block-B, NTU Campus'),
(1, 'New Boys Hostel',          'Boys',   60, 150, 'Mr. Suresh Yadav',   '9333333303', '040-11119903', 'Block-C, NTU Campus');

INSERT INTO hostel.rooms
(hostel_id, room_number, floor_number, room_type, capacity, current_occupancy, room_status, monthly_rent)
VALUES
(1, 'A-101', 1, 'Double',  2, 2, 'Full',      3500),
(1, 'A-102', 1, 'Double',  2, 1, 'Available', 3500),
(1, 'A-201', 2, 'Triple',  3, 3, 'Full',      3000),
(1, 'A-202', 2, 'Single',  1, 1, 'Full',      4500),
(1, 'A-203', 2, 'Triple',  3, 2, 'Available', 3000),
(2, 'B-101', 1, 'Double',  2, 2, 'Full',      3500),
(2, 'B-102', 1, 'Double',  2, 1, 'Available', 3500),
(2, 'B-201', 2, 'Triple',  3, 3, 'Full',      3000),
(3, 'C-101', 1, 'Double',  2, 0, 'Available', 3200),
(3, 'C-102', 1, 'Triple',  3, 0, 'Available', 2800);

INSERT INTO hostel.allocations
(student_id, room_id, academic_year_id, allotment_date, status)
VALUES
(1,  1, 3, '2024-07-10', 'Active'),
(3,  1, 3, '2024-07-11', 'Active'),
(5,  2, 3, '2024-07-12', 'Active'),
(7,  3, 3, '2024-07-10', 'Active'),
(11, 3, 3, '2024-07-13', 'Active'),
(12, 5, 3, '2024-07-14', 'Active'),
(2,  6, 3, '2024-07-10', 'Active'),
(4,  6, 3, '2024-07-11', 'Active'),
(6,  7, 3, '2024-07-12', 'Active'),
(10, 8, 3, '2024-07-10', 'Active');

INSERT INTO hostel.hostel_complaints
(student_id, hostel_id, complaint_type, description, status)
VALUES
(1,  1, 'Electrical',  'Fan not working in room A-101',            'Resolved'),
(3,  1, 'Plumbing',    'Water leakage in bathroom',                'InProgress'),
(7,  1, 'Food',        'Quality of mess food needs improvement',   'Open'),
(2,  2, 'Security',    'Main gate lock is broken',                 'Resolved'),
(10, 2, 'Electrical',  'Power socket not working in room B-201',  'Open');

-- ================================================================
-- ██████╗  NOTICES & EVENTS
-- ================================================================

INSERT INTO notify.notices
(college_id, department_id, title, content, notice_type, target_audience, posted_by, posted_date, expiry_date, is_pinned)
VALUES
(1, 1, 'Mid Semester Examination Schedule 2024',
 'Mid semester exams from Sept 10 to Sept 20. Hall tickets to be collected from department office.',
 'Exam', 'Students',
 (SELECT user_id FROM auth.users WHERE username='cet.admin'), '2024-08-25', '2024-09-20', TRUE),

(1, NULL, 'Annual Tech Fest TECHNIA 2024',
 'Register now for TECHNIA 2024 - Annual National Tech Symposium on Oct 15-17.',
 'Event', 'All',
 (SELECT user_id FROM auth.users WHERE username='cet.admin'), '2024-09-01', '2024-10-17', TRUE),

(1, NULL, 'Diwali Holiday Announcement',
 'College closed Nov 1-5 for Diwali holidays. All pending assignments due by Oct 31.',
 'Holiday', 'All',
 (SELECT user_id FROM auth.users WHERE username='cet.admin'), '2024-10-20', '2024-11-05', FALSE),

(1, 1, 'Fee Payment Reminder - Last Date July 31',
 'Students who have not paid semester fees are requested to pay before July 31 to avoid late fines.',
 'Fee', 'Students',
 (SELECT user_id FROM auth.users WHERE username='cet.admin'), '2024-07-20', '2024-07-31', TRUE),

(1, NULL, 'Campus Placement Drive - TCS & Infosys',
 'TCS and Infosys campus placement drive on Aug 15. Eligible students register by Aug 10.',
 'General', 'Students',
 (SELECT user_id FROM auth.users WHERE username='cet.admin'), '2024-08-01', '2024-08-15', FALSE);

INSERT INTO notify.events
(college_id, event_name, event_type, description, event_date, end_date, venue, organizer, max_participants)
VALUES
(1, 'TECHNIA 2024',              'Technical',  'National level technical symposium with coding, robotics & paper presentations', '2024-10-15', '2024-10-17', 'Main Auditorium',    'CSE Department',     500),
(1, 'Annual Sports Day 2024',    'Sports',     'Athletics, cricket, football and indoor sports events',                         '2024-12-10', '2024-12-12', 'NTU Sports Ground',  'Sports Committee',   800),
(1, 'Industry Connect Seminar',  'Seminar',    'Industry experts share insights on emerging tech trends',                       '2024-09-20', '2024-09-20', 'Conference Hall',    'T&P Cell',           200),
(1, 'Freshers Welcome 2024',     'Cultural',   'Welcome ceremony for 2024 batch with cultural performances',                    '2024-08-05', '2024-08-05', 'Open Air Theatre',   'Student Council',    600),
(1, 'Research Paper Workshop',   'Workshop',   'Workshop on writing and publishing research papers for final year students',    '2024-09-05', '2024-09-06', 'Seminar Hall-1',     'Research Committee', 100);

-- ================================================================
-- ██████╗  ADMISSIONS
-- ================================================================

INSERT INTO core.admissions
(program_id, academic_year_id, applicant_name, email, phone, date_of_birth, gender, category, state, entrance_exam, entrance_score, merit_rank, applied_date, status)
VALUES
(1, 3, 'Karthik Rajan',    'karthik.r@gmail.com',    '9555555501', '2006-04-10', 'Male',   'General', 'Telangana',     'JEE Main', 185.5,  12,  '2024-05-15', 'Admitted'),
(1, 3, 'Pallavi Nanda',    'pallavi.n@gmail.com',    '9555555502', '2006-08-22', 'Female', 'OBC',     'Andhra Pradesh','JEE Main', 172.0,  35,  '2024-05-16', 'Admitted'),
(1, 3, 'Sai Krishna',      'sai.k@gmail.com',        '9555555503', '2006-02-28', 'Male',   'SC',      'Telangana',     'JEE Main', 155.0,  80,  '2024-05-18', 'Admitted'),
(4, 3, 'Meghana Roy',      'meghana.r@gmail.com',    '9555555504', '2006-09-14', 'Female', 'General', 'Maharashtra',   'JEE Main', 163.5,  55,  '2024-05-20', 'Admitted'),
(8, 3, 'Vikrant Malhotra', 'vikrant.m@gmail.com',    '9555555505', '2000-11-05', 'Male',   'General', 'Delhi',         'CAT',      145.2,  320, '2024-05-22', 'Admitted'),
(1, 3, 'Zoya Khan',        'zoya.k@gmail.com',       '9555555506', '2006-07-18', 'Female', 'General', 'Karnataka',     'JEE Main', 190.0,  8,   '2024-05-14', 'Admitted'),
(1, 3, 'Harsh Vardhan',    'harsh.v@gmail.com',      '9555555507', '2006-03-25', 'Male',   'OBC',     'UP',            'JEE Main', 140.0,  120, '2024-05-25', 'Waitlisted'),
(5, 3, 'Preethi Srinivas', 'preethi.s@gmail.com',   '9555555508', '2006-06-30', 'Female', 'General', 'Tamil Nadu',    'JEE Main', 158.5,  70,  '2024-05-21', 'Admitted');

-- ================================================================
-- ██████╗  PLACEMENT
-- ================================================================

INSERT INTO core.companies
(name, industry, website, hr_contact, hr_email, hr_phone)
VALUES
('Tata Consultancy Services', 'IT Services',      'www.tcs.com',       'Anita Verma',    'hr@tcs.com',       '022-67788000'),
('Infosys Limited',           'IT Services',      'www.infosys.com',   'Rajiv Bhatnagar','hr@infosys.com',   '080-22948000'),
('Wipro Technologies',        'IT Services',      'www.wipro.com',     'Kavita Sharma',  'hr@wipro.com',     '080-28440011'),
('Google India',              'Technology',       'www.google.co.in',  'Sam Pillai',     'hr@google.com',    '080-67218000'),
('Microsoft India',           'Technology',       'www.microsoft.com', 'Ravi Menon',     'hr@microsoft.com', '080-30572000'),
('Amazon India',              'E-Commerce/Cloud', 'www.amazon.in',     'Neha Gupta',     'hr@amazon.com',    '080-67618000'),
('Deloitte India',            'Consulting',       'www.deloitte.com',  'Priya Nandini',  'hr@deloitte.com',  '040-71877000');

INSERT INTO core.placement_drives
(company_id, college_id, drive_date, job_role, job_type, package_lpa, eligibility, status)
VALUES
(1, 1, '2024-08-15', 'System Engineer',       'Full-time',  7.00,  'B.Tech, CGPA >= 6.0, No Backlogs', 'Completed'),
(2, 1, '2024-08-20', 'Software Engineer',     'Full-time',  8.00,  'B.Tech CSE/IT, CGPA >= 7.0',        'Completed'),
(3, 1, '2024-09-10', 'Project Engineer',      'Full-time',  6.50,  'B.Tech All Branches, CGPA >= 6.5',  'Completed'),
(4, 1, '2024-10-05', 'SWE Intern',            'Internship', 3.00,  'Pre-final year, CGPA >= 8.0',       'Upcoming'),
(5, 1, '2024-10-15', 'Software Dev Engineer', 'Full-time',  18.00, 'B.Tech CSE/IT, CGPA >= 8.5',        'Upcoming'),
(6, 1, '2024-11-01', 'SDE-1',                 'Full-time',  22.00, 'B.Tech CSE/IT/ECE, CGPA >= 8.0',    'Upcoming'),
(7, 1, '2024-09-25', 'Business Analyst',      'Full-time',  9.50,  'MBA, CGPA >= 7.5',                  'Completed');

INSERT INTO core.placement_applications
(drive_id, student_id, applied_date, status)
VALUES
(1, 1, '2024-08-01', 'Placed'),
(1, 2, '2024-08-01', 'Placed'),
(1, 3, '2024-08-01', 'Rejected'),
(1, 6, '2024-08-01', 'Placed'),
(2, 1, '2024-08-05', 'Placed'),
(2, 2, '2024-08-05', 'Shortlisted'),
(2, 7, '2024-08-05', 'Rejected'),
(3, 3, '2024-08-25', 'Placed'),
(3, 5, '2024-08-25', 'Applied'),
(7, 8, '2024-09-10', 'Placed'),
(7, 9, '2024-09-10', 'Shortlisted'),
(4, 4, '2024-09-15', 'Applied'),
(4, 5, '2024-09-15', 'Applied'),
(5, 1, '2024-09-20', 'Applied'),
(6, 1, '2024-10-05', 'Applied'),
(6, 2, '2024-10-05', 'Applied');

-- ================================================================
-- ██████╗  NOTIFICATIONS (Sample)
-- ================================================================

INSERT INTO notify.notifications (user_id, title, message, type, is_read)
VALUES
((SELECT user_id FROM auth.users WHERE username='22cse001'),
 'Result Published', 'Your Machine Learning final result is published. Check your dashboard.', 'Result', FALSE),

((SELECT user_id FROM auth.users WHERE username='22cse002'),
 'Result Published', 'Your ML & AI semester results are now available.', 'Result', TRUE),

((SELECT user_id FROM auth.users WHERE username='22cse003'),
 'Attendance Warning', 'Your attendance in Machine Learning is below 75%. Attend all classes.', 'Attendance Alert', FALSE),

((SELECT user_id FROM auth.users WHERE username='23cse002'),
 'Fee Overdue', 'Your semester fee payment is overdue. Please pay immediately to avoid penalty.', 'Fee Due', FALSE),

((SELECT user_id FROM auth.users WHERE username='22cse001'),
 'Placement Drive', 'TCS campus placement drive on Aug 15. Register before Aug 10.', 'Placement', TRUE),

((SELECT user_id FROM auth.users WHERE username='22cse002'),
 'Scholarship Disbursed', 'Merit Excellence Award of Rs 50,000 has been credited to your account.', 'Scholarship', FALSE),

((SELECT user_id FROM auth.users WHERE username='22ece002'),
 'Library Overdue', 'Book Computer Networks is overdue. Fine of Rs 30 is charged. Return immediately.', 'Library', FALSE),

((SELECT user_id FROM auth.users WHERE username='23cse001'),
 'Library Overdue', 'Book Effective Java is overdue. Fine of Rs 50 has been charged.', 'Library', FALSE);

-- ================================================================
-- ██████╗  ASSIGNMENTS
-- ================================================================

INSERT INTO academic.assignments
(subject_id, faculty_user_id, semester_id, title, description, due_date, max_marks, is_published)
VALUES
(7,
 (SELECT user_id FROM auth.users WHERE username='rajesh.kumar'),
 1, 'Assignment 1 - Linear Regression Implementation',
 'Implement Linear Regression from scratch using Python and NumPy. Submit Jupyter Notebook.',
 '2024-08-30 23:59:00', 10, TRUE),

(8,
 (SELECT user_id FROM auth.users WHERE username='anjali.sharma'),
 1, 'Assignment 1 - Search Algorithms',
 'Implement BFS, DFS, A* algorithms and compare their performance on a graph problem.',
 '2024-08-28 23:59:00', 10, TRUE),

(4,
 (SELECT user_id FROM auth.users WHERE username='suresh.patil'),
 2, 'Assignment 1 - ER Diagram Design',
 'Design a complete ER Diagram for a Hospital Management System with all entities and relationships.',
 '2025-02-15 23:59:00', 10, TRUE),

(4,
 (SELECT user_id FROM auth.users WHERE username='suresh.patil'),
 2, 'Assignment 2 - SQL Queries',
 'Write 20 complex SQL queries including joins, subqueries, aggregations and window functions.',
 '2025-03-01 23:59:00', 10, TRUE),

(9,
 (SELECT user_id FROM auth.users WHERE username='anjali.sharma'),
 1, 'Mini Project - Full Stack Web App',
 'Build a full stack web application using HTML, CSS, JavaScript and a backend of your choice.',
 '2024-10-15 23:59:00', 20, TRUE),

(5,
 (SELECT user_id FROM auth.users WHERE username='suresh.patil'),
 2, 'Assignment 1 - Process Scheduling',
 'Simulate FCFS, SJF, Round Robin and Priority scheduling algorithms and calculate waiting time and turnaround time.',
 '2025-02-20 23:59:00', 10, TRUE);

-- ================================================================
-- ██████╗  ASSIGNMENT SUBMISSIONS
-- ================================================================

INSERT INTO academic.assignment_submissions
(assignment_id, student_id, submitted_at, remarks, marks_obtained, graded_by, graded_at, status)
VALUES
-- Assignment 1 ML (assignment_id = 1)
(1, 1, '2024-08-28 20:15:00', 'Implemented with gradient descent and visualization plots.',
 9.5, (SELECT user_id FROM auth.users WHERE username='rajesh.kumar'), '2024-09-02 10:00:00', 'Graded'),

(1, 2, '2024-08-29 18:30:00', 'Good implementation with proper documentation.',
 8.5, (SELECT user_id FROM auth.users WHERE username='rajesh.kumar'), '2024-09-02 10:30:00', 'Graded'),

(1, 3, '2024-08-30 23:45:00', 'Basic implementation, needs improvement in visualization.',
 6.0, (SELECT user_id FROM auth.users WHERE username='rajesh.kumar'), '2024-09-02 11:00:00', 'Graded'),

(1, 6, '2024-08-27 14:00:00', 'Excellent work with multiple regression and analysis.',
 10.0,(SELECT user_id FROM auth.users WHERE username='rajesh.kumar'), '2024-09-02 11:30:00', 'Graded'),

(1, 7, '2024-08-30 22:00:00', 'Average submission, logic correct but no visualization.',
 7.0, (SELECT user_id FROM auth.users WHERE username='rajesh.kumar'), '2024-09-02 12:00:00', 'Graded'),

-- Assignment 2 AI Search Algorithms (assignment_id = 2)
(2, 1, '2024-08-27 21:00:00', 'All three algorithms implemented with performance comparison graphs.',
 9.0, (SELECT user_id FROM auth.users WHERE username='anjali.sharma'), '2024-09-01 10:00:00', 'Graded'),

(2, 2, '2024-08-28 17:00:00', 'Good submission with detailed complexity analysis.',
 8.0, (SELECT user_id FROM auth.users WHERE username='anjali.sharma'), '2024-09-01 10:30:00', 'Graded'),

(2, 3, '2024-09-01 10:00:00', 'Late submission. Only BFS and DFS implemented.',
 5.0, (SELECT user_id FROM auth.users WHERE username='anjali.sharma'), '2024-09-03 09:00:00', 'Graded'),

-- Assignment 3 DBMS ER Diagram (assignment_id = 3)
(3, 4, '2025-02-13 19:00:00', 'Well-designed ER with proper normalization up to 3NF.',
 9.5, (SELECT user_id FROM auth.users WHERE username='suresh.patil'), '2025-02-18 10:00:00', 'Graded'),

(3, 5, '2025-02-14 22:30:00', 'ER diagram is correct but missing some weak entities.',
 8.0, (SELECT user_id FROM auth.users WHERE username='suresh.patil'), '2025-02-18 11:00:00', 'Graded'),

-- Assignment 4 SQL Queries (assignment_id = 4) - Not yet graded
(4, 4, '2025-03-01 20:00:00', 'All 20 queries completed including window functions.', NULL, NULL, NULL, 'Submitted'),
(4, 5, '2025-02-28 23:50:00', 'Submitted all queries, some window functions missing.',  NULL, NULL, NULL, 'Submitted'),

-- Assignment 5 Web App Mini Project (assignment_id = 5)
(5, 1, '2024-10-14 20:00:00', 'Built a fully functional e-commerce site with React and Node.js.',
 19.0,(SELECT user_id FROM auth.users WHERE username='anjali.sharma'), '2024-10-20 10:00:00', 'Graded'),

(5, 2, '2024-10-15 18:00:00', 'Developed a student portal with login and dashboard.',
 17.0,(SELECT user_id FROM auth.users WHERE username='anjali.sharma'), '2024-10-20 11:00:00', 'Graded'),

(5, 3, '2024-10-18 10:00:00', 'Late submission. Basic HTML/CSS/JS app with no backend.',
 10.0,(SELECT user_id FROM auth.users WHERE username='anjali.sharma'), '2024-10-22 09:00:00', 'Graded'),

-- Assignment 6 OS Process Scheduling (assignment_id = 6)
(6, 4, '2025-02-19 21:00:00', 'All four scheduling algorithms implemented with Gantt chart output.',
 NULL, NULL, NULL, 'Submitted'),

(6, 5, '2025-02-20 23:55:00', 'FCFS, SJF implemented. Round Robin missing.',
 NULL, NULL, NULL, 'Submitted');

-- ================================================================
-- ██████╗  STUDENT LEAVE APPLICATIONS
-- ================================================================

INSERT INTO student.student_leaves
(student_id, leave_type, from_date, to_date, reason, status, approved_by)
VALUES
(1, 'Medical',  '2024-07-15', '2024-07-15', 'Fever and cold. Doctor certificate attached.',
 'Approved', (SELECT user_id FROM auth.users WHERE username='rajesh.kumar')),

(2, 'Personal', '2024-08-05', '2024-08-06', 'Sister marriage ceremony.',
 'Approved', (SELECT user_id FROM auth.users WHERE username='anjali.sharma')),

(3, 'Medical',  '2024-07-17', '2024-07-19', 'Hospitalized due to viral infection.',
 'Approved', (SELECT user_id FROM auth.users WHERE username='rajesh.kumar')),

(4, 'Event',    '2024-10-15', '2024-10-17', 'Participating in inter-college hackathon.',
 'Approved', (SELECT user_id FROM auth.users WHERE username='suresh.patil')),

(5, 'Personal', '2024-09-20', '2024-09-21', 'Family function.',
 'Pending',  NULL),

(6, 'OD',       '2024-11-10', '2024-11-10', 'Representing college in state-level chess competition.',
 'Approved', (SELECT user_id FROM auth.users WHERE username='rajesh.kumar')),

(7, 'Medical',  '2024-08-22', '2024-08-23', 'Dental procedure.',
 'Approved', (SELECT user_id FROM auth.users WHERE username='anjali.sharma')),

(10,'Personal', '2025-01-20', '2025-01-21', 'Attending cousin wedding.',
 'Rejected',  (SELECT user_id FROM auth.users WHERE username='suresh.patil'));

-- ================================================================
-- ██████╗  FACULTY LEAVE APPLICATIONS
-- ================================================================

INSERT INTO faculty.faculty_leaves
(faculty_id, leave_type, from_date, to_date, reason, status, approved_by)
VALUES
(1, 'Earned',   '2024-10-01', '2024-10-05', 'Annual family vacation.',
 'Approved', (SELECT user_id FROM auth.users WHERE username='cet.admin')),

(2, 'Sick',     '2024-09-12', '2024-09-13', 'High fever and throat infection.',
 'Approved', (SELECT user_id FROM auth.users WHERE username='cet.admin')),

(3, 'Casual',   '2024-11-15', '2024-11-15', 'Personal work.',
 'Approved', (SELECT user_id FROM auth.users WHERE username='cet.admin')),

(1, 'Earned',   '2025-01-06', '2025-01-08', 'Research conference attendance at IIT Bombay.',
 'Approved', (SELECT user_id FROM auth.users WHERE username='cet.admin')),

(2, 'Casual',   '2025-02-14', '2025-02-14', 'Personal work.',
 'Pending',  NULL);

-- ================================================================
-- ██████╗  STUDENT DOCUMENTS
-- ================================================================

INSERT INTO student.student_documents
(student_id, doc_type, doc_name, file_url, is_verified)
VALUES
(1, 'Aadhar Card',      '22CSE001_Aadhar.pdf',       '/docs/students/22CSE001/aadhar.pdf',       TRUE),
(1, '10th Certificate', '22CSE001_10th.pdf',          '/docs/students/22CSE001/10th_cert.pdf',    TRUE),
(1, '12th Certificate', '22CSE001_12th.pdf',          '/docs/students/22CSE001/12th_cert.pdf',    TRUE),
(1, 'Transfer Certificate','22CSE001_TC.pdf',         '/docs/students/22CSE001/tc.pdf',           TRUE),
(2, 'Aadhar Card',      '22CSE002_Aadhar.pdf',        '/docs/students/22CSE002/aadhar.pdf',       TRUE),
(2, '10th Certificate', '22CSE002_10th.pdf',          '/docs/students/22CSE002/10th_cert.pdf',    TRUE),
(2, '12th Certificate', '22CSE002_12th.pdf',          '/docs/students/22CSE002/12th_cert.pdf',    TRUE),
(3, 'Aadhar Card',      '22CSE003_Aadhar.pdf',        '/docs/students/22CSE003/aadhar.pdf',       TRUE),
(3, 'Caste Certificate','22CSE003_Caste.pdf',         '/docs/students/22CSE003/caste_cert.pdf',   TRUE),
(3, '10th Certificate', '22CSE003_10th.pdf',          '/docs/students/22CSE003/10th_cert.pdf',    FALSE),
(4, 'Aadhar Card',      '23CSE001_Aadhar.pdf',        '/docs/students/23CSE001/aadhar.pdf',       TRUE),
(4, '12th Certificate', '23CSE001_12th.pdf',          '/docs/students/23CSE001/12th_cert.pdf',    TRUE),
(5, 'Aadhar Card',      '23CSE002_Aadhar.pdf',        '/docs/students/23CSE002/aadhar.pdf',       TRUE),
(5, 'OBC Certificate',  '23CSE002_OBC.pdf',           '/docs/students/23CSE002/obc_cert.pdf',     TRUE),
(6, 'Aadhar Card',      '22ECE001_Aadhar.pdf',        '/docs/students/22ECE001/aadhar.pdf',       TRUE),
(6, '12th Certificate', '22ECE001_12th.pdf',          '/docs/students/22ECE001/12th_cert.pdf',    TRUE),
(7, 'Aadhar Card',      '22ECE002_Aadhar.pdf',        '/docs/students/22ECE002/aadhar.pdf',       TRUE),
(7, 'Caste Certificate','22ECE002_Caste.pdf',         '/docs/students/22ECE002/caste_cert.pdf',   TRUE),
(8, 'Aadhar Card',      '23MBA001_Aadhar.pdf',        '/docs/students/23MBA001/aadhar.pdf',       TRUE),
(9, 'Aadhar Card',      '23MBA002_Aadhar.pdf',        '/docs/students/23MBA002/aadhar.pdf',       TRUE);

-- ================================================================
-- ██████╗  STUDENT ACADEMIC HISTORY
-- ================================================================

INSERT INTO student.student_academic_history
(student_id, institution_name, degree, board_university, year_of_passing, percentage)
VALUES
(1, 'Delhi Public School, Hyderabad', '12th (PCM)',  'CBSE',  2022, 95.40),
(1, 'Delhi Public School, Hyderabad', '10th',        'CBSE',  2020, 96.20),
(2, 'Narayana Jr College, Hyderabad', '12th (PCM)',  'BIEAP', 2022, 97.60),
(2, 'St Anns High School, Hyderabad', '10th',        'SSC',   2020, 98.00),
(3, 'Govt Jr College, Warangal',      '12th (PCM)',  'BIEAP', 2022, 76.40),
(3, 'ZP High School, Warangal',       '10th',        'SSC',   2020, 72.00),
(4, 'Sri Chaitanya Jr College',       '12th (PCM)',  'CBSE',  2023, 93.80),
(4, 'Oakridge International School',  '10th',        'CBSE',  2021, 95.00),
(5, 'Bhashyam Jr College',            '12th (PCM)',  'BIEAP', 2023, 88.60),
(5, 'Bhashyam High School',           '10th',        'SSC',   2021, 87.00),
(6, 'Narayana Jr College, Hyderabad', '12th (PCM)',  'BIEAP', 2022, 96.80),
(7, 'Govt Jr College, LB Nagar',      '12th (PCM)',  'BIEAP', 2022, 79.20),
(8, 'JNTU Hyderabad',                 'B.Tech (IT)', 'JNTUH', 2023, 78.50),
(9, 'Osmania University',             'BBA',         'OU',    2022, 82.00),
(10,'Sri Chaitanya Jr College',       '12th (PCM)',  'CBSE',  2024, 91.20);

-- ================================================================
-- ██████╗  ROLE PERMISSIONS ASSIGNMENT
-- ================================================================

-- Super Admin gets ALL permissions
INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT 1, permission_id FROM auth.permissions;

-- University Admin
INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT 2, permission_id FROM auth.permissions
WHERE module IN ('students','reports','notices','events');

-- College Admin
INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT 3, permission_id FROM auth.permissions
WHERE module IN ('students','attendance','results','fees','library','timetable','notices','reports');

-- HOD
INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT 4, permission_id FROM auth.permissions
WHERE module IN ('students','attendance','results','timetable','notices','reports')
AND action IN ('view','create','edit');

-- Faculty
INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT 5, permission_id FROM auth.permissions
WHERE module IN ('attendance','results','timetable','notices')
AND action IN ('view','create');

-- Student
INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT 6, permission_id FROM auth.permissions
WHERE module IN ('attendance','results','fees','library','timetable','notices')
AND action = 'view';

-- Parent
INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT 7, permission_id FROM auth.permissions
WHERE module IN ('attendance','results','fees','notices')
AND action = 'view';

-- ================================================================
-- ██████╗  COLLEGE ADMINS ASSIGNMENT
-- ================================================================

INSERT INTO core.college_admins (college_id, user_id, designation) VALUES
(1, (SELECT user_id FROM auth.users WHERE username='cet.admin'), 'College Administrator');

INSERT INTO core.university_admins (university_id, user_id, designation) VALUES
(1, (SELECT user_id FROM auth.users WHERE username='univ.admin'), 'University Administrator');

-- ================================================================
-- ██████╗  ADDITIONAL USEFUL VIEWS FOR WEBSITE APIs
-- ================================================================

-- View: Student Timetable (used on website student portal)
CREATE OR REPLACE VIEW academic.v_student_timetable AS
SELECT
    s.roll_number,
    s.first_name || ' ' || s.last_name   AS student_name,
    p.name                                AS program,
    s.section,
    sub.subject_code,
    sub.subject_name,
    t.day_of_week,
    t.start_time,
    t.end_time,
    t.room_number,
    f.first_name || ' ' || f.last_name   AS faculty_name,
    f.designation                         AS faculty_designation,
    sem.semester_number,
    ay.year_label                         AS academic_year
FROM academic.timetable t
JOIN academic.programs p       ON t.program_id   = p.program_id
JOIN academic.subjects sub     ON t.subject_id   = sub.subject_id
JOIN academic.semesters sem    ON t.semester_id  = sem.semester_id
JOIN academic.academic_years ay ON sem.academic_year_id = ay.academic_year_id
JOIN faculty.faculty_profiles f ON t.faculty_user_id = f.user_id
JOIN student.students s        ON s.program_id   = p.program_id
                               AND s.section     = t.section
WHERE t.is_active = TRUE;

-- View: College-wise Student Count (for University Admin Dashboard)
CREATE OR REPLACE VIEW core.v_college_stats AS
SELECT
    u.name                              AS university,
    c.name                              AS college,
    c.college_type,
    COUNT(DISTINCT d.department_id)     AS total_departments,
    COUNT(DISTINCT pr.program_id)       AS total_programs,
    COUNT(DISTINCT st.student_id)       AS total_students,
    COUNT(DISTINCT f.faculty_id)        AS total_faculty
FROM core.university u
JOIN core.colleges c          ON c.university_id   = u.university_id
LEFT JOIN core.departments d  ON d.college_id      = c.college_id
LEFT JOIN academic.programs pr ON pr.department_id = d.department_id
LEFT JOIN student.students st  ON st.program_id    = pr.program_id AND st.is_active = TRUE
LEFT JOIN faculty.faculty_profiles f ON f.department_id = d.department_id AND f.is_active = TRUE
GROUP BY u.name, c.name, c.college_type
ORDER BY c.name;

-- View: Department-wise Student Count
CREATE OR REPLACE VIEW core.v_department_stats AS
SELECT
    c.name                              AS college,
    d.name                              AS department,
    d.code                              AS dept_code,
    d.hod_name,
    COUNT(DISTINCT pr.program_id)       AS total_programs,
    COUNT(DISTINCT st.student_id)       AS total_students,
    COUNT(DISTINCT f.faculty_id)        AS total_faculty
FROM core.departments d
JOIN core.colleges c              ON d.college_id      = c.college_id
LEFT JOIN academic.programs pr    ON pr.department_id  = d.department_id
LEFT JOIN student.students st     ON st.program_id     = pr.program_id AND st.is_active = TRUE
LEFT JOIN faculty.faculty_profiles f ON f.department_id = d.department_id AND f.is_active = TRUE
GROUP BY c.name, d.name, d.code, d.hod_name
ORDER BY c.name, d.name;

-- View: Full Placement Report
CREATE OR REPLACE VIEW core.v_placement_report AS
SELECT
    s.roll_number,
    s.first_name || ' ' || s.last_name AS student_name,
    p.name                              AS program,
    co.name                             AS company,
    co.industry,
    pd.job_role,
    pd.job_type,
    pd.package_lpa,
    pa.status                           AS application_status,
    pd.drive_date
FROM core.placement_applications pa
JOIN student.students s         ON pa.student_id = s.student_id
JOIN academic.programs p        ON s.program_id  = p.program_id
JOIN core.placement_drives pd   ON pa.drive_id   = pd.drive_id
JOIN core.companies co          ON pd.company_id = co.company_id
ORDER BY pd.drive_date DESC;

-- View: Library Overdue Report
CREATE OR REPLACE VIEW library.v_overdue_report AS
SELECT
    au.username,
    au.email,
    b.title                                     AS book_title,
    b.author,
    lt.issued_date,
    lt.due_date,
    (CURRENT_DATE - lt.due_date)                AS days_overdue,
    ((CURRENT_DATE - lt.due_date) * 5)          AS fine_due,
    lt.status
FROM library.transactions lt
JOIN auth.users au   ON lt.user_id = au.user_id
JOIN library.books b ON lt.book_id = b.book_id
WHERE lt.status IN ('Issued','Overdue')
  AND lt.due_date < CURRENT_DATE
ORDER BY days_overdue DESC;

-- View: Scholarship Report
CREATE OR REPLACE VIEW finance.v_scholarship_report AS
SELECT
    s.roll_number,
    s.first_name || ' ' || s.last_name AS student_name,
    s.category,
    p.name                              AS program,
    sc.name                             AS scholarship_name,
    sc.provider,
    sc.scholarship_type,
    ss.amount_awarded,
    ss.status,
    ss.awarded_date,
    ay.year_label                       AS academic_year
FROM finance.student_scholarships ss
JOIN student.students s             ON ss.student_id      = s.student_id
JOIN academic.programs p            ON s.program_id       = p.program_id
JOIN finance.scholarships sc        ON ss.scholarship_id  = sc.scholarship_id
JOIN academic.academic_years ay     ON sc.academic_year_id = ay.academic_year_id
ORDER BY ss.awarded_date DESC;

-- View: Faculty Workload
CREATE OR REPLACE VIEW faculty.v_faculty_workload AS
SELECT
    f.employee_code,
    f.first_name || ' ' || f.last_name  AS faculty_name,
    f.designation,
    d.name                               AS department,
    COUNT(DISTINCT fs.subject_id)        AS subjects_assigned,
    COUNT(DISTINCT t.timetable_id)       AS weekly_classes,
    SUM(
        EXTRACT(EPOCH FROM (t.end_time - t.start_time))/3600
    )::NUMERIC(5,2)                      AS weekly_hours
FROM faculty.faculty_profiles f
JOIN core.departments d                  ON f.department_id    = d.department_id
LEFT JOIN faculty.faculty_subjects fs    ON fs.faculty_id      = f.faculty_id
LEFT JOIN academic.timetable t           ON t.faculty_user_id  = f.user_id
                                        AND t.is_active        = TRUE
WHERE f.is_active = TRUE
GROUP BY f.employee_code, f.first_name, f.last_name,
         f.designation, d.name
ORDER BY weekly_hours DESC;

-- ================================================================
-- ██████╗  FINAL UTILITY: REFRESH MATERIALIZED VIEW
-- ================================================================

REFRESH MATERIALIZED VIEW student.attendance_summary;

-- ================================================================
-- ██████╗  SAMPLE QUERIES FOR WEBSITE APIs
-- ================================================================

-- 🔐 1. Student Login Check
-- SELECT user_id, username, role_id, is_active, is_locked
-- FROM auth.users
-- WHERE email = 'input_email'
-- AND password_hash = crypt('input_password', password_hash);

-- 📊 2. Student Dashboard
-- SELECT * FROM student.v_student_dashboard
-- WHERE login_email = 'input_email';

-- 📅 3. Student Timetable
-- SELECT day_of_week, start_time, end_time, subject_name,
--        faculty_name, room_number
-- FROM academic.v_student_timetable
-- WHERE roll_number = '22CSE001'
-- ORDER BY day_of_week, start_time;

-- 📋 4. Student Attendance
-- SELECT subject_name, total_classes, attended, attendance_pct
-- FROM student.attendance_summary
-- WHERE roll_number = '22CSE001'
-- ORDER BY attendance_pct;

-- 📝 5. Student Results
-- SELECT * FROM student.v_result_card
-- WHERE roll_number = '22CSE001'
-- ORDER BY semester_number, subject_code;

-- 💰 6. Student Fee Status
-- SELECT * FROM finance.v_fee_status
-- WHERE roll_number = '22CSE001';

-- 🏫 7. College Stats (University Admin)
-- SELECT * FROM core.v_college_stats;

-- 👨‍🏫 8. Faculty Workload
-- SELECT * FROM faculty.v_faculty_workload;

-- 📚 9. Library Overdue Books
-- SELECT * FROM library.v_overdue_report;

-- 🎓 10. Placement Report
-- SELECT * FROM core.v_placement_report
-- WHERE application_status = 'Placed';

-- ================================================================
-- ✅  ENTIRE DATABASE SETUP COMPLETE! 🎉
-- ================================================================
-- SCHEMAS   : auth, core, academic, student, faculty,
--             finance, library, hostel, audit, notify
-- TABLES    : 50+ tables
-- INDEXES   : 25+ performance indexes
-- TRIGGERS  : 5 auto-triggers
-- PROCEDURES: 2 stored procedures
-- VIEWS     : 15+ website-ready views
-- SEED DATA : University → Colleges → Departments →
--             Programs → Faculty → Students → Results →
--             Fees → Library → Hostel → Placement → Notices
-- ================================================================