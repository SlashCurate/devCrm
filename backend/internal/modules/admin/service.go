package adminmod

import (
	"context"
	"time"

	"university-erp-backend/internal/domain"
	"university-erp-backend/internal/platform/apperrors"
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	svc := &Service{repo: repo}
	return svc
}

// ─── Boot: seed essential reference data ─────────────────────────────────────

func (s *Service) SeedAll(ctx context.Context) error {
	if err := s.repo.SeedRoles(); err != nil {
		return err
	}
	if err := s.repo.SeedStatusCodes(); err != nil {
		return err
	}
	return s.repo.SeedLookups()
}

// ─── Users ───────────────────────────────────────────────────────────────────

func (s *Service) ListUsers(ctx context.Context, page, pageSize int) ([]domain.User, int64, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	return s.repo.ListUsers(page, pageSize)
}

func (s *Service) GetUser(ctx context.Context, id uint) (*UserDetail, error) {
	u, err := s.repo.GetUserWithRoles(id)
	if err != nil {
		return nil, apperrors.NotFound("user not found")
	}
	return u, nil
}

func (s *Service) ActivateUser(ctx context.Context, id uint) error {
	return s.repo.UpdateUserActive(id, true)
}

func (s *Service) DeactivateUser(ctx context.Context, id uint) error {
	return s.repo.UpdateUserActive(id, false)
}

// ─── Roles ───────────────────────────────────────────────────────────────────

func (s *Service) ListRoles(ctx context.Context) ([]domain.Role, error) {
	return s.repo.ListRoles()
}

func (s *Service) GetUserRoles(ctx context.Context, userID uint) ([]string, error) {
	return s.repo.GetUserRoles(userID)
}

func (s *Service) AssignRole(ctx context.Context, userID uint, roleName string, assignedBy uint) error {
	role, err := s.repo.FindRoleByName(roleName)
	if err != nil {
		return apperrors.NotFound("role not found: " + roleName)
	}
	return s.repo.AssignRole(userID, role.ID, assignedBy)
}

func (s *Service) RevokeRole(ctx context.Context, userID uint, roleName string) error {
	role, err := s.repo.FindRoleByName(roleName)
	if err != nil {
		return apperrors.NotFound("role not found: " + roleName)
	}
	return s.repo.RevokeRole(userID, role.ID)
}

// ─── Notifications ───────────────────────────────────────────────────────────

func (s *Service) SendNotification(ctx context.Context, userID uint, title, message, nType string, isBroadcast bool) error {
	n := &domain.Notification{
		UserID:      userID,
		Title:       title,
		Message:     message,
		Type:        nType,
		IsBroadcast: isBroadcast,
		CreatedAt:   time.Now(),
	}
	return s.repo.CreateNotification(n)
}

func (s *Service) GetMyNotifications(ctx context.Context, userID uint, page, pageSize int) ([]domain.Notification, int64, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 20
	}
	return s.repo.ListNotifications(userID, page, pageSize)
}

func (s *Service) MarkRead(ctx context.Context, notifID, userID uint) error {
	return s.repo.MarkNotificationRead(notifID, userID)
}

// ─── Dashboard & Stats ────────────────────────────────────────────────────────

func (s *Service) GetSystemStats(ctx context.Context) (map[string]interface{}, error) {
	return s.repo.GetSystemStats()
}

func (s *Service) GetAuditLogs(ctx context.Context, page, pageSize int) ([]domain.AuditLog, int64, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 50
	}
	return s.repo.GetAuditLogs(page, pageSize)
}

func (s *Service) GetOutboxStats(ctx context.Context) (map[string]interface{}, error) {
	return s.repo.GetOutboxStats()
}

// ─── DTOs ─────────────────────────────────────────────────────────────────────

type UserDetail struct {
	domain.User
	Roles []string `json:"roles"`
}
