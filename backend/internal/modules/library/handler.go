package librarymod

import (
	"encoding/json"
	"net/http"
	"strconv"

	"university-erp-backend/internal/domain"
	"university-erp-backend/internal/platform/middleware"
	"university-erp-backend/internal/platform/response"

	"github.com/gorilla/mux"
)

type Handler struct{ service *Service }

func NewHandler(service *Service) *Handler { return &Handler{service: service} }

func (h *Handler) RegisterRoutes(r *mux.Router, authMW mux.MiddlewareFunc) {
	api := r.PathPrefix("/api/v1/library").Subrouter()
	api.Use(authMW)

	// Stats
	api.HandleFunc("/stats", h.Stats).Methods("GET")

	// Authors
	api.HandleFunc("/authors", h.ListAuthors).Methods("GET")
	api.Handle("/authors", middleware.RequireRoles(middleware.RoleLibrarian, middleware.RoleUniversityAdmin)(http.HandlerFunc(h.CreateAuthor))).Methods("POST")

	// Books
	api.HandleFunc("/books", h.ListBooks).Methods("GET")
	api.HandleFunc("/books/{id:[0-9]+}", h.GetBook).Methods("GET")
	api.HandleFunc("/books/{id:[0-9]+}/copies", h.GetBookCopies).Methods("GET")
	api.Handle("/books", middleware.RequireRoles(middleware.RoleLibrarian, middleware.RoleUniversityAdmin)(http.HandlerFunc(h.AddBook))).Methods("POST")
	api.Handle("/books/{id:[0-9]+}", middleware.RequireRoles(middleware.RoleLibrarian, middleware.RoleUniversityAdmin)(http.HandlerFunc(h.UpdateBook))).Methods("PUT")

	// Circulation (issue & return) — librarian only
	api.Handle("/issue", middleware.RequireRoles(middleware.RoleLibrarian, middleware.RoleUniversityAdmin)(http.HandlerFunc(h.IssueBook))).Methods("POST")
	api.Handle("/return/{id:[0-9]+}", middleware.RequireRoles(middleware.RoleLibrarian, middleware.RoleUniversityAdmin)(http.HandlerFunc(h.ReturnBook))).Methods("POST")
	api.Handle("/circulations/active", middleware.RequireRoles(middleware.RoleLibrarian, middleware.RoleUniversityAdmin)(http.HandlerFunc(h.ActiveCirculations))).Methods("GET")
	api.HandleFunc("/circulations/me", h.MyCirculations).Methods("GET")
	api.Handle("/overdue/process", middleware.RequireRoles(middleware.RoleLibrarian, middleware.RoleUniversityAdmin)(http.HandlerFunc(h.ProcessOverdue))).Methods("POST")

	// Fines
	api.HandleFunc("/fines/me", h.MyFines).Methods("GET")
	api.Handle("/fines/{id:[0-9]+}/pay", middleware.RequireRoles(middleware.RoleLibrarian, middleware.RoleUniversityAdmin)(http.HandlerFunc(h.PayFine))).Methods("POST")

	// Reservations
	api.HandleFunc("/reservations", h.ReserveBook).Methods("POST")
	api.HandleFunc("/reservations/me", h.MyReservations).Methods("GET")
	api.HandleFunc("/reservations/{id:[0-9]+}", h.CancelReservation).Methods("DELETE")

	// Digital Resources
	api.HandleFunc("/digital-resources", h.ListDigitalResources).Methods("GET")
	api.Handle("/digital-resources", middleware.RequireRoles(middleware.RoleLibrarian, middleware.RoleUniversityAdmin)(http.HandlerFunc(h.AddDigitalResource))).Methods("POST")

	// Purchase Requests
	api.Handle("/purchase-requests", middleware.RequireRoles(middleware.RoleLibrarian, middleware.RoleUniversityAdmin)(http.HandlerFunc(h.ListPurchaseRequests))).Methods("GET")
	api.HandleFunc("/purchase-requests", h.CreatePurchaseRequest).Methods("POST")
	api.Handle("/purchase-requests/{id:[0-9]+}/approve", middleware.RequireRoles(middleware.RoleLibrarian, middleware.RoleUniversityAdmin)(http.HandlerFunc(h.ApprovePurchaseRequest))).Methods("POST")
}

func (h *Handler) Stats(w http.ResponseWriter, r *http.Request) {
	data, err := h.service.GetStats(r.Context())
	if err != nil {
		response.Error(w, err)
		return
	}
	response.JSON(w, http.StatusOK, data)
}

func (h *Handler) ListAuthors(w http.ResponseWriter, r *http.Request) {
	data, err := h.service.ListAuthors(r.Context())
	if err != nil {
		response.Error(w, err)
		return
	}
	response.JSON(w, http.StatusOK, data)
}

func (h *Handler) CreateAuthor(w http.ResponseWriter, r *http.Request) {
	var a domain.Author
	json.NewDecoder(r.Body).Decode(&a)
	if err := h.service.CreateAuthor(r.Context(), &a); err != nil {
		response.Error(w, err)
		return
	}
	response.Created(w, a)
}

func (h *Handler) ListBooks(w http.ResponseWriter, r *http.Request) {
	search := r.URL.Query().Get("search")
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	pageSize, _ := strconv.Atoi(r.URL.Query().Get("page_size"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 20
	}
	data, total, err := h.service.ListBooks(r.Context(), search, page, pageSize)
	if err != nil {
		response.Error(w, err)
		return
	}
	response.List(w, data, total, page, pageSize)
}

func (h *Handler) GetBook(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseUint(mux.Vars(r)["id"], 10, 64)
	data, err := h.service.GetBook(r.Context(), uint(id))
	if err != nil {
		response.Error(w, err)
		return
	}
	response.JSON(w, http.StatusOK, data)
}

func (h *Handler) GetBookCopies(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseUint(mux.Vars(r)["id"], 10, 64)
	data, err := h.service.GetBookCopies(r.Context(), uint(id))
	if err != nil {
		response.Error(w, err)
		return
	}
	response.JSON(w, http.StatusOK, data)
}

func (h *Handler) AddBook(w http.ResponseWriter, r *http.Request) {
	var req struct {
		domain.Book
		Copies int `json:"copies"`
	}
	json.NewDecoder(r.Body).Decode(&req)
	if err := h.service.AddBook(r.Context(), &req.Book, req.Copies); err != nil {
		response.Error(w, err)
		return
	}
	response.Created(w, req.Book)
}

func (h *Handler) UpdateBook(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseUint(mux.Vars(r)["id"], 10, 64)
	var b domain.Book
	json.NewDecoder(r.Body).Decode(&b)
	if err := h.service.UpdateBook(r.Context(), uint(id), &b); err != nil {
		response.Error(w, err)
		return
	}
	response.JSON(w, http.StatusOK, b)
}

func (h *Handler) IssueBook(w http.ResponseWriter, r *http.Request) {
	var req struct {
		BookID    uint `json:"book_id"`
		StudentID uint `json:"student_id"`
	}
	json.NewDecoder(r.Body).Decode(&req)
	issuedBy := middleware.GetUserID(r.Context())
	data, err := h.service.IssueBook(r.Context(), req.BookID, req.StudentID, issuedBy)
	if err != nil {
		response.Error(w, err)
		return
	}
	response.Created(w, data)
}

func (h *Handler) ReturnBook(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseUint(mux.Vars(r)["id"], 10, 64)
	data, err := h.service.ReturnBook(r.Context(), uint(id))
	if err != nil {
		response.Error(w, err)
		return
	}
	response.JSON(w, http.StatusOK, data)
}

func (h *Handler) ActiveCirculations(w http.ResponseWriter, r *http.Request) {
	data, err := h.service.ListActiveCirculations(r.Context())
	if err != nil {
		response.Error(w, err)
		return
	}
	response.JSON(w, http.StatusOK, data)
}

func (h *Handler) MyCirculations(w http.ResponseWriter, r *http.Request) {
	// Student's user linked to student record — for simplicity, accept student_id query param
	// In production, lookup via user_id → student record
	studentID, _ := strconv.ParseUint(r.URL.Query().Get("student_id"), 10, 64)
	data, err := h.service.GetStudentCirculations(r.Context(), uint(studentID))
	if err != nil {
		response.Error(w, err)
		return
	}
	response.JSON(w, http.StatusOK, data)
}

func (h *Handler) ProcessOverdue(w http.ResponseWriter, r *http.Request) {
	count, err := h.service.ProcessOverdue(r.Context())
	if err != nil {
		response.Error(w, err)
		return
	}
	response.JSON(w, http.StatusOK, map[string]interface{}{
		"processed": count,
		"message":   "overdue fines processed and emitted to finance",
	})
}

func (h *Handler) MyFines(w http.ResponseWriter, r *http.Request) {
	studentID, _ := strconv.ParseUint(r.URL.Query().Get("student_id"), 10, 64)
	data, err := h.service.GetStudentFines(r.Context(), uint(studentID))
	if err != nil {
		response.Error(w, err)
		return
	}
	response.JSON(w, http.StatusOK, data)
}

func (h *Handler) PayFine(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseUint(mux.Vars(r)["id"], 10, 64)
	if err := h.service.PayFine(r.Context(), uint(id)); err != nil {
		response.Error(w, err)
		return
	}
	response.JSON(w, http.StatusOK, map[string]string{"message": "fine paid"})
}

func (h *Handler) ReserveBook(w http.ResponseWriter, r *http.Request) {
	var req struct {
		BookID    uint `json:"book_id"`
		StudentID uint `json:"student_id"`
	}
	json.NewDecoder(r.Body).Decode(&req)
	data, err := h.service.ReserveBook(r.Context(), req.BookID, req.StudentID)
	if err != nil {
		response.Error(w, err)
		return
	}
	response.Created(w, data)
}

func (h *Handler) MyReservations(w http.ResponseWriter, r *http.Request) {
	studentID, _ := strconv.ParseUint(r.URL.Query().Get("student_id"), 10, 64)
	data, err := h.service.GetMyReservations(r.Context(), uint(studentID))
	if err != nil {
		response.Error(w, err)
		return
	}
	response.JSON(w, http.StatusOK, data)
}

func (h *Handler) CancelReservation(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseUint(mux.Vars(r)["id"], 10, 64)
	studentID, _ := strconv.ParseUint(r.URL.Query().Get("student_id"), 10, 64)
	if err := h.service.CancelReservation(r.Context(), uint(id), uint(studentID)); err != nil {
		response.Error(w, err)
		return
	}
	response.JSON(w, http.StatusOK, map[string]string{"message": "reservation cancelled"})
}

func (h *Handler) ListDigitalResources(w http.ResponseWriter, r *http.Request) {
	resourceType := r.URL.Query().Get("type")
	data, err := h.service.ListDigitalResources(r.Context(), resourceType)
	if err != nil {
		response.Error(w, err)
		return
	}
	response.JSON(w, http.StatusOK, data)
}

func (h *Handler) AddDigitalResource(w http.ResponseWriter, r *http.Request) {
	var dr domain.DigitalResource
	json.NewDecoder(r.Body).Decode(&dr)
	if err := h.service.AddDigitalResource(r.Context(), &dr); err != nil {
		response.Error(w, err)
		return
	}
	response.Created(w, dr)
}

func (h *Handler) ListPurchaseRequests(w http.ResponseWriter, r *http.Request) {
	data, err := h.service.ListPurchaseRequests(r.Context())
	if err != nil {
		response.Error(w, err)
		return
	}
	response.JSON(w, http.StatusOK, data)
}

func (h *Handler) CreatePurchaseRequest(w http.ResponseWriter, r *http.Request) {
	var pr domain.PurchaseRequest
	json.NewDecoder(r.Body).Decode(&pr)
	pr.RequestedBy = middleware.GetUserID(r.Context())
	if err := h.service.CreatePurchaseRequest(r.Context(), &pr); err != nil {
		response.Error(w, err)
		return
	}
	response.Created(w, pr)
}

func (h *Handler) ApprovePurchaseRequest(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseUint(mux.Vars(r)["id"], 10, 64)
	approvedBy := middleware.GetUserID(r.Context())
	if err := h.service.ApprovePurchaseRequest(r.Context(), uint(id), approvedBy); err != nil {
		response.Error(w, err)
		return
	}
	response.JSON(w, http.StatusOK, map[string]string{"message": "purchase request approved"})
}
