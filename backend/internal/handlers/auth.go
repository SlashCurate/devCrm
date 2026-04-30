package handlers

import (
	"encoding/json"
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
