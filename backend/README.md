university-erp/
│
├── university-erp-backend/
│   ├── main.go
│   ├── .env
│   ├── go.mod
│   ├── go.sum
│   └── internal/
│       ├── db/
│       │   ├── connect.go
│       │   ├── migrate.go
│       │   └── seed.go
│       ├── models/
│       │   └── models.go
│       ├── handlers/
│       │   ├── auth.go
│       │   ├── university.go
│       │   ├── application.go
│       │   ├── college.go
│       │   ├── student.go
│       │   ├── finance.go
│       │   ├── payment.go
│       │   └── registrar.go
│       ├── middleware/
│       │   └── auth.go
│       ├── routes/
│       │   └── routes.go
│       └── utils/
│           ├── jwt.go
│           ├── helpers.go
│           └── email.go
│
└── frontend/
    ├── .env
    ├── package.json
    ├── tailwind.config.js
    ├── postcss.config.js
    └── src/
        ├── index.tsx
        ├── index.css
        ├── App.tsx
        ├── types/
        │   └── index.ts
        ├── api/
        │   └── axios.ts
        ├── context/
        │   └── AuthContext.tsx
        ├── components/
        │   └── shared/
        │       ├── Layout.tsx
        │       ├── Sidebar.tsx
        │       ├── StatCard.tsx
        │       ├── StatusBadge.tsx
        │       ├── Modal.tsx
        │       ├── PageHeader.tsx
        │       └── LoadingSpinner.tsx
        └── pages/
            ├── Notifications.tsx
            ├── auth/
            │   ├── Login.tsx
            │   ├── Register.tsx
            │   ├── ForgotPassword.tsx
            │   └── ResetPassword.tsx
            ├── admin/
            │   ├── Dashboard.tsx
            │   ├── Users.tsx
            │   ├── Colleges.tsx
            │   └── Courses.tsx
            ├── finance/
            │   ├── Dashboard.tsx
            │   ├── FeeStructures.tsx
            │   └── Payments.tsx
            ├── registrar/
            │   ├── Dashboard.tsx
            │   ├── Exams.tsx
            │   └── Results.tsx
            ├── college/
            │   ├── Dashboard.tsx
            │   ├── Students.tsx
            │   ├── Applications.tsx
            │   ├── Courses.tsx
            │   └── Fees.tsx
            └── student/
                ├── Dashboard.tsx
                ├── Apply.tsx
                ├── Applications.tsx
                ├── Payments.tsx
                ├── Results.tsx
                └── Documents.tsx



university-erp-backend/
├── main.go
├── .env
├── go.mod
├── internal/
│   ├── db/
│   │   ├── connect.go
│   │   ├── migrate.go
│   │   └── seed.go
│   ├── models/
│   │   └── models.go
│   ├── handlers/
│   │   ├── auth.go
│   │   ├── university.go
│   │   ├── college.go
│   │   ├── student.go
│   │   ├── application.go
│   │   ├── finance.go
│   │   ├── registrar.go
│   │   └── payment.go
│   ├── middleware/
│   │   └── auth.go
│   ├── routes/
│   │   └── routes.go
│   └── utils/
│       ├── jwt.go
│       ├── email.go
│       └── helpers.go

---

📋 Complete API Reference
Method	Endpoint	Role	Description
POST	/api/v1/auth/login	All	Login
POST	/api/v1/auth/register	Public	Student register
POST	/api/v1/auth/forgot-password	Public	Forgot password
POST	/api/v1/auth/reset-password	Public	Reset password
GET	/api/v1/admin/dashboard	Univ Admin	Stats
POST	/api/v1/admin/users	Univ Admin	Create staff user
GET	/api/v1/admin/users	Univ Admin	List all users
PUT	/api/v1/admin/users/{id}/toggle	Univ Admin	Enable/disable user
POST	/api/v1/admin/colleges	Univ Admin	Create college
GET	/api/v1/finance/dashboard	Finance	Finance stats
POST	/api/v1/finance/fees	Finance	Create fee
GET	/api/v1/finance/fees	Finance	List fees
POST	/api/v1/registrar/exams	Registrar	Create exam
PUT	/api/v1/registrar/exams/{id}/publish	Registrar	Publish exam
POST	/api/v1/registrar/results	Registrar	Add result
PUT	/api/v1/registrar/results/{exam_id}/publish	Registrar	Publish results
GET	/api/v1/college/dashboard	College Admin	College stats
GET	/api/v1/college/students	College Admin	List students
POST	/api/v1/college/students	College Admin	Add student
PUT	/api/v1/college/applications/{id}/review	College Admin	Shortlist/Reject
PUT	/api/v1/college/applications/{id}/enroll	College Admin	Enroll + generate number
GET	/api/v1/student/dashboard	Student	Full dashboard
POST	/api/v1/student/applications	Student	Submit application
POST	/api/v1/student/payments/order	Student	Create Razorpay order
POST	/api/v1/student/payments/verify	Student	Verify payment
GET	/api/v1/student/results	Student	View results


---

# 🏛️ University ERP — Complete System Workflow (Frontend → Backend)

---

## 🗂️ SYSTEM OVERVIEW

```
┌─────────────────────────────────────────────────────────────────┐
│                     UNIVERSITY ERP SYSTEM                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│   FRONTEND (React + TypeScript)                                  │
│   ├── Port: 3000                                                 │
│   ├── Axios → API calls with JWT token                          │
│   └── Role-based routing (5 portals)                            │
│                                                                   │
│   BACKEND (Golang + Gorilla Mux)                                 │
│   ├── Port: 8080                                                 │
│   ├── JWT Authentication                                         │
│   ├── Role Middleware (5 roles)                                  │
│   └── REST API → /api/v1/...                                    │
│                                                                   │
│   DATABASE (PostgreSQL + GORM)                                   │
│   ├── Auto-migrated on startup                                   │
│   ├── 12 tables                                                  │
│   └── Seeded with dummy data                                     │
│                                                                   │
│   PAYMENTS (Razorpay)                                            │
│   └── Order → Checkout → Verify → Receipt                       │
│                                                                   │
│   EMAIL (SMTP)                                                   │
│   └── Welcome, Reset Password, Notifications                    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ DATABASE TABLES (12 Tables)

```
┌──────────────────────────────────────────────────────────────────────┐
│                        DATABASE SCHEMA                                │
│                                                                        │
│  users                          colleges                              │
│  ├── id                         ├── id                               │
│  ├── username (unique)          ├── name                             │
│  ├── email (unique)             ├── code (unique)                    │
│  ├── password (bcrypt)          ├── address                          │
│  ├── role                       ├── phone                            │
│  ├── phone                      ├── email                            │
│  ├── is_active                  └── is_active                        │
│  ├── last_login                                                       │
│  └── college_id (FK)           courses                               │
│                                 ├── id                               │
│  students                       ├── name                             │
│  ├── id                         ├── code                             │
│  ├── user_id (FK)               ├── college_id (FK)                 │
│  ├── college_id (FK)            ├── duration                         │
│  ├── course_id (FK)             ├── total_seats                      │
│  ├── enrollment_number          ├── filled_seats                     │
│  ├── status                     └── is_active                        │
│  ├── first_name                                                       │
│  ├── last_name                 applications                          │
│  ├── dob                        ├── id                               │
│  ├── gender                     ├── student_id (FK)                 │
│  ├── phone                      ├── course_id (FK)                  │
│  ├── address/city/state         ├── college_id (FK)                 │
│  ├── previous_school            ├── status                           │
│  ├── previous_grade             ├── personal info snapshot           │
│  ├── fee_paid                   ├── submitted_at                     │
│  └── enrollment_date            ├── shortlisted_at                  │
│                                 └── enrolled_at                      │
│  documents                                                            │
│  ├── id                        fee_structures                        │
│  ├── student_id (FK)            ├── id                               │
│  ├── application_id (FK)        ├── college_id (FK)                 │
│  ├── document_type              ├── course_id (FK)                  │
│  ├── file_url                   ├── name                             │
│  ├── is_verified                ├── fee_type                         │
│  └── verified_by                ├── amount                           │
│                                 ├── due_date                         │
│  payments                       └── academic_year                   │
│  ├── id                                                               │
│  ├── student_id (FK)           exams                                 │
│  ├── fee_structure_id (FK)      ├── id                               │
│  ├── razorpay_order_id          ├── name                             │
│  ├── razorpay_payment_id        ├── course_id (FK)                  │
│  ├── amount                     ├── college_id (FK)                 │
│  ├── status                     ├── exam_date                        │
│  └── paid_at                    ├── total_marks                      │
│                                 ├── passing_marks                    │
│  results                        └── is_published                    │
│  ├── id                                                               │
│  ├── exam_id (FK)              notifications                         │
│  ├── student_id (FK)            ├── id                               │
│  ├── marks_obtained             ├── user_id (FK)                    │
│  ├── grade                      ├── title                            │
│  ├── is_published               ├── message                          │
│  └── published_at               └── is_read                         │
│                                                                        │
│  password_reset_tokens                                                │
│  ├── id                                                               │
│  ├── user_id (FK)                                                    │
│  ├── token (unique)                                                  │
│  ├── expires_at                                                       │
│  └── is_used                                                         │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 👥 THE 5 ROLES & THEIR PORTALS

```
┌─────────────────────────────────────────────────────────┐
│                      5 ROLES                             │
├──────────────────────┬──────────────────────────────────┤
│ ROLE                 │ WHAT THEY CAN DO                 │
├──────────────────────┼──────────────────────────────────┤
│ university_admin     │ EVERYTHING - create users,       │
│                      │ colleges, courses, view all      │
│                      │ data across system               │
├──────────────────────┼──────────────────────────────────┤
│ finance_controller   │ Create fee structures,           │
│                      │ view all payments, finance       │
│                      │ dashboard, receipts              │
├──────────────────────┼──────────────────────────────────┤
│ registrar            │ Create/publish exams,            │
│                      │ add/publish results,             │
│                      │ registrar dashboard              │
├──────────────────────┼──────────────────────────────────┤
│ college_admin        │ Manage their college only -      │
│                      │ students, applications,          │
│                      │ documents, courses               │
├──────────────────────┼──────────────────────────────────┤
│ student              │ Apply, pay fees, view results,   │
│                      │ upload docs, track application   │
└──────────────────────┴──────────────────────────────────┘
```

---

## 🔐 WORKFLOW 1: AUTHENTICATION (All Roles)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    LOGIN FLOW (Same for ALL roles)                   │
└─────────────────────────────────────────────────────────────────────┘

FRONTEND                          BACKEND                    DATABASE
────────                          ───────                    ────────

User visits /login
User types email + password
Click "Login"
     │
     │  POST /api/v1/auth/login
     │  { email, password }
     ├─────────────────────────►
     │                          Check email in users table ──────────►
     │                          bcrypt.Compare(password)  ◄──────────
     │                          Generate JWT token
     │                          { user_id, email, role,
     │                            college_id, exp: 24h }
     │                          Update last_login
     ◄─────────────────────────┤
     │  { token, user: {        │
     │    id, role,             │
     │    college_id } }        │
     │                          │
Save token in localStorage
Read "role" from response
     │
     ├── university_admin  ──► /admin/dashboard
     ├── finance_controller ──► /finance/dashboard
     ├── registrar          ──► /registrar/dashboard
     ├── college_admin      ──► /college/dashboard
     └── student            ──► /student/dashboard


EVERY subsequent API call:
Headers: { Authorization: "Bearer <token>" }
                    │
                    ▼
         AuthMiddleware validates JWT
                    │
                    ▼
         RoleMiddleware checks role
                    │
                    ▼
              Handler runs


┌─────────────────────────────────────────────────────────┐
│                  FORGOT PASSWORD FLOW                    │
└─────────────────────────────────────────────────────────┘

User clicks "Forgot Password"
Enter email → POST /api/v1/auth/forgot-password
                    │
                    ▼
         Find user by email in DB
         Generate 32-byte random token
         Save to password_reset_tokens table
         { user_id, token, expires_at: +1hr }
         Send email with reset link:
         http://localhost:3000/reset-password?token=xxxxx
                    │
                    ▼
User gets email → clicks link
Frontend shows "New Password" form
POST /api/v1/auth/reset-password
{ token, new_password }
                    │
                    ▼
         Validate token (not expired, not used)
         bcrypt hash new password
         Update users.password
         Mark token as is_used = true
                    │
                    ▼
         ✅ Password reset! Redirect to login
```

---

## 📝 WORKFLOW 2: STUDENT REGISTRATION & APPLICATION

```
┌─────────────────────────────────────────────────────────────────────┐
│              COMPLETE STUDENT JOURNEY (End to End)                   │
└─────────────────────────────────────────────────────────────────────┘

STEP 1️⃣ : STUDENT REGISTERS
──────────────────────────────
Frontend: /register page
Fill: username, email, password, phone, first_name, last_name

POST /api/v1/auth/register
          │
          ▼
 Check duplicate email/username
 bcrypt hash password
 Create users record { role: "student" }
 Create students record {
   user_id, first_name, last_name,
   status: "applied"
 }
          │
          ▼
 ✅ Account created → Redirect to login


STEP 2️⃣ : BROWSE COLLEGES & COURSES
──────────────────────────────────────
Frontend: /courses page (PUBLIC - no login needed)

GET /api/v1/colleges  ──► Returns all colleges with courses
GET /api/v1/courses   ──► Returns all active courses

Student sees:
┌─────────────────────────────────┐
│  College of Engineering (COE)   │
│  ├── Computer Science (60 seats)│
│  ├── Electronics Eng (60 seats) │
│                                 │
│  College of Arts (CAS)          │
│  └── Bachelor of Arts (80 seats)│
└─────────────────────────────────┘


STEP 3️⃣ : FILL APPLICATION FORM
──────────────────────────────────
Student logs in → /student/apply

Fills form:
Personal Info: First Name, Last Name, DOB, Gender
Contact: Phone, Email, Address, City, State, PinCode
Academic: Previous School, Previous Grade (%)
Select: College + Course
Statement: Personal statement

POST /api/v1/student/applications
{
  course_id, college_id,
  first_name, last_name, dob, gender,
  phone, email, address, city, state, pin_code,
  previous_school, previous_grade,
  statement
}
          │
          ▼
 Find student by user_id
 Check: already applied for this course? → 409 error
 Create applications record {
   status: "submitted",
   submitted_at: now
 }
 Update students record with personal info
 Create notification: "Application Submitted"
          │
          ▼
 ✅ Application ID returned
 Student dashboard shows application status: "submitted"


STEP 4️⃣ : UPLOAD DOCUMENTS
──────────────────────────────
Student goes to /student/documents

POST /api/v1/student/documents
{
  application_id,
  document_type: "marksheet" | "id_proof" | "photo",
  file_name, file_url, file_size, mime_type
}
          │
          ▼
 Create documents record
 { student_id, application_id,
   is_verified: false }
          │
          ▼
 ✅ Document saved (pending verification)


APPLICATION STATUS TRACKER (Student can see this):
┌──────────────────────────────────────────────────────┐
│  Application #1 - Computer Science, COE              │
│                                                       │
│  ●──────●──────●──────●──────●──────●               │
│  Draft  Submit Review Short  Docs   Enrolled         │
│                        listed Verify                  │
│                                                       │
│  Current Status: submitted ✅                        │
└──────────────────────────────────────────────────────┘
```

---

## 🏫 WORKFLOW 3: COLLEGE ADMIN REVIEWS APPLICATIONS

```
┌─────────────────────────────────────────────────────────────────────┐
│              COLLEGE ADMIN APPLICATION MANAGEMENT                    │
└─────────────────────────────────────────────────────────────────────┘

College Admin logs in → /college/dashboard

COLLEGE DASHBOARD shows:
┌──────────────────────────────────────────┐
│  📊 College of Engineering Dashboard     │
│                                           │
│  Total Students:     45                  │
│  Total Courses:       2                  │
│  Pending Applications: 12               │
│  Shortlisted:          8                │
│  Enrolled:            35                │
└──────────────────────────────────────────┘

⚠️ KEY: College Admin only sees DATA for THEIR college
      (JWT has college_id → backend filters by it)


STEP 1: VIEW APPLICATIONS
──────────────────────────
GET /api/v1/college/applications?status=submitted
          │
          ▼
 DB: SELECT * FROM applications
     WHERE college_id = {admin's college_id}
     AND status = "submitted"
     JOIN students, users, courses
          │
          ▼
 Admin sees list of all submitted applications


STEP 2: REVIEW → SHORTLIST OR REJECT
──────────────────────────────────────
Admin opens application → reviews details
Clicks "Shortlist" or "Reject"

PUT /api/v1/college/applications/{id}/review
{
  status: "shortlisted",    ← or "rejected"
  rejection_reason: ""      ← filled if rejected
}
          │
          ▼
 Update applications.status = "shortlisted"
 Update applications.reviewed_by = admin user_id
 Update applications.shortlisted_at = now
 Update students.status = "shortlisted"
 Create notification for student:
   "🎉 Application Shortlisted! Submit documents."
 Send email to student
          │
          ▼
 Student sees notification on their dashboard!


STEP 3: STUDENT COMES TO COLLEGE, SUBMITS DOCS
────────────────────────────────────────────────
Student uploads documents online via:
POST /api/v1/student/documents

College Admin verifies each document:
PUT /api/v1/college/documents/{id}/verify
{ is_verified: true, remarks: "Original verified" }
          │
          ▼
 Update documents.is_verified = true
 Update documents.verified_by = admin user_id
 Update documents.verified_at = now


STEP 4: ENROLL STUDENT → GENERATE ENROLLMENT NUMBER
─────────────────────────────────────────────────────
After documents verified, Admin clicks "Enroll"

PUT /api/v1/college/applications/{id}/enroll
          │
          ▼
 Check: application status == "shortlisted"? ✅
 Generate enrollment number:
   "ENR-2024-a3f9c2"  (year + random hex)
 Update applications.status = "enrolled"
 Update students.status = "enrolled"
 Update students.enrollment_number = "ENR-2024-a3f9c2"
 Update students.enrollment_date = now
 Create notification: "🎓 Enrolled! Your number: ENR-2024-a3f9c2"
 Send email to student
          │
          ▼
 Student can now see their Enrollment Number
 on their dashboard!


COLLEGE ADMIN CAN ALSO ADD STUDENTS MANUALLY:
───────────────────────────────────────────────
POST /api/v1/college/students
{
  username, email, password, phone,
  first_name, last_name, course_id,
  previous_school, previous_grade
}
          │
          ▼
 Create users record { role: "student",
                       college_id: admin's college }
 Auto-generate enrollment number
 Create students record { status: "enrolled" }
 Send welcome email
```

---

## 💰 WORKFLOW 4: FINANCE CONTROLLER → FEE PAYMENT

```
┌─────────────────────────────────────────────────────────────────────┐
│                    COMPLETE PAYMENT FLOW                             │
└─────────────────────────────────────────────────────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART A: FINANCE CONTROLLER CREATES FEES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Finance Controller logs in → /finance/dashboard

FINANCE DASHBOARD shows:
┌──────────────────────────────────────────┐
│  💰 Finance Dashboard                    │
│                                           │
│  Total Collected:   ₹25,50,000          │
│  Total Pending:     ₹8,75,000           │
│  Successful Payments: 145               │
│  Pending Payments:    32                │
│  Recent Payments: [list]                │
└──────────────────────────────────────────┘

Create Fee Structure:
POST /api/v1/finance/fees
{
  college_id: 1,
  course_id: 1,
  name: "Semester 1 Fee",
  fee_type: "semester",    ← admission|semester|exam|hostel|misc
  amount: 75000,
  due_date: "2024-12-01",
  academic_year: "2024-25"
}
          │
          ▼
 Create fee_structures record
 All students of that course can now see this fee!


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART B: STUDENT PAYS FEE (Razorpay)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FRONTEND                  BACKEND              RAZORPAY API
────────                  ───────              ────────────

Student goes to
/student/payments

GET /api/v1/student/payments/pending
          │
          ▼
 Find all fee_structures for student's
 course + college
 Filter out already paid ones
 Return: pending fees list

Student sees:
┌─────────────────────────────────────┐
│  💳 Pending Fees                    │
│                                      │
│  Admission Fee      ₹50,000  [PAY] │
│  Semester 1 Fee     ₹75,000  [PAY] │
│  Exam Fee           ₹5,000   [PAY] │
└─────────────────────────────────────┘

Student clicks "PAY" on Admission Fee:

STEP 1: Create Razorpay Order
───────────────────────────────
POST /api/v1/student/payments/order
{ fee_structure_id: 1 }
          │
          ▼
 Check: already paid? → 409
 Call Razorpay API:
   client.Order.Create({
     amount: 5000000,  ← ₹50,000 × 100 paise
     currency: "INR",
     receipt: "RCP-2024-a1b2c3"
   })
          │                           ──────────────────►
          │                           Create order
          │                           ◄──────────────────
          │                           { id: "order_xyz123" }
          │
 Save payment record:
 { student_id, fee_structure_id,
   razorpay_order_id: "order_xyz123",
   status: "pending" }
          │
          ▼
 Return to frontend:
 { order_id, amount, currency,
   key_id, fee_name }


STEP 2: Open Razorpay Checkout (Frontend)
──────────────────────────────────────────
Frontend receives order details
Opens Razorpay payment modal:

┌─────────────────────────────────────┐
│  🔒 Razorpay Secure Payment         │
│                                      │
│  University ERP                     │
│  Admission Fee - ₹50,000           │
│                                      │
│  ○ UPI    ○ Card    ○ NetBanking   │
│  ○ Wallet ○ EMI                    │
│                                      │
│  [Pay ₹50,000]                      │
└─────────────────────────────────────┘

User pays → Razorpay returns:
{
  razorpay_order_id: "order_xyz123",
  razorpay_payment_id: "pay_abc456",
  razorpay_signature: "sig_xxx..."
}


STEP 3: Verify Payment (CRITICAL SECURITY STEP)
──────────────────────────────────────────────────
POST /api/v1/student/payments/verify
{
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature
}
          │
          ▼
 BACKEND VERIFIES SIGNATURE:
 data = order_id + "|" + payment_id
 expected = HMAC-SHA256(data, RAZORPAY_SECRET)
 expected == signature? ✅ VERIFIED
          │
          ▼
 Update payments record:
 { razorpay_payment_id, status: "success",
   paid_at: now }
 Update students.fee_paid = true
 Create notification: "✅ Payment of ₹50,000 received"
 Send email receipt to student
          │
          ▼
 Return: { receipt, amount, status }

Student sees:
┌─────────────────────────────────────┐
│  ✅ Payment Successful!             │
│  Amount: ₹50,000                   │
│  Receipt: RCP-2024-a1b2c3          │
│  [Download Receipt]                 │
└─────────────────────────────────────┘

GET /api/v1/student/payments/{id}/receipt
→ Returns full payment + fee + college details
```

---

## 📋 WORKFLOW 5: REGISTRAR → EXAMS & RESULTS

```
┌─────────────────────────────────────────────────────────────────────┐
│                    EXAM & RESULTS WORKFLOW                           │
└─────────────────────────────────────────────────────────────────────┘

REGISTRAR DASHBOARD:
┌──────────────────────────────────────────┐
│  📋 Registrar Dashboard                  │
│                                           │
│  Total Exams:      12                   │
│  Published Exams:   8                   │
│  Total Results:    340                  │
│  Pending Results:   45                  │
│  Upcoming Exams: [list]                 │
└──────────────────────────────────────────┘


STEP 1: CREATE EXAM
─────────────────────
POST /api/v1/registrar/exams
{
  name: "Mid Semester - Computer Science",
  course_id: 1,
  college_id: 1,
  exam_date: "2024-12-15T09:00:00Z",
  duration: 180,
  total_marks: 100,
  passing_marks: 40,
  academic_year: "2024-25",
  semester: 1,
  description: "First mid semester examination"
}
          │
          ▼
 Create exams record
 { is_published: false }  ← students can't see yet


STEP 2: PUBLISH EXAM (Students get notified)
─────────────────────────────────────────────
PUT /api/v1/registrar/exams/{id}/publish
          │
          ▼
 Update exams.is_published = true
 Find all enrolled students for this course
 Create notification for EACH student:
   "📅 Exam Scheduled: Mid Semester - CS
    Date: 15 Dec 2024"
          │
          ▼
 Students now see exam on their dashboard!


STEP 3: ADD RESULTS (After exam)
──────────────────────────────────
POST /api/v1/registrar/results
{
  exam_id: 1,
  student_id: 1,
  marks_obtained: 85,
  grade: "",        ← auto-calculated if empty!
  remarks: "Excellent"
}
          │
          ▼
 Auto-grade calculation:
 ┌────────────────────────────────┐
 │ percentage >= 90%  → A+       │
 │ percentage >= 80%  → A        │
 │ percentage >= 70%  → B+       │
 │ percentage >= 60%  → B        │
 │ percentage >= 50%  → C        │
 │ percentage >= 40%  → D        │
 │ percentage <  40%  → F        │
 └────────────────────────────────┘
 85/100 = 85% → Grade: A

 Upsert result (create or update if exists)
 { is_published: false }  ← not visible yet


STEP 4: PUBLISH RESULTS
─────────────────────────
PUT /api/v1/registrar/results/{exam_id}/publish
          │
          ▼
 Update ALL results for this exam:
 { is_published: true, published_at: now }
 For EACH student with a result:
   Create notification:
   "📊 Results Published! Grade: A"
          │
          ▼
 Students can now see their results!

Student views results at:
GET /api/v1/student/results
┌─────────────────────────────────────┐
│  📊 My Results                      │
│                                      │
│  Mid Semester - CS   85/100   A    │
│  Semester End - CS   92/100   A+   │
│  Exam Fee            Paid ✅        │
└─────────────────────────────────────┘
```

---

## 👨‍💼 WORKFLOW 6: UNIVERSITY ADMIN (Super Control)

```
┌─────────────────────────────────────────────────────────────────────┐
│                  UNIVERSITY ADMIN CONTROLS                           │
└─────────────────────────────────────────────────────────────────────┘

UNIVERSITY DASHBOARD:
┌──────────────────────────────────────────┐
│  🏛️ University Admin Dashboard           │
│                                           │
│  Total Students:        245             │
│  Total Colleges:          3             │
│  Total Courses:           8             │
│  Pending Applications:   34            │
│  Enrolled Students:     180            │
│  Total Revenue:    ₹89,50,000          │
└──────────────────────────────────────────┘


CREATE STAFF USERS (Finance, Registrar, College Admin):
────────────────────────────────────────────────────────
POST /api/v1/admin/users
{
  username: "finance_ctrl2",
  email: "finance2@university.edu",
  password: "Finance@123",
  role: "finance_controller",  ← or registrar, college_admin
  phone: "9000000099",
  college_id: null  ← required only for college_admin
}
          │
          ▼
 Validate role is not student/university_admin
 Create user record
 Send welcome email
 ✅ Staff can now login immediately


MANAGE COLLEGES:
─────────────────
POST /api/v1/admin/colleges
{
  name: "College of Law",
  code: "COL",
  address: "789 Law Street",
  phone: "9876543212",
  email: "col@university.edu"
}

MANAGE COURSES:
────────────────
POST /api/v1/admin/courses
{
  name: "Bachelor of Law",
  code: "LLB101",
  college_id: 3,
  duration: 3,
  total_seats: 40
}

TOGGLE USER ACCESS:
────────────────────
PUT /api/v1/admin/users/{id}/toggle
→ Activates or Deactivates any user
→ Deactivated users CANNOT login
  (backend: WHERE is_active = true)

VIEW ALL DATA:
───────────────
GET /api/v1/admin/applications  → ALL applications system-wide
GET /api/v1/admin/payments      → ALL payments system-wide
GET /api/v1/admin/users         → ALL users (passwords hidden)
```

---

## 🔄 COMPLETE REQUEST LIFECYCLE

```
┌─────────────────────────────────────────────────────────────────────┐
│           HOW EVERY API REQUEST FLOWS THROUGH THE SYSTEM            │
└─────────────────────────────────────────────────────────────────────┘

FRONTEND (React)
     │
     │  fetch/axios with:
     │  - URL: http://localhost:8080/api/v1/...
     │  - Headers: { Authorization: "Bearer <JWT>" }
     │  - Body: JSON payload
     ▼
GORILLA MUX ROUTER
     │
     │  Match route → /api/v1/college/applications
     ▼
CORS MIDDLEWARE
     │
     │  Add headers:
     │  Access-Control-Allow-Origin: *
     │  Access-Control-Allow-Methods: GET,POST,PUT,DELETE
     ▼
AUTH MIDDLEWARE
     │
     │  Extract "Bearer <token>" from header
     │  jwt.ParseWithClaims(token) → Claims{
     │    user_id, email, role, college_id
     │  }
     │  Store claims in request context
     ▼
ROLE MIDDLEWARE
     │
     │  claims.Role == "college_admin"? ✅
     │  If not → 403 Forbidden
     ▼
HANDLER FUNCTION
     │
     │  Read claims from context
     │  Parse request body
     │  Business logic
     │
     ▼
GORM DATABASE QUERY
     │
     │  db.DB.Where("college_id = ?", claims.CollegeID)
     │     .Preload("Students")
     │     .Find(&applications)
     ▼
POSTGRESQL
     │
     │  Execute SQL
     │  Return rows
     ▼
HANDLER BUILDS RESPONSE
     │
     │  utils.JSONResponse(w, 200, true, "message", data)
     ▼
FRONTEND RECEIVES
     │
     │  { success: true,
     │    message: "Applications fetched",
     │    data: [...] }
     ▼
React updates UI state → re-renders component
```

---

## 📁 FRONTEND FOLDER STRUCTURE

```
frontend/
├── .env
│   ├── REACT_APP_API_URL=http://localhost:8080/api/v1
│   └── REACT_APP_RAZORPAY_KEY_ID=rzp_test_xxx
│
├── src/
│   ├── api/
│   │   └── axios.ts          ← Base axios with JWT interceptor
│   │
│   ├── context/
│   │   └── AuthContext.tsx   ← Global auth state (user, token, role)
│   │
│   ├── routes/
│   │   └── PrivateRoute.tsx  ← Redirects if not logged in
│   │
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── ForgotPassword.tsx
│   │   ├── ResetPassword.tsx
│   │   │
│   │   ├── admin/            ← university_admin portal
│   │   │   ├── Dashboard.tsx
│   │   │   ├── CreateUser.tsx
│   │   │   ├── Colleges.tsx
│   │   │   └── Courses.tsx
│   │   │
│   │   ├── finance/          ← finance_controller portal
│   │   │   ├── Dashboard.tsx
│   │   │   ├── FeeStructures.tsx
│   │   │   └── Payments.tsx
│   │   │
│   │   ├── registrar/        ← registrar portal
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Exams.tsx
│   │   │   └── Results.tsx
│   │   │
│   │   ├── college/          ← college_admin portal
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Students.tsx
│   │   │   ├── Applications.tsx
│   │   │   └── Documents.tsx
│   │   │
│   │   └── student/          ← student portal
│   │       ├── Dashboard.tsx
│   │       ├── Apply.tsx
│   │       ├── MyApplications.tsx
│   │       ├── Payments.tsx
│   │       ├── Results.tsx
│   │       └── Documents.tsx
│   │
│   └── App.tsx               ← Routes wired by role
```

---

## 🔑 JWT TOKEN EXPLAINED

```
┌─────────────────────────────────────────────────────────┐
│                  JWT TOKEN PAYLOAD                       │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  {                                                        │
│    "user_id":   42,                                      │
│    "email":     "admin@coe.edu",                        │
│    "role":      "college_admin",                        │
│    "college_id": 1,           ← KEY for data isolation  │
│    "exp":       1735689600    ← Expires in 24 hours     │
│  }                                                        │
│                                                           │
│  ⚠️ college_id in JWT means:                            │
│  College Admin ONLY sees their college's data           │
│  Backend always filters: WHERE college_id = {from JWT} │
│                                                           │
│  Student has no college_id until enrolled               │
│  Finance/Registrar have no college_id (university-wide) │
└─────────────────────────────────────────────────────────┘
```

---

## 🌱 DUMMY DATA ON STARTUP

```
When you run: go run main.go

Auto-created accounts (FIRST RUN ONLY):
┌──────────────────────────────────────────────────────────┐
│  ROLE                EMAIL                   PASSWORD     │
├──────────────────────────────────────────────────────────┤
│  university_admin    admin@university.edu    Admin@123   │
│  finance_controller  finance@university.edu  Finance@123 │
│  registrar           registrar@university.edu Reg@123    │
│  college_admin(COE)  admin@coe.edu           College@123 │
│  college_admin(CAS)  admin@cas.edu           College@123 │
│  student             john@student.edu        Student@123 │
│  student             jane@student.edu        Student@123 │
└──────────────────────────────────────────────────────────┘

Auto-created data:
✅ 2 Colleges (COE, CAS)
✅ 3 Courses (CS, EC, BA)
✅ 3 Fee Structures (Admission, Sem1, Exam)
✅ 1 Application (enrolled with ENR number)
✅ 1 Application (shortlisted)
✅ 1 Payment (success - admission fee)
✅ 1 Exam (published)
✅ 1 Result (published, Grade A)
✅ 2 Notifications (one per student)
```

---

## ⚡ QUICK START

```bash
# 1. Clone & setup
cd university-erp-backend
cp .env.example .env
# Fill in your DB credentials + Razorpay keys

# 2. Install dependencies
go mod tidy

# 3. Run (auto-migrates + seeds on first run)
go run main.go

# Output:
# ✅ Database connected successfully
# 🔄 Running database migrations...
# ✅ Database migration completed
# 🌱 Seeding dummy data...
# ✅ Dummy data seeded successfully
# 📋 Login Credentials: [table shown]
# 🚀 University ERP Backend running on :8080
```

---

That's the **complete end-to-end system**! Every button click on the frontend maps to a specific API call, goes through auth + role middleware, hits the database, and returns structured JSON back to update the UI. Want me to now build the **complete React + TypeScript frontend** next? 🚀

---