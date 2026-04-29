package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"
	"university-erp-backend/internal/db"
	"university-erp-backend/internal/middleware"
	"university-erp-backend/internal/models"
	"university-erp-backend/internal/utils"

	"github.com/gorilla/mux"
)

// ==================== CREATE BOOK ====================
func CreateBook(w http.ResponseWriter, r *http.Request) {
	var req struct {
		ISBN            string `json:"isbn"`
		Title           string `json:"title"`
		Author          string `json:"author"`
		Publisher       string `json:"publisher"`
		Edition         string `json:"edition"`
		YearPublished   int    `json:"year_published"`
		Category        string `json:"category"`
		RackNumber      string `json:"rack_number"`
		TotalCopies     int    `json:"total_copies"`
		Description     string `json:"description"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	book := models.Book{
		ISBN:            req.ISBN,
		Title:           req.Title,
		Author:          req.Author,
		Publisher:       req.Publisher,
		Edition:         req.Edition,
		YearPublished:   req.YearPublished,
		Category:        req.Category,
		RackNumber:      req.RackNumber,
		TotalCopies:     req.TotalCopies,
		AvailableCopies: req.TotalCopies,
	}

	if err := db.DB.Create(&book).Error; err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to create book")
		return
	}

	utils.JSONResponse(w, http.StatusCreated, true, "Book added successfully", book)
}

// ==================== LIST BOOKS ====================
func ListBooks(w http.ResponseWriter, r *http.Request) {
	search := r.URL.Query().Get("search")
	category := r.URL.Query().Get("category")
	subject := r.URL.Query().Get("subject")
	availableOnly := r.URL.Query().Get("available_only")

	var books []models.Book
	query := db.DB.Where("is_active = ?", true)

	if search != "" {
		query = query.Where("title ILIKE ? OR author ILIKE ? OR isbn ILIKE ?",
			"%"+search+"%", "%"+search+"%", "%"+search+"%")
	}

	if category != "" {
		query = query.Where("category = ?", category)
	}

	if subject != "" {
		query = query.Where("subject = ?", subject)
	}

	if availableOnly == "true" {
		query = query.Where("available_copies > 0")
	}

	if err := query.Order("created_at DESC").Find(&books).Error; err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to fetch books")
		return
	}

	utils.JSONResponse(w, http.StatusOK, true, "Books fetched", books)
}

// ==================== GET BOOK BY ID ====================
func GetBookByID(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(mux.Vars(r)["id"])

	var book models.Book
	if err := db.DB.Preload("Borrowings.Student").First(&book, id).Error; err != nil {
		utils.ErrorResponse(w, http.StatusNotFound, "Book not found")
		return
	}

	utils.JSONResponse(w, http.StatusOK, true, "Book fetched", book)
}

// ==================== UPDATE BOOK ====================
func UpdateBook(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(mux.Vars(r)["id"])

	var req struct {
		Title             string  `json:"title"`
		Author            string  `json:"author"`
		Publisher         string  `json:"publisher"`
		Edition           string  `json:"edition"`
		Category          string  `json:"category"`
		Subject           string  `json:"subject"`
		ShelfLocation     string  `json:"shelf_location"`
		TotalCopies       int     `json:"total_copies"`
		Price             float64 `json:"price"`
		YearOfPublication int     `json:"year_of_publication"`
		Description       string  `json:"description"`
		IsActive          bool    `json:"is_active"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	var book models.Book
	if err := db.DB.First(&book, id).Error; err != nil {
		utils.ErrorResponse(w, http.StatusNotFound, "Book not found")
		return
	}

	updates := map[string]interface{}{
		"title":               req.Title,
		"author":              req.Author,
		"publisher":           req.Publisher,
		"edition":             req.Edition,
		"category":            req.Category,
		"subject":             req.Subject,
		"shelf_location":      req.ShelfLocation,
		"total_copies":        req.TotalCopies,
		"price":               req.Price,
		"year_of_publication": req.YearOfPublication,
		"description":         req.Description,
		"is_active":           req.IsActive,
	}

	db.DB.Model(&book).Updates(updates)

	utils.JSONResponse(w, http.StatusOK, true, "Book updated successfully", book)
}

// ==================== ISSUE BOOK ====================
func IssueBook(w http.ResponseWriter, r *http.Request) {
	var req struct {
		BookID    uint   `json:"book_id"`
		StudentID uint   `json:"student_id"`
		DueDays   int    `json:"due_days"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Check book availability
	var book models.Book
	if err := db.DB.First(&book, req.BookID).Error; err != nil {
		utils.ErrorResponse(w, http.StatusNotFound, "Book not found")
		return
	}

	if book.AvailableCopies <= 0 {
		utils.ErrorResponse(w, http.StatusBadRequest, "Book not available")
		return
	}

	// Check if student already has this book
	var existingTx models.LibraryTransaction
	if err := db.DB.Where("book_id = ? AND user_id = ? AND return_date IS NULL", req.BookID, req.StudentID).
		First(&existingTx).Error; err == nil {
		utils.ErrorResponse(w, http.StatusConflict, "Student already has this book issued")
		return
	}

	// Create transaction record
	dueDays := req.DueDays
	if dueDays == 0 {
		dueDays = 14 // Default 14 days
	}

	transaction := models.LibraryTransaction{
		BookID:     req.BookID,
		UserID:     "", // Will be set from student lookup
		IssuedDate: time.Now(),
		DueDate:    time.Now().AddDate(0, 0, dueDays),
		Status:     "Issued",
		IssuedBy:   "",
	}

	if err := db.DB.Create(&transaction).Error; err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to issue book")
		return
	}

	// Update available copies
	db.DB.Model(&book).Update("available_copies", book.AvailableCopies-1)

	// Notify student
	go utils.CreateNotification("", "Book Issued",
		"'"+book.Title+"' has been issued to you. Due date: "+transaction.DueDate.Format("2006-01-02"), "info", "")

	utils.JSONResponse(w, http.StatusCreated, true, "Book issued successfully", transaction)
}

// ==================== RETURN BOOK ====================
func ReturnBook(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(mux.Vars(r)["id"])

	var transaction models.LibraryTransaction
	if err := db.DB.Preload("Book").First(&transaction, id).Error; err != nil {
		utils.ErrorResponse(w, http.StatusNotFound, "Transaction record not found")
		return
	}

	if transaction.ReturnDate != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Book already returned")
		return
	}

	now := time.Now()
	fineAmount := 0.0

	// Calculate fine if overdue
	if now.After(transaction.DueDate) {
		daysOverdue := int(now.Sub(transaction.DueDate).Hours() / 24)
		fineAmount = float64(daysOverdue) * 10.0 // Rs 10 per day
	}

	updates := map[string]interface{}{
		"return_date":  now,
		"fine_amount":  fineAmount,
		"status":       "returned",
	}

	db.DB.Model(&transaction).Updates(updates)

	// Update available copies
	var book models.Book
	db.DB.First(&book, transaction.BookID)
	db.DB.Model(&book).Update("available_copies", book.AvailableCopies+1)

	// Notify student
	go utils.CreateNotification(transaction.UserID, "Book Returned",
		"'"+transaction.Book.Title+"' has been returned. Fine amount: Rs. "+strconv.FormatFloat(fineAmount, 'f', 2, 64), "success", "")

	utils.JSONResponse(w, http.StatusOK, true, "Book returned successfully", transaction)
}

// ==================== GET MY BORROWINGS (Student) ====================
func GetMyBorrowings(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)

	var student models.Student
	if err := db.DB.Where("user_id = ?", claims.UserID).First(&student).Error; err != nil {
		utils.ErrorResponse(w, http.StatusNotFound, "Student profile not found")
		return
	}

	var transactions []models.LibraryTransaction
	db.DB.Where("user_id = ?", student.UserID).
		Preload("Book").Order("created_at DESC").Find(&transactions)

	utils.JSONResponse(w, http.StatusOK, true, "Transactions fetched", transactions)
}

// ==================== GET ALL BORROWINGS ====================
func GetAllBorrowings(w http.ResponseWriter, r *http.Request) {
	status := r.URL.Query().Get("status")
	overdueOnly := r.URL.Query().Get("overdue_only")

	var transactions []models.LibraryTransaction
	query := db.DB.Preload("Book").Preload("User")

	if status != "" {
		query = query.Where("status = ?", status)
	}

	if overdueOnly == "true" {
		query = query.Where("return_date IS NULL AND due_date < ?", time.Now())
	}

	query.Order("created_at DESC").Find(&transactions)

	utils.JSONResponse(w, http.StatusOK, true, "Transactions fetched", transactions)
}

// ==================== GET LIBRARY DASHBOARD ====================
func LibraryDashboard(w http.ResponseWriter, r *http.Request) {
	var stats struct {
		TotalBooks       int64   `json:"total_books"`
		AvailableBooks   int64   `json:"available_books"`
		BorrowedBooks    int64   `json:"borrowed_books"`
		OverdueBooks     int64   `json:"overdue_books"`
		TotalStudents    int64   `json:"total_students"`
		RecentTransactions []models.LibraryTransaction `json:"recent_transactions"`
	}

	db.DB.Model(&models.Book{}).Where("is_active = ?", true).Count(&stats.TotalBooks)
	db.DB.Model(&models.Book{}).Where("is_active = ?", true).Select("SUM(available_copies)").Scan(&stats.AvailableBooks)
	db.DB.Model(&models.LibraryTransaction{}).Where("return_date IS NULL").Count(&stats.BorrowedBooks)
	db.DB.Model(&models.LibraryTransaction{}).Where("return_date IS NULL AND due_date < ?", time.Now()).Count(&stats.OverdueBooks)
	db.DB.Model(&models.Student{}).Count(&stats.TotalStudents)

	db.DB.Where("return_date IS NULL").Preload("Book").Preload("User").
		Order("due_date ASC").Limit(10).Find(&stats.RecentTransactions)

	utils.JSONResponse(w, http.StatusOK, true, "Dashboard fetched", stats)
}
