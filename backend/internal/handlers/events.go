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

// ==================== CREATE EVENT ====================
func CreateEvent(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Title       string `json:"title"`
		Description string `json:"description"`
		EventType   string `json:"event_type"`
		StartDate   string `json:"start_date"`
		EndDate     string `json:"end_date"`
		Venue       string `json:"venue"`
		Organizer   string `json:"organizer"`
		CollegeID   *uint  `json:"college_id"`
		IsPublic    bool   `json:"is_public"`
		IsHoliday   bool   `json:"is_holiday"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	startDate, _ := time.Parse(time.RFC3339, req.StartDate)
	endDate, _ := time.Parse(time.RFC3339, req.EndDate)

	event := models.Event{
		EventName:   req.Title,
		Description: req.Description,
		EventType:   req.EventType,
		EventDate:   &startDate,
		EndDate:     &endDate,
		Venue:       req.Venue,
		Organizer:   req.Organizer,
		CollegeID:   req.CollegeID,
		IsActive:    req.IsPublic,
	}

	if err := db.DB.Create(&event).Error; err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to create event")
		return
	}

	// Notify all users if public event
	if req.IsPublic {
		go func() {
			var users []models.User
			db.DB.Find(&users)
			for _, user := range users {
				utils.CreateNotification(user.ID, "New Event: "+req.Title,
					"A new "+req.EventType+" event has been scheduled on "+startDate.Format("2006-01-02"), "info", "")
			}
		}()
	}

	utils.JSONResponse(w, http.StatusCreated, true, "Event created successfully", event)
}

// ==================== LIST EVENTS ====================
func ListEvents(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	eventType := r.URL.Query().Get("event_type")
	startDate := r.URL.Query().Get("start_date")
	endDate := r.URL.Query().Get("end_date")
	month := r.URL.Query().Get("month") // YYYY-MM format

	var events []models.Event
	query := db.DB.Preload("College")

	// Filter by visibility
	if claims.Role == models.RoleStudent {
		query = query.Where("is_active = ?", true)
	}

	if eventType != "" {
		query = query.Where("event_type = ?", eventType)
	}

	if startDate != "" {
		sd, _ := time.Parse("2006-01-02", startDate)
		query = query.Where("event_date >= ?", sd)
	}

	if endDate != "" {
		ed, _ := time.Parse("2006-01-02", endDate)
		query = query.Where("end_date <= ?", ed)
	}

	if month != "" {
		// Parse month and filter
		monthTime, _ := time.Parse("2006-01", month)
		startOfMonth := monthTime
		endOfMonth := monthTime.AddDate(0, 1, 0)
		query = query.Where("(event_date >= ? AND event_date < ?) OR (end_date >= ? AND end_date < ?)",
			startOfMonth, endOfMonth, startOfMonth, endOfMonth)
	}

	if err := query.Order("event_date ASC").Find(&events).Error; err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to fetch events")
		return
	}

	utils.JSONResponse(w, http.StatusOK, true, "Events fetched", events)
}

// ==================== GET EVENT BY ID ====================
func GetEventByID(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(mux.Vars(r)["id"])

	var event models.Event
	if err := db.DB.Preload("College").First(&event, id).Error; err != nil {
		utils.ErrorResponse(w, http.StatusNotFound, "Event not found")
		return
	}

	utils.JSONResponse(w, http.StatusOK, true, "Event fetched", event)
}

// ==================== UPDATE EVENT ====================
func UpdateEvent(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(mux.Vars(r)["id"])

	var req struct {
		Title       string `json:"title"`
		Description string `json:"description"`
		EventType   string `json:"event_type"`
		StartDate   string `json:"start_date"`
		EndDate     string `json:"end_date"`
		Venue       string `json:"venue"`
		Organizer   string `json:"organizer"`
		IsPublic    bool   `json:"is_public"`
		IsHoliday   bool   `json:"is_holiday"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	var event models.Event
	if err := db.DB.First(&event, id).Error; err != nil {
		utils.ErrorResponse(w, http.StatusNotFound, "Event not found")
		return
	}

	startDate, _ := time.Parse(time.RFC3339, req.StartDate)
	endDate, _ := time.Parse(time.RFC3339, req.EndDate)

	updates := map[string]interface{}{
		"title":       req.Title,
		"description": req.Description,
		"event_type":  req.EventType,
		"start_date":  startDate,
		"end_date":    endDate,
		"venue":       req.Venue,
		"organizer":   req.Organizer,
		"is_public":   req.IsPublic,
		"is_holiday":  req.IsHoliday,
	}

	db.DB.Model(&event).Updates(updates)

	utils.JSONResponse(w, http.StatusOK, true, "Event updated successfully", event)
}

// ==================== DELETE EVENT ====================
func DeleteEvent(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(mux.Vars(r)["id"])

	var event models.Event
	if err := db.DB.First(&event, id).Error; err != nil {
		utils.ErrorResponse(w, http.StatusNotFound, "Event not found")
		return
	}

	db.DB.Delete(&event)

	utils.JSONResponse(w, http.StatusOK, true, "Event deleted successfully", nil)
}

// ==================== GET UPCOMING EVENTS ====================
func GetUpcomingEvents(w http.ResponseWriter, r *http.Request) {
	limit := 5
	limitStr := r.URL.Query().Get("limit")
	if limitStr != "" {
		limit, _ = strconv.Atoi(limitStr)
	}

	var events []models.Event
	db.DB.Where("start_date >= ? AND is_public = ?", time.Now(), true).
		Order("start_date ASC").Limit(limit).Find(&events)

	utils.JSONResponse(w, http.StatusOK, true, "Upcoming events fetched", events)
}

// ==================== GET HOLIDAYS ====================
func GetHolidays(w http.ResponseWriter, r *http.Request) {
	year := time.Now().Year()
	yearStr := r.URL.Query().Get("year")
	if yearStr != "" {
		year, _ = strconv.Atoi(yearStr)
	}

	var events []models.Event
	db.DB.Where("is_holiday = ? AND EXTRACT(YEAR FROM start_date) = ?", true, year).
		Order("start_date ASC").Find(&events)

	utils.JSONResponse(w, http.StatusOK, true, "Holidays fetched", events)
}
