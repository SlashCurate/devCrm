package adminmod

import (
	"encoding/json"
	"net/http"
	"strconv"

	"university-erp-backend/internal/platform/middleware"
	"university-erp-backend/internal/platform/response"

	"github.com/gorilla/mux"
)

type Handler struct{ service *Service }

func NewHandler(service *Service) *Handler { return &Handler{service: service} }

func (h *Handler) RegisterRoutes(r *mux.Router, authMW mux.MiddlewareFunc) {
	api := r.PathPrefix("/api/v1/admin").Subrouter()
	api.Use(authMW)

	// System stats & health (university_admin only)
	api.Handle("/stats", middleware.RequireRoles(middleware.RoleUniversityAdmin)(http.HandlerFunc(h.Stats))).Methods("GET")
	api.Handle("/audit-logs", middleware.RequireRoles(middleware.RoleUniversityAdmin)(http.HandlerFunc(h.AuditLogs))).Methods("GET")
	api.Handle("/outbox-stats", middleware.RequireRoles(middleware.RoleUniversityAdmin)(http.HandlerFunc(h.OutboxStats))).Methods("GET")
	api.Handle("/seed", middleware.RequireRoles(middleware.RoleUniversityAdmin)(http.HandlerFunc(h.Seed))).Methods("POST")

	// User management
	api.Handle("/users", middleware.RequireRoles(middleware.RoleUniversityAdmin, middleware.RoleCollegeAdmin)(http.HandlerFunc(h.ListUsers))).Methods("GET")
	api.Handle("/users/{id:[0-9]+}", middleware.RequireRoles(middleware.RoleUniversityAdmin)(http.HandlerFunc(h.GetUser))).Methods("GET")
	api.Handle("/users/{id:[0-9]+}/activate", middleware.RequireRoles(middleware.RoleUniversityAdmin)(http.HandlerFunc(h.ActivateUser))).Methods("POST")
	api.Handle("/users/{id:[0-9]+}/deactivate", middleware.RequireRoles(middleware.RoleUniversityAdmin)(http.HandlerFunc(h.DeactivateUser))).Methods("POST")

	// Role management
	api.Handle("/roles", middleware.RequireRoles(middleware.RoleUniversityAdmin)(http.HandlerFunc(h.ListRoles))).Methods("GET")
	api.Handle("/users/{id:[0-9]+}/roles", middleware.RequireRoles(middleware.RoleUniversityAdmin)(http.HandlerFunc(h.GetUserRoles))).Methods("GET")
	api.Handle("/users/{id:[0-9]+}/roles/assign", middleware.RequireRoles(middleware.RoleUniversityAdmin)(http.HandlerFunc(h.AssignRole))).Methods("POST")
	api.Handle("/users/{id:[0-9]+}/roles/revoke", middleware.RequireRoles(middleware.RoleUniversityAdmin)(http.HandlerFunc(h.RevokeRole))).Methods("POST")

	// Notifications (all authenticated users)
	api.HandleFunc("/notifications", h.MyNotifications).Methods("GET")
	api.HandleFunc("/notifications/{id:[0-9]+}/read", h.MarkRead).Methods("POST")
	api.Handle("/notifications/send", middleware.RequireRoles(middleware.RoleUniversityAdmin)(http.HandlerFunc(h.SendNotification))).Methods("POST")
}

func (h *Handler) Stats(w http.ResponseWriter, r *http.Request) {
	data, err := h.service.GetSystemStats(r.Context())
	if err != nil {
		response.Error(w, err)
		return
	}
	response.JSON(w, http.StatusOK, data)
}

func (h *Handler) AuditLogs(w http.ResponseWriter, r *http.Request) {
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	pageSize, _ := strconv.Atoi(r.URL.Query().Get("page_size"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 50
	}
	data, total, err := h.service.GetAuditLogs(r.Context(), page, pageSize)
	if err != nil {
		response.Error(w, err)
		return
	}
	response.List(w, data, total, page, pageSize)
}

func (h *Handler) OutboxStats(w http.ResponseWriter, r *http.Request) {
	data, err := h.service.GetOutboxStats(r.Context())
	if err != nil {
		response.Error(w, err)
		return
	}
	response.JSON(w, http.StatusOK, data)
}

func (h *Handler) Seed(w http.ResponseWriter, r *http.Request) {
	if err := h.service.SeedAll(r.Context()); err != nil {
		response.Error(w, err)
		return
	}
	response.JSON(w, http.StatusOK, map[string]string{"message": "seed data applied successfully"})
}

func (h *Handler) ListUsers(w http.ResponseWriter, r *http.Request) {
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	pageSize, _ := strconv.Atoi(r.URL.Query().Get("page_size"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 20
	}
	data, total, err := h.service.ListUsers(r.Context(), page, pageSize)
	if err != nil {
		response.Error(w, err)
		return
	}
	response.List(w, data, total, page, pageSize)
}

func (h *Handler) GetUser(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseUint(mux.Vars(r)["id"], 10, 64)
	data, err := h.service.GetUser(r.Context(), uint(id))
	if err != nil {
		response.Error(w, err)
		return
	}
	response.JSON(w, http.StatusOK, data)
}

func (h *Handler) ActivateUser(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseUint(mux.Vars(r)["id"], 10, 64)
	if err := h.service.ActivateUser(r.Context(), uint(id)); err != nil {
		response.Error(w, err)
		return
	}
	response.JSON(w, http.StatusOK, map[string]string{"message": "user activated"})
}

func (h *Handler) DeactivateUser(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseUint(mux.Vars(r)["id"], 10, 64)
	if err := h.service.DeactivateUser(r.Context(), uint(id)); err != nil {
		response.Error(w, err)
		return
	}
	response.JSON(w, http.StatusOK, map[string]string{"message": "user deactivated"})
}

func (h *Handler) ListRoles(w http.ResponseWriter, r *http.Request) {
	data, err := h.service.ListRoles(r.Context())
	if err != nil {
		response.Error(w, err)
		return
	}
	response.JSON(w, http.StatusOK, data)
}

func (h *Handler) GetUserRoles(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseUint(mux.Vars(r)["id"], 10, 64)
	data, err := h.service.GetUserRoles(r.Context(), uint(id))
	if err != nil {
		response.Error(w, err)
		return
	}
	response.JSON(w, http.StatusOK, data)
}

func (h *Handler) AssignRole(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseUint(mux.Vars(r)["id"], 10, 64)
	var req struct {
		RoleName string `json:"role_name"`
	}
	json.NewDecoder(r.Body).Decode(&req)
	assignedBy := middleware.GetUserID(r.Context())
	if err := h.service.AssignRole(r.Context(), uint(id), req.RoleName, assignedBy); err != nil {
		response.Error(w, err)
		return
	}
	response.JSON(w, http.StatusOK, map[string]string{"message": "role assigned"})
}

func (h *Handler) RevokeRole(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseUint(mux.Vars(r)["id"], 10, 64)
	var req struct {
		RoleName string `json:"role_name"`
	}
	json.NewDecoder(r.Body).Decode(&req)
	if err := h.service.RevokeRole(r.Context(), uint(id), req.RoleName); err != nil {
		response.Error(w, err)
		return
	}
	response.JSON(w, http.StatusOK, map[string]string{"message": "role revoked"})
}

func (h *Handler) MyNotifications(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	pageSize, _ := strconv.Atoi(r.URL.Query().Get("page_size"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 20
	}
	data, total, err := h.service.GetMyNotifications(r.Context(), userID, page, pageSize)
	if err != nil {
		response.Error(w, err)
		return
	}
	response.List(w, data, total, page, pageSize)
}

func (h *Handler) MarkRead(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseUint(mux.Vars(r)["id"], 10, 64)
	userID := middleware.GetUserID(r.Context())
	if err := h.service.MarkRead(r.Context(), uint(id), userID); err != nil {
		response.Error(w, err)
		return
	}
	response.JSON(w, http.StatusOK, map[string]string{"message": "notification marked as read"})
}

func (h *Handler) SendNotification(w http.ResponseWriter, r *http.Request) {
	var req struct {
		UserID      uint   `json:"user_id"`
		Title       string `json:"title"`
		Message     string `json:"message"`
		Type        string `json:"type"`
		IsBroadcast bool   `json:"is_broadcast"`
	}
	json.NewDecoder(r.Body).Decode(&req)
	if req.Type == "" {
		req.Type = "info"
	}
	if err := h.service.SendNotification(r.Context(), req.UserID, req.Title, req.Message, req.Type, req.IsBroadcast); err != nil {
		response.Error(w, err)
		return
	}
	response.JSON(w, http.StatusOK, map[string]string{"message": "notification sent"})
}
