package hrmod

import (
        "context"
        "encoding/json"
        "fmt"
        "log"
        "time"

        "university-erp-backend/internal/domain"
        "university-erp-backend/internal/platform/apperrors"
        "university-erp-backend/internal/platform/eventbus"
        "university-erp-backend/internal/platform/outbox"

        "gorm.io/gorm"
)

type Service struct {
        repo   *Repository
        bus    *eventbus.Bus
        outbox *outbox.Writer
        db     *gorm.DB
}

func NewService(repo *Repository, bus *eventbus.Bus, ob *outbox.Writer, db *gorm.DB) *Service {
        s := &Service{repo: repo, bus: bus, outbox: ob, db: db}
        // Subscribe to admissions event for employee onboarding flow
        s.bus.Subscribe(eventbus.EventEmployeeOnboarded, s.HandleEmployeeOnboarded)
        return s
}

// HandleEmployeeOnboarded logs the event (hook for future flows).
func (s *Service) HandleEmployeeOnboarded(ctx context.Context, evt eventbus.Event) error {
        log.Printf("👥 HRMod: Employee onboarded event received: %s", evt.AggregateID)
        return nil
}

// Lookups
func (s *Service) ListDesignations(ctx context.Context) ([]domain.Designation, error) {
        return s.repo.ListDesignations()
}
func (s *Service) ListEmploymentTypes(ctx context.Context) ([]domain.EmploymentType, error) {
        return s.repo.ListEmploymentTypes()
}
func (s *Service) ListLeaveTypes(ctx context.Context) ([]domain.LeaveType, error) {
        return s.repo.ListLeaveTypes()
}
func (s *Service) CreateDesignation(ctx context.Context, d *domain.Designation) error {
        return s.repo.CreateDesignation(d)
}
func (s *Service) CreateLeaveType(ctx context.Context, lt *domain.LeaveType) error {
        return s.repo.CreateLeaveType(lt)
}

// Employees
func (s *Service) ListEmployees(ctx context.Context, departmentID uint, page, pageSize int) ([]domain.Employee, int64, error) {
        return s.repo.ListEmployees(departmentID, page, pageSize)
}
func (s *Service) GetEmployee(ctx context.Context, id uint) (*domain.Employee, error) {
        e, err := s.repo.GetEmployee(id)
        if err != nil {
                return nil, apperrors.NotFound("employee not found")
        }
        return e, nil
}
func (s *Service) GetMyProfile(ctx context.Context, userID uint) (*domain.Employee, error) {
        e, err := s.repo.GetEmployeeByUserID(userID)
        if err != nil {
                return nil, apperrors.NotFound("employee profile not found")
        }
        return e, nil
}
func (s *Service) CreateEmployee(ctx context.Context, e *domain.Employee) error {
        if e.FirstName == "" || e.LastName == "" {
                return apperrors.BadRequest("first and last name are required")
        }
        code, err := s.repo.GenerateEmployeeCode()
        if err != nil {
                return err
        }
        e.EmployeeCode = code
        if e.JoiningDate.IsZero() {
                e.JoiningDate = time.Now()
        }
        e.IsActive = true

        txErr := s.db.Transaction(func(tx *gorm.DB) error {
                if err := tx.Create(e).Error; err != nil {
                        return err
                }
                return s.outbox.WriteEvent(tx, "Employee", fmt.Sprintf("%d", e.ID),
                        eventbus.EventEmployeeOnboarded,
                        map[string]interface{}{
                                "employee_id":   e.ID,
                                "employee_code": e.EmployeeCode,
                                "first_name":    e.FirstName,
                                "last_name":     e.LastName,
                                "department_id": e.DepartmentID,
                        },
                )
        })
        return txErr
}
func (s *Service) UpdateEmployee(ctx context.Context, id uint, e *domain.Employee) error {
        existing, err := s.repo.GetEmployee(id)
        if err != nil {
                return apperrors.NotFound("employee not found")
        }
        e.ID = existing.ID
        e.EmployeeCode = existing.EmployeeCode
        return s.repo.UpdateEmployee(e)
}
func (s *Service) DeactivateEmployee(ctx context.Context, id uint) error {
        return s.repo.DeactivateEmployee(id)
}

// Faculty
func (s *Service) ListFaculty(ctx context.Context, departmentID uint) ([]FacultyDetail, error) {
        return s.repo.ListFaculty(departmentID)
}
func (s *Service) GetFacultyProfile(ctx context.Context, employeeID uint) (*domain.Faculty, error) {
        return s.repo.GetFaculty(employeeID)
}
func (s *Service) UpsertFacultyProfile(ctx context.Context, f *domain.Faculty) error {
        return s.repo.UpsertFaculty(f)
}

// Staff
func (s *Service) GetStaffProfile(ctx context.Context, employeeID uint) (*domain.Staff, error) {
        return s.repo.GetStaff(employeeID)
}
func (s *Service) UpsertStaffProfile(ctx context.Context, st *domain.Staff) error {
        return s.repo.UpsertStaff(st)
}

// Department History
func (s *Service) TransferDepartment(ctx context.Context, employeeID, deptID uint) error {
        s.repo.db.Exec(`UPDATE hr.employee_department_history SET effective_to = ? WHERE employee_id = ? AND effective_to IS NULL`, time.Now(), employeeID)
        s.repo.db.Model(&domain.Employee{}).Where("id = ?", employeeID).Update("department_id", deptID)
        hist := &domain.EmployeeDepartmentHistory{
                EmployeeID:    employeeID,
                DepartmentID:  deptID,
                EffectiveFrom: time.Now(),
        }
        return s.repo.AddDeptHistory(hist)
}
func (s *Service) GetDeptHistory(ctx context.Context, employeeID uint) ([]domain.EmployeeDepartmentHistory, error) {
        return s.repo.GetDeptHistory(employeeID)
}

// Salary
func (s *Service) GetCurrentSalary(ctx context.Context, employeeID uint) (*domain.Salary, error) {
        return s.repo.GetCurrentSalary(employeeID)
}
func (s *Service) AssignSalary(ctx context.Context, s2 *domain.Salary) error {
        if s2.EmployeeID == 0 {
                return apperrors.BadRequest("employee_id is required")
        }
        s2.EffectiveFrom = time.Now()
        return s.repo.CreateSalary(s2)
}
func (s *Service) ListSalaryComponents(ctx context.Context) ([]domain.SalaryComponent, error) {
        return s.repo.ListSalaryComponents()
}
func (s *Service) CreateSalaryComponent(ctx context.Context, sc *domain.SalaryComponent) error {
        return s.repo.CreateSalaryComponent(sc)
}

// Payroll — emits PayrollProcessed event so Finance can post payment vouchers
func (s *Service) RunPayroll(ctx context.Context, employeeID uint, month time.Time, processedBy uint) (*domain.PayrollRun, error) {
        sal, err := s.repo.GetCurrentSalary(employeeID)
        if err != nil {
                return nil, apperrors.BadRequest("no active salary found for employee")
        }
        pr := &domain.PayrollRun{
                EmployeeID:  employeeID,
                Month:       month,
                GrossPay:    sal.BasePay,
                NetPay:      sal.NetSalary,
                ProcessedAt: time.Now(),
                ProcessedBy: &processedBy,
        }

        txErr := s.db.Transaction(func(tx *gorm.DB) error {
                if err := tx.Create(pr).Error; err != nil {
                        return err
                }
                // Emit PayrollProcessed event for Finance module
                return s.outbox.WriteEvent(tx, "PayrollRun", fmt.Sprintf("%d", pr.ID),
                        eventbus.EventPayrollProcessed,
                        eventbus.PayrollProcessedPayload{
                                PayrollRunID: pr.ID,
                                EmployeeID:   pr.EmployeeID,
                                Month:        month.Format("2006-01"),
                                GrossPay:     pr.GrossPay,
                                NetPay:       pr.NetPay,
                                ProcessedBy:  processedBy,
                        },
                )
        })
        if txErr != nil {
                return nil, apperrors.Internal("payroll run failed", txErr)
        }

        log.Printf("✅ HRMod: Payroll run %d completed for Employee %d (Net: %.2f)", pr.ID, employeeID, pr.NetPay)
        return pr, nil
}

func (s *Service) ListPayrollRuns(ctx context.Context, employeeID uint) ([]domain.PayrollRun, error) {
        return s.repo.ListPayrollRuns(employeeID)
}

// Bulk payroll for all active employees in a month
func (s *Service) RunBulkPayroll(ctx context.Context, month time.Time, processedBy uint) (int, []error) {
        var employees []domain.Employee
        s.db.Where("is_active = ?", true).Find(&employees)

        var errs []error
        successCount := 0
        for _, emp := range employees {
                if _, err := s.RunPayroll(ctx, emp.ID, month, processedBy); err != nil {
                        errs = append(errs, fmt.Errorf("employee %d: %w", emp.ID, err))
                } else {
                        successCount++
                }
        }
        return successCount, errs
}

// Leave
func (s *Service) GetLeaveBalances(ctx context.Context, employeeID uint, year int) ([]domain.LeaveBalance, error) {
        return s.repo.ListLeaveBalances(employeeID, uint(year))
}
func (s *Service) RequestLeave(ctx context.Context, req *domain.LeaveRequest) error {
        if req.EmployeeID == 0 || req.LeaveTypeID == 0 {
                return apperrors.BadRequest("employee_id and leave_type_id are required")
        }
        req.CreatedAt = time.Now()

        txErr := s.db.Transaction(func(tx *gorm.DB) error {
                if err := tx.Create(req).Error; err != nil {
                        return err
                }
                return s.outbox.WriteEvent(tx, "LeaveRequest", fmt.Sprintf("%d", req.ID),
                        eventbus.EventLeaveRequested,
                        map[string]interface{}{
                                "leave_request_id": req.ID,
                                "employee_id":      req.EmployeeID,
                                "leave_type_id":    req.LeaveTypeID,
                                "from":             req.StartDate,
                                "to":               req.EndDate,
                        },
                )
        })
        return txErr
}
func (s *Service) ListLeaveRequests(ctx context.Context, employeeID uint, page, pageSize int) ([]domain.LeaveRequest, int64, error) {
        return s.repo.ListLeaveRequests(employeeID, page, pageSize)
}
func (s *Service) ApproveLeave(ctx context.Context, id, approvedBy uint) error {
        req, err := s.repo.GetLeaveRequest(id)
        if err != nil {
                return apperrors.NotFound("leave request not found")
        }
        now := time.Now()
        req.ApprovedBy = &approvedBy
        req.ApprovedAt = &now

        txErr := s.db.Transaction(func(tx *gorm.DB) error {
                if err := tx.Save(req).Error; err != nil {
                        return err
                }
                return s.outbox.WriteEvent(tx, "LeaveRequest", fmt.Sprintf("%d", req.ID),
                        eventbus.EventLeaveApproved,
                        map[string]interface{}{
                                "leave_request_id": req.ID,
                                "employee_id":      req.EmployeeID,
                                "approved_by":      approvedBy,
                        },
                )
        })
        return txErr
}
func (s *Service) RejectLeave(ctx context.Context, id uint) error {
        req, err := s.repo.GetLeaveRequest(id)
        if err != nil {
                return apperrors.NotFound("leave request not found")
        }
        var rejected uint = 3
        req.StatusID = &rejected
        return s.repo.UpdateLeaveRequest(req)
}

// Attendance
func (s *Service) MarkAttendance(ctx context.Context, a *domain.HRAttendance) error {
        if a.EmployeeID == 0 {
                return apperrors.BadRequest("employee_id is required")
        }
        return s.repo.MarkHRAttendance(a)
}
func (s *Service) GetAttendance(ctx context.Context, employeeID uint, from, to time.Time) ([]domain.HRAttendance, error) {
        return s.repo.GetHRAttendance(employeeID, from, to)
}

// Recruitment
func (s *Service) ListJobs(ctx context.Context) ([]domain.RecruitmentJob, error) {
        return s.repo.ListJobs()
}
func (s *Service) GetJob(ctx context.Context, id uint) (*domain.RecruitmentJob, error) {
        return s.repo.GetJob(id)
}
func (s *Service) PostJob(ctx context.Context, j *domain.RecruitmentJob) error {
        j.PostedDate = time.Now()
        return s.repo.CreateJob(j)
}
func (s *Service) ListJobApplications(ctx context.Context, jobID uint) ([]domain.JobApplication, error) {
        return s.repo.ListJobApplications(jobID)
}
func (s *Service) ApplyForJob(ctx context.Context, ja *domain.JobApplication) error {
        if ja.ApplicantName == "" || ja.Email == "" {
                return apperrors.BadRequest("applicant name and email are required")
        }
        ja.AppliedAt = time.Now()
        return s.repo.CreateJobApplication(ja)
}
func (s *Service) UpdateJobApplicationStatus(ctx context.Context, id, statusID uint) error {
        return s.repo.UpdateJobApplicationStatus(id, statusID)
}

// Stats dashboard
func (s *Service) GetHRStats(ctx context.Context) (map[string]interface{}, error) {
        total, _ := s.repo.CountEmployees()
        faculty, _ := s.repo.ListFaculty(0)
        jobs, _ := s.repo.ListJobs()
        return map[string]interface{}{
                "total_employees": total,
                "total_faculty":   len(faculty),
                "open_jobs":       len(jobs),
        }, nil
}

// ── internal helper used in CreateEmployee above ──────────────────────────
var _ = json.Marshal // avoid unused import error
