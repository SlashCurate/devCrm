package utils

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
	"university-erp-backend/internal/db"
	"university-erp-backend/internal/models"
)

type Response struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

func JSONResponse(w http.ResponseWriter, status int, success bool, message string, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(Response{
		Success: success,
		Message: message,
		Data:    data,
	})
}

func ErrorResponse(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(Response{
		Success: false,
		Error:   message,
	})
}

func GenerateResetToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

func GenerateEnrollmentNumber() string {
	year := time.Now().Year()
	bytes := make([]byte, 4)
	rand.Read(bytes)
	return fmt.Sprintf("ENR-%d-%s", year, hex.EncodeToString(bytes)[:6])
}

func GenerateReceiptNumber() string {
	bytes := make([]byte, 4)
	rand.Read(bytes)
	return fmt.Sprintf("RCP-%d-%s", time.Now().Year(), hex.EncodeToString(bytes)[:6])
}

func Ptr[T any](v T) *T {
	return &v
}

// CreateNotification creates a notification for a user (non-blocking)
func CreateNotification(userID string, title, message, notifType, link string) {
	go func() {
		notification := models.Notification{
			UserID:  userID,
			Title:   title,
			Message: message,
			Type:    notifType,
			Link:    link,
			IsRead:  false,
		}
		db.DB.Create(&notification)
	}()
}
