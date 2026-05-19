package adminmod

import (
	"fmt"
	"time"

	"university-erp-backend/internal/domain"

	"gorm.io/gorm"
)

type Repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) *Repository {
	return &Repository{db: db}
}

// Users
func (r *Repository) ListUsers(page, pageSize int) ([]domain.User, int64, error) {
	var users []domain.User
	var total int64
	offset := (page - 1) * pageSize
	r.db.Model(&domain.User{}).Count(&total)
	err := r.db.Offset(offset).Limit(pageSize).Order("created_at DESC").Find(&users).Error
	return users, total, err
}

func (r *Repository) GetUser(id uint) (*domain.User, error) {
	var u domain.User
	err := r.db.First(&u, id).Error
	return &u, err
}

func (r *Repository) GetUserWithRoles(id uint) (*UserDetail, error) {
	var u domain.User
	if err := r.db.First(&u, id).Error; err != nil {
		return nil, err
	}
	var roleNames []string
	r.db.Table("shared.user_roles").
		Select("shared.roles.role_name").
		Joins("JOIN shared.roles ON shared.roles.id = shared.user_roles.role_id").
		Where("shared.user_roles.user_id = ?", id).
		Scan(&roleNames)
	return &UserDetail{User: u, Roles: roleNames}, nil
}

func (r *Repository) UpdateUserActive(id uint, active bool) error {
	return r.db.Model(&domain.User{}).Where("id = ?", id).Update("is_active", active).Error
}

// Roles
func (r *Repository) ListRoles() ([]domain.Role, error) {
	var roles []domain.Role
	err := r.db.Find(&roles).Error
	return roles, err
}

func (r *Repository) GetRole(id uint) (*domain.Role, error) {
	var role domain.Role
	err := r.db.First(&role, id).Error
	return &role, err
}

func (r *Repository) FindRoleByName(name string) (*domain.Role, error) {
	var role domain.Role
	err := r.db.Where("role_name = ?", name).First(&role).Error
	return &role, err
}

func (r *Repository) CreateRole(role *domain.Role) error {
	return r.db.Create(role).Error
}

func (r *Repository) GetUserRoles(userID uint) ([]string, error) {
	var roleNames []string
	err := r.db.Table("shared.user_roles").
		Select("shared.roles.role_name").
		Joins("JOIN shared.roles ON shared.roles.id = shared.user_roles.role_id").
		Where("shared.user_roles.user_id = ?", userID).
		Scan(&roleNames).Error
	return roleNames, err
}

func (r *Repository) AssignRole(userID, roleID uint, assignedBy uint) error {
	ur := domain.UserRole{
		UserID:     userID,
		RoleID:     roleID,
		AssignedAt: time.Now(),
		AssignedBy: &assignedBy,
	}
	return r.db.FirstOrCreate(&ur, domain.UserRole{UserID: userID, RoleID: roleID}).Error
}

func (r *Repository) RevokeRole(userID, roleID uint) error {
	return r.db.Where("user_id = ? AND role_id = ?", userID, roleID).Delete(&domain.UserRole{}).Error
}

// Notifications
func (r *Repository) CreateNotification(n *domain.Notification) error {
	return r.db.Create(n).Error
}

func (r *Repository) ListNotifications(userID uint, page, pageSize int) ([]domain.Notification, int64, error) {
	var notes []domain.Notification
	var total int64
	offset := (page - 1) * pageSize
	q := r.db.Model(&domain.Notification{})
	if userID > 0 {
		q = q.Where("user_id = ? OR is_broadcast = ?", userID, true)
	}
	q.Count(&total)
	err := q.Offset(offset).Limit(pageSize).Order("created_at DESC").Find(&notes).Error
	return notes, total, err
}

func (r *Repository) MarkNotificationRead(id, userID uint) error {
	return r.db.Model(&domain.Notification{}).
		Where("id = ? AND user_id = ?", id, userID).
		Update("is_read", true).Error
}

// Dashboard stats
func (r *Repository) GetSystemStats() (map[string]interface{}, error) {
	stats := make(map[string]interface{})

	var totalStudents int64
	r.db.Model(&domain.Student{}).Count(&totalStudents)
	stats["total_students"] = totalStudents

	var totalEmployees int64
	r.db.Model(&domain.Employee{}).Where("is_active = ?", true).Count(&totalEmployees)
	stats["total_employees"] = totalEmployees

	var totalUsers int64
	r.db.Model(&domain.User{}).Where("is_active = ?", true).Count(&totalUsers)
	stats["total_users"] = totalUsers

	var totalDepartments int64
	r.db.Model(&domain.Department{}).Count(&totalDepartments)
	stats["total_departments"] = totalDepartments

	var totalPrograms int64
	r.db.Model(&domain.Program{}).Where("is_active = ?", true).Count(&totalPrograms)
	stats["total_programs"] = totalPrograms

	var pendingInvoices int64
	r.db.Table("finance.invoices").
		Where("paid_amount < total_amount").Count(&pendingInvoices)
	stats["pending_invoices"] = pendingInvoices

	var totalRevenue float64
	r.db.Table("finance.payments").Select("COALESCE(SUM(amount), 0)").Scan(&totalRevenue)
	stats["total_revenue"] = totalRevenue

	var openGrievances int64
	r.db.Model(&domain.Grievance{}).Where("resolved_at IS NULL").Count(&openGrievances)
	stats["open_grievances"] = openGrievances

	return stats, nil
}

func (r *Repository) GetAuditLogs(page, pageSize int) ([]domain.AuditLog, int64, error) {
	var logs []domain.AuditLog
	var total int64
	offset := (page - 1) * pageSize
	r.db.Model(&domain.AuditLog{}).Count(&total)
	err := r.db.Offset(offset).Limit(pageSize).Order("created_at DESC").Find(&logs).Error
	return logs, total, err
}

func (r *Repository) GetOutboxStats() (map[string]interface{}, error) {
	stats := make(map[string]interface{})
	var pending int64
	r.db.Model(&domain.OutboxEvent{}).Where("published = ?", false).Count(&pending)
	stats["pending_events"] = pending
	var total int64
	r.db.Model(&domain.OutboxEvent{}).Count(&total)
	stats["total_events"] = total
	var failed int64
	r.db.Model(&domain.OutboxEvent{}).Where("retry_count >= ?", 5).Count(&failed)
	stats["failed_events"] = failed
	return stats, nil
}

// Seed data check
func (r *Repository) SeedRoles() error {
	roles := []domain.Role{
		{RoleName: "university_admin", Description: "Full system access - manages entire university"},
		{RoleName: "college_admin", Description: "College-level admin - manages campus, departments, programs"},
		{RoleName: "registrar", Description: "Manages admissions, enrollments, exams, results"},
		{RoleName: "finance_officer", Description: "Manages fees, invoices, payments, scholarships"},
		{RoleName: "hr_officer", Description: "Manages employees, payroll, leave, recruitment"},
		{RoleName: "faculty", Description: "Teaching staff - manages courses, attendance, marks"},
		{RoleName: "student", Description: "Student - views own academic and finance records"},
		{RoleName: "librarian", Description: "Manages library books, circulation, fines"},
		{RoleName: "hostel_warden", Description: "Manages hostel allocations and maintenance"},
	}
	for _, role := range roles {
		if err := r.db.FirstOrCreate(&role, domain.Role{RoleName: role.RoleName}).Error; err != nil {
			return fmt.Errorf("seed role %s: %w", role.RoleName, err)
		}
	}
	return nil
}

func (r *Repository) SeedStatusCodes() error {
	codes := []domain.StatusCode{
		{Module: "student", Code: "ACTIVE", Name: "Active"},
		{Module: "student", Code: "INACTIVE", Name: "Inactive"},
		{Module: "student", Code: "GRADUATED", Name: "Graduated"},
		{Module: "student", Code: "SUSPENDED", Name: "Suspended"},
		{Module: "finance", Code: "UNPAID", Name: "Unpaid"},
		{Module: "finance", Code: "PARTIAL", Name: "Partially Paid"},
		{Module: "finance", Code: "PAID", Name: "Paid"},
		{Module: "finance", Code: "OVERDUE", Name: "Overdue"},
		{Module: "finance", Code: "CANCELLED", Name: "Cancelled"},
		{Module: "admissions", Code: "PENDING", Name: "Pending Review"},
		{Module: "admissions", Code: "APPROVED", Name: "Approved"},
		{Module: "admissions", Code: "REJECTED", Name: "Rejected"},
		{Module: "admissions", Code: "WAITLISTED", Name: "Waitlisted"},
		{Module: "hr", Code: "ACTIVE", Name: "Active"},
		{Module: "hr", Code: "PENDING", Name: "Pending"},
		{Module: "hr", Code: "APPROVED", Name: "Approved"},
		{Module: "hr", Code: "REJECTED", Name: "Rejected"},
		{Module: "library", Code: "ISSUED", Name: "Issued"},
		{Module: "library", Code: "RETURNED", Name: "Returned"},
		{Module: "library", Code: "OVERDUE", Name: "Overdue"},
		{Module: "library", Code: "LOST", Name: "Lost"},
		{Module: "library", Code: "AVAILABLE", Name: "Available"},
		{Module: "grievance", Code: "OPEN", Name: "Open"},
		{Module: "grievance", Code: "IN_PROGRESS", Name: "In Progress"},
		{Module: "grievance", Code: "RESOLVED", Name: "Resolved"},
		{Module: "grievance", Code: "CLOSED", Name: "Closed"},
	}
	for _, sc := range codes {
		if err := r.db.FirstOrCreate(&sc, domain.StatusCode{Module: sc.Module, Code: sc.Code}).Error; err != nil {
			return fmt.Errorf("seed status code %s.%s: %w", sc.Module, sc.Code, err)
		}
	}
	return nil
}

func (r *Repository) SeedLookups() error {
	genders := []domain.Gender{
		{Code: "M", Name: "Male"},
		{Code: "F", Name: "Female"},
		{Code: "O", Name: "Other"},
	}
	for _, g := range genders {
		r.db.FirstOrCreate(&g, domain.Gender{Code: g.Code})
	}

	categories := []domain.Category{
		{Code: "GEN", Name: "General"},
		{Code: "OBC", Name: "Other Backward Class"},
		{Code: "SC", Name: "Scheduled Caste"},
		{Code: "ST", Name: "Scheduled Tribe"},
		{Code: "EWS", Name: "Economically Weaker Section"},
	}
	for _, c := range categories {
		r.db.FirstOrCreate(&c, domain.Category{Code: c.Code})
	}

	bloodGroups := []domain.BloodGroup{
		{Code: "A+", Name: "A Positive"},
		{Code: "A-", Name: "A Negative"},
		{Code: "B+", Name: "B Positive"},
		{Code: "B-", Name: "B Negative"},
		{Code: "AB+", Name: "AB Positive"},
		{Code: "AB-", Name: "AB Negative"},
		{Code: "O+", Name: "O Positive"},
		{Code: "O-", Name: "O Negative"},
	}
	for _, b := range bloodGroups {
		r.db.FirstOrCreate(&b, domain.BloodGroup{Code: b.Code})
	}

	return nil
}
