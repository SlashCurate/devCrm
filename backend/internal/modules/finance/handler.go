package financemod

import (
	"encoding/json"
	"net/http"
	"strconv"

	"university-erp-backend/internal/platform/middleware"
	"university-erp-backend/internal/platform/response"

	"github.com/gorilla/mux"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) RegisterRoutes(r *mux.Router, authMW mux.MiddlewareFunc) {
	sub := r.PathPrefix("/api/v1/finance").Subrouter()
	sub.Use(authMW)

	sub.HandleFunc("/invoices/me", h.MyInvoices).Methods("GET")
	sub.HandleFunc("/invoices/{student_id:[0-9]+}", h.StudentInvoices).Methods("GET")
	sub.HandleFunc("/payments", h.ProcessPayment).Methods("POST")
}

func (h *Handler) MyInvoices(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	
	// Normally we'd look up student ID by User ID first, but for simplicity assuming student service is called or injected
	// For this demo, let's assume the user ID is passed or we have a utility. We will mock it here using URL query for demo if needed.
	// Actually we should fetch StudentID from DB.
	var studentID uint
	h.service.db.Table("student.students").Where("user_id = ?", userID).Select("id").Scan(&studentID)

	invoices, err := h.service.GetStudentInvoices(r.Context(), studentID)
	if err != nil {
		response.Error(w, err)
		return
	}
	response.JSON(w, http.StatusOK, invoices)
}

func (h *Handler) StudentInvoices(w http.ResponseWriter, r *http.Request) {
	studentID, _ := strconv.ParseUint(mux.Vars(r)["student_id"], 10, 64)
	
	invoices, err := h.service.GetStudentInvoices(r.Context(), uint(studentID))
	if err != nil {
		response.Error(w, err)
		return
	}
	response.JSON(w, http.StatusOK, invoices)
}

func (h *Handler) ProcessPayment(w http.ResponseWriter, r *http.Request) {
	var req PaymentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, err)
		return
	}
	
	payment, err := h.service.ProcessPayment(r.Context(), req)
	if err != nil {
		response.Error(w, err)
		return
	}
	response.JSON(w, http.StatusOK, payment)
}
