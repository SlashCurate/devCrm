package handlers

import (
	"encoding/json"
	"fmt"
	"math/rand"
	"net/http"
	"time"
	"university-erp-backend/internal/db"
	"university-erp-backend/internal/middleware"
	"university-erp-backend/internal/models"
	"university-erp-backend/internal/utils"

	"golang.org/x/crypto/bcrypt"
)

// OTP storage (in production, use Redis)
var otpStore = make(map[string]otpEntry)

type otpEntry struct {
	Code      string
	Email     string
	Phone     string
	ExpiresAt time.Time
	Verified  bool
}

// generateOTP generates a 6-digit OTP
func generateOTP() string {
	return fmt.Sprintf("%06d", rand.Intn(1000000))
}

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
	var collegeID *uint

	if err := db.DB.First(&role, user.RoleID).Error; err == nil {
		roleName = role.RoleName
	}

	// Fetch CollegeID based on role for the JWT
	if roleName == models.RoleCollegeAdmin {
		var ca models.CollegeAdmin
		if err := db.DB.Where("user_id = ?", user.ID).First(&ca).Error; err == nil {
			collegeID = &ca.CollegeID
		}
	} else if roleName == models.RoleStudent {
		var st models.Student
		if err := db.DB.Preload("Program.Department").Where("user_id = ?", user.ID).First(&st).Error; err == nil && st.Program != nil {
			collegeID = &st.Program.Department.CollegeID
		}
	} else if roleName == models.RoleFaculty {
		var fa models.Faculty
		if err := db.DB.Preload("Department").Where("user_id = ?", user.ID).First(&fa).Error; err == nil && fa.DepartmentID != nil {
			collegeID = &fa.Department.CollegeID
		}
	}

	token, err := utils.GenerateToken(user.ID, user.Email, roleName, collegeID)
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

// RegisterStudent is no longer used for public applications. Use Apply public route instead.
func RegisterStudent(w http.ResponseWriter, r *http.Request) {
	utils.ErrorResponse(w, http.StatusForbidden, "Use the public application portal to apply.")
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
	if err := db.DB.First(&user, "id = ?", claims.UserID).Error; err != nil {
		utils.ErrorResponse(w, http.StatusNotFound, "User not found")
		return
	}

	var profile interface{}

	switch claims.Role {
	case models.RoleStudent:
		var st models.Student
		db.DB.Preload("Program.Department.College").Where("user_id = ?", claims.UserID).First(&st)
		profile = st
	case models.RoleFaculty:
		var fa models.Faculty
		db.DB.Preload("Department.College").Where("user_id = ?", claims.UserID).First(&fa)
		profile = fa
	case models.RoleUniversityAdmin:
		var ua models.UniversityAdmin
		db.DB.Preload("University").Where("user_id = ?", claims.UserID).First(&ua)
		profile = ua
	case models.RoleCollegeAdmin:
		var ca models.CollegeAdmin
		db.DB.Preload("College").Where("user_id = ?", claims.UserID).First(&ca)
		profile = ca
	default:
		profile = user
	}

	utils.JSONResponse(w, http.StatusOK, true, "Profile fetched", map[string]interface{}{
		"user":    user,
		"profile": profile,
	})
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

// ==================== OTP REGISTRATION FLOW ====================

// SendOTP sends OTP for email or phone verification
func SendOTP(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email string `json:"email"`
		Phone string `json:"phone"`
		Type  string `json:"type"` // "email" or "phone"
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Determine key and validate
	var key string
	if req.Type == "email" && req.Email != "" {
		key = "email_" + req.Email
		// Check if email already exists
		var existing models.User
		if err := db.DB.Where("email = ?", req.Email).First(&existing).Error; err == nil {
			utils.ErrorResponse(w, http.StatusConflict, "Email already registered")
			return
		}
	} else if req.Type == "phone" && req.Phone != "" {
		key = "phone_" + req.Phone
	} else if req.Email != "" && req.Phone != "" {
		// Legacy: both provided
		key = req.Email
	} else {
		utils.ErrorResponse(w, http.StatusBadRequest, "Valid email or phone required with type")
		return
	}

	// Generate and store OTP
	otp := generateOTP()

	otpStore[key] = otpEntry{
		Code:      otp,
		Email:     req.Email,
		Phone:     req.Phone,
		ExpiresAt: time.Now().Add(10 * time.Minute),
		Verified:  false,
	}

	// In production, send via SMS/Email
	// For demo, return OTP in response (shown in console on frontend)
	utils.JSONResponse(w, http.StatusOK, true, "OTP sent successfully", map[string]interface{}{
		"otp":     otp,
		"message": "Check console for demo OTP",
	})
}

// VerifyOTP verifies the OTP
func VerifyOTP(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email string `json:"email"`
		Phone string `json:"phone"`
		OTP   string `json:"otp"`
		Type  string `json:"type"` // "email" or "phone"
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Determine key based on type
	var key string
	if req.Type == "email" && req.Email != "" {
		key = "email_" + req.Email
	} else if req.Type == "phone" && req.Phone != "" {
		key = "phone_" + req.Phone
	} else if req.Email != "" {
		// Legacy fallback
		key = req.Email
	} else if req.Phone != "" {
		key = req.Phone
	} else {
		utils.ErrorResponse(w, http.StatusBadRequest, "Email or phone required")
		return
	}

	entry, exists := otpStore[key]
	if !exists {
		utils.ErrorResponse(w, http.StatusBadRequest, "OTP not found or expired")
		return
	}

	if time.Now().After(entry.ExpiresAt) {
		delete(otpStore, key)
		utils.ErrorResponse(w, http.StatusBadRequest, "OTP expired")
		return
	}

	if entry.Code != req.OTP {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid OTP")
		return
	}

	// Mark as verified
	entry.Verified = true
	otpStore[key] = entry

	utils.JSONResponse(w, http.StatusOK, true, "OTP verified successfully", nil)
}

// RegisterApplicant creates applicant record after OTP verification (no password yet)
func RegisterApplicant(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email     string `json:"email"`
		Phone     string `json:"phone"`
		FirstName string `json:"first_name"`
		LastName  string `json:"last_name"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Check if both email and phone OTPs were verified
	emailKey := "email_" + req.Email
	phoneKey := "phone_" + req.Phone

	emailEntry, emailExists := otpStore[emailKey]
	phoneEntry, phoneExists := otpStore[phoneKey]

	// Require both to be verified
	if (!emailExists || !emailEntry.Verified) && (!phoneExists || !phoneEntry.Verified) {
		// Fallback: check legacy single verification
		legacyEntry, legacyExists := otpStore[req.Email]
		if !legacyExists || !legacyEntry.Verified {
			utils.ErrorResponse(w, http.StatusUnauthorized, "Both email and phone verification required")
			return
		}
	}

	// Check if email already exists in users table
	var existingUser models.User
	if err := db.DB.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		utils.ErrorResponse(w, http.StatusConflict, "Email already registered")
		return
	}

	// Check if email already exists in applicants table
	var existingApplicant models.Applicant
	if err := db.DB.Where("email = ?", req.Email).First(&existingApplicant).Error; err == nil {
		utils.ErrorResponse(w, http.StatusConflict, "Email already has an application")
		return
	}

	// Check if phone already exists in applicants table
	if err := db.DB.Where("phone = ?", req.Phone).First(&existingApplicant).Error; err == nil {
		utils.ErrorResponse(w, http.StatusConflict, "Phone number already has an application")
		return
	}

	// Generate Application Tracking ID (APP-YYYY-XXXX)
	year := time.Now().Year()
	randSuffix := rand.Intn(9000) + 1000
	appID := fmt.Sprintf("APP-%d-%04d", year, randSuffix)

	// Create applicant record (not user yet - user created after enrollment)
	// Use raw SQL to avoid GORM foreign key constraints for optional fields
	result := db.DB.Exec(`
		INSERT INTO admissions.applicants 
		(application_id, email, phone, first_name, last_name, status, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
	`, appID, req.Email, req.Phone, req.FirstName, req.LastName, models.ApplicationDraft)
	
	if result.Error != nil {
		fmt.Printf("DEBUG: Failed to create applicant: %v\n", result.Error)
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to create applicant: "+result.Error.Error())
		return
	}

	// Clean up OTPs
	delete(otpStore, emailKey)
	delete(otpStore, phoneKey)
	delete(otpStore, req.Email)

	utils.JSONResponse(w, http.StatusCreated, true, "Applicant registered successfully", map[string]interface{}{
		"applicant_id": appID,
		"email":        req.Email,
		"phone":        req.Phone,
		"status":       models.ApplicationDraft,
	})
}

// ==================== OTP LOGIN ====================

// SendLoginOTP sends OTP for login
func SendLoginOTP(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email string `json:"email"`
		Phone string `json:"phone"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Find user
	var user models.User
	query := db.DB
	if req.Email != "" {
		query = query.Where("email = ?", req.Email)
	} else if req.Phone != "" {
		// Would need phone field in users table
		utils.ErrorResponse(w, http.StatusBadRequest, "Phone login not implemented")
		return
	} else {
		utils.ErrorResponse(w, http.StatusBadRequest, "Email or phone required")
		return
	}

	if err := query.First(&user).Error; err != nil {
		utils.ErrorResponse(w, http.StatusNotFound, "User not found")
		return
	}

	if !user.IsActive {
		utils.ErrorResponse(w, http.StatusForbidden, "Account is deactivated")
		return
	}

	// Generate OTP
	otp := generateOTP()
	key := "login_" + user.ID

	otpStore[key] = otpEntry{
		Code:      otp,
		Email:     user.Email,
		ExpiresAt: time.Now().Add(10 * time.Minute),
	}

	utils.JSONResponse(w, http.StatusOK, true, "OTP sent successfully", map[string]interface{}{
		"otp": otp,
	})
}

// LoginWithOTP handles OTP-based login
func LoginWithOTP(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email string `json:"email"`
		Phone string `json:"phone"`
		OTP   string `json:"otp"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Find user
	var user models.User
	query := db.DB
	if req.Email != "" {
		query = query.Where("email = ?", req.Email)
	} else {
		utils.ErrorResponse(w, http.StatusBadRequest, "Email required for OTP login")
		return
	}

	if err := query.First(&user).Error; err != nil {
		utils.ErrorResponse(w, http.StatusNotFound, "User not found")
		return
	}

	// Verify OTP
	key := "login_" + user.ID
	entry, exists := otpStore[key]
	if !exists || entry.Code != req.OTP {
		utils.ErrorResponse(w, http.StatusUnauthorized, "Invalid OTP")
		return
	}

	if time.Now().After(entry.ExpiresAt) {
		delete(otpStore, key)
		utils.ErrorResponse(w, http.StatusUnauthorized, "OTP expired")
		return
	}

	// Clean up OTP
	delete(otpStore, key)

	// Get role
	var role models.Role
	roleName := "applicant"
	if err := db.DB.First(&role, user.RoleID).Error; err == nil {
		roleName = role.RoleName
	}

	// Generate token
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
