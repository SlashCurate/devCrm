package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"time"
	"university-erp-backend/internal/db"
	"university-erp-backend/internal/middleware"
	"university-erp-backend/internal/models"
	"university-erp-backend/internal/utils"

	"golang.org/x/crypto/bcrypt"
)

// ==================== LOGIN ====================
func Login(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	var user models.User
	if err := db.DB.Where("email = ? AND is_active = true", req.Email).First(&user).Error; err != nil {
		utils.ErrorResponse(w, http.StatusUnauthorized, "Invalid email or password")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		utils.ErrorResponse(w, http.StatusUnauthorized, "Invalid email or password")
		return
	}

	// Get role name from Role table
	var role models.Role
	roleName := "student"
	log.Printf("[Login] User: %s | RoleID from DB: %d", user.Email, user.RoleID)
	if err := db.DB.First(&role, user.RoleID).Error; err == nil {
		roleName = role.RoleName
		log.Printf("[Login] Role found: %s (ID: %d)", roleName, role.ID)
	} else {
		log.Printf("[Login] Role lookup FAILED for RoleID %d: %v", user.RoleID, err)
	}
	token, err := utils.GenerateToken(user.ID, user.Email, roleName, nil)
	if err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to generate token")
		return
	}

	now := time.Now()
	db.DB.Model(&user).Update("last_login", now)

	utils.JSONResponse(w, http.StatusOK, true, "Login successful", map[string]interface{}{
		"token": token,
		"user": map[string]interface{}{
			"id":       user.ID,
			"username": user.Username,
			"email":    user.Email,
			"role_id":  user.RoleID,
		},
	})
}

// ==================== REGISTER STUDENT (PUBLIC) ====================
func RegisterStudent(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Username  string `json:"username"`
		Email     string `json:"email"`
		Password  string `json:"password"`
		Phone     string `json:"phone"`
		FirstName string `json:"first_name"`
		LastName  string `json:"last_name"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Check duplicate
	var existing models.User
	if err := db.DB.Where("email = ? OR username = ?", req.Email, req.Username).First(&existing).Error; err == nil {
		utils.ErrorResponse(w, http.StatusConflict, "Email or username already exists")
		return
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(req.Password), 14)
	if err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to hash password")
		return
	}

	user := models.User{
		Username:     req.Username,
		Email:        req.Email,
		PasswordHash: string(hashed),
		RoleID:       6, // student role
		IsActive:     true,
	}
	if err := db.DB.Create(&user).Error; err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to create user")
		return
	}

	// Create student profile
	student := models.Student{
		UserID:    user.ID,
		FirstName: req.FirstName,
		LastName:  req.LastName,
		Phone:     req.Phone,
	}
	db.DB.Create(&student)

	utils.JSONResponse(w, http.StatusCreated, true, "Student registered successfully", map[string]interface{}{
		"user_id":    user.ID,
		"student_id": student.ID,
	})
}

// ==================== FORGOT PASSWORD ====================
func ForgotPassword(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email string `json:"email"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	var user models.User
	if err := db.DB.Where("email = ?", req.Email).First(&user).Error; err != nil {
		// Always return success to prevent email enumeration
		utils.JSONResponse(w, http.StatusOK, true, "If the email exists, a reset link has been sent", nil)
		return
	}

	token, err := utils.GenerateResetToken()
	if err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to generate reset token")
		return
	}

	// Store token in user record
	expiresAt := time.Now().Add(time.Hour)
	db.DB.Model(&user).Updates(map[string]interface{}{
		"password_reset_token": token,
		"token_expiry":       expiresAt,
	})

	// Send email (non-blocking)
	go utils.SendPasswordResetEmail(user.Email, token)

	utils.JSONResponse(w, http.StatusOK, true, "If the email exists, a reset link has been sent", nil)
}

// ==================== RESET PASSWORD ====================
func ResetPassword(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Token    string `json:"token"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	var user models.User
	if err := db.DB.Where("password_reset_token = ? AND token_expiry > ?", req.Token, time.Now()).
		First(&user).Error; err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid or expired reset token")
		return
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(req.Password), 14)
	if err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to hash password")
		return
	}

	db.DB.Model(&user).Updates(map[string]interface{}{
		"password_hash":        string(hashed),
		"password_reset_token": "",
		"token_expiry":         nil,
	})

	utils.JSONResponse(w, http.StatusOK, true, "Password reset successfully", nil)
}

// ==================== GET PROFILE ====================
func GetProfile(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)

	var user models.User
	if err := db.DB.Preload("College").First(&user, claims.UserID).Error; err != nil {
		utils.ErrorResponse(w, http.StatusNotFound, "User not found")
		return
	}

	utils.JSONResponse(w, http.StatusOK, true, "Profile fetched", user)
}

// ==================== CHANGE PASSWORD ====================
func ChangePassword(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	var req struct {
		OldPassword string `json:"old_password"`
		NewPassword string `json:"new_password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	var user models.User
	db.DB.First(&user, claims.UserID)

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.OldPassword)); err != nil {
		utils.ErrorResponse(w, http.StatusUnauthorized, "Old password is incorrect")
		return
	}

	hashed, _ := bcrypt.GenerateFromPassword([]byte(req.NewPassword), 14)
	db.DB.Model(&user).Update("password_hash", string(hashed))

	utils.JSONResponse(w, http.StatusOK, true, "Password changed successfully", nil)
}
