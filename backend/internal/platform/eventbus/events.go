package eventbus

// ─── Event Type Constants ────────────────────────────────────────────────────

const (
	// Auth events
	EventUserRegistered = "user.registered"
	EventUserLoggedIn   = "user.logged_in"
	EventPasswordReset  = "user.password_reset"

	// Student events
	EventStudentEnrolled      = "student.enrolled"
	EventStudentStatusChanged = "student.status_changed"
	EventStudentGraduated     = "student.graduated"

	// Admission events
	EventApplicationSubmitted = "admission.application_submitted"
	EventApplicationApproved  = "admission.application_approved"
	EventApplicationRejected  = "admission.application_rejected"
	EventSeatAllocated        = "admission.seat_allocated"

	// Finance events
	EventInvoiceGenerated  = "finance.invoice_generated"
	EventPaymentCompleted  = "finance.payment_completed"
	EventPaymentFailed     = "finance.payment_failed"
	EventRefundProcessed   = "finance.refund_processed"
	EventFeeOverdue        = "finance.fee_overdue"
	EventLibraryFinePosted = "finance.library_fine_posted"

	// Academic events
	EventCourseRegistered   = "academic.course_registered"
	EventTermRegistered     = "academic.term_registered"
	EventTimetablePublished = "academic.timetable_published"

	// Exam events
	EventResultPublished      = "exam.result_published"
	EventRevaluationRequested = "exam.revaluation_requested"

	// HR events
	EventEmployeeOnboarded = "hr.employee_onboarded"
	EventLeaveRequested    = "hr.leave_requested"
	EventLeaveApproved     = "hr.leave_approved"
	EventPayrollProcessed  = "hr.payroll_processed"

	// Library events
	EventBookIssued   = "library.book_issued"
	EventBookReturned = "library.book_returned"
	EventBookOverdue  = "library.book_overdue"

	// Hostel events
	EventHostelAllocated      = "hostel.allocated"
	EventMaintenanceRequested = "hostel.maintenance_requested"

	// Transport events
	EventTransportPassIssued = "transport.pass_issued"

	// System events
	EventNotificationCreated = "system.notification_created"
)

// ─── Event Payloads ──────────────────────────────────────────────────────────

type StudentEnrolledPayload struct {
	StudentID  uint   `json:"student_id"`
	UserID     uint   `json:"user_id"`
	ProgramID  uint   `json:"program_id"`
	TermID     uint   `json:"term_id"`
	RollNumber string `json:"roll_number"`
}

type PaymentCompletedPayload struct {
	PaymentID     uint    `json:"payment_id"`
	InvoiceID     uint    `json:"invoice_id"`
	StudentID     uint    `json:"student_id"`
	Amount        float64 `json:"amount"`
	TransactionID string  `json:"transaction_id"`
}

type InvoiceGeneratedPayload struct {
	InvoiceID     uint    `json:"invoice_id"`
	StudentID     uint    `json:"student_id"`
	TotalAmount   float64 `json:"total_amount"`
	InvoiceNumber string  `json:"invoice_number"`
}

type ApplicationApprovedPayload struct {
	ApplicantID uint   `json:"applicant_id"`
	ProgramID   uint   `json:"program_id"`
	Email       string `json:"email"`
	FirstName   string `json:"first_name"`
	LastName    string `json:"last_name"`
	CycleID     uint   `json:"cycle_id"`
}

type PayrollProcessedPayload struct {
	PayrollRunID uint    `json:"payroll_run_id"`
	EmployeeID   uint   `json:"employee_id"`
	Month        string  `json:"month"`
	GrossPay     float64 `json:"gross_pay"`
	NetPay       float64 `json:"net_pay"`
	ProcessedBy  uint   `json:"processed_by"`
}

type BookOverduePayload struct {
	CirculationID uint    `json:"circulation_id"`
	StudentID     uint    `json:"student_id"`
	BookCopyID    uint    `json:"book_copy_id"`
	DaysOverdue   int     `json:"days_overdue"`
	FineAmount    float64 `json:"fine_amount"`
}

type NotificationPayload struct {
	UserID  uint   `json:"user_id"`
	Title   string `json:"title"`
	Message string `json:"message"`
	Type    string `json:"type"`
}
