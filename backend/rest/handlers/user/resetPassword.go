package user

import (
	"encoding/json"
	"fmt"
	"livesync-backend/util"
	"net/http"
	"regexp"

	"golang.org/x/crypto/bcrypt"
)

// ResetPasswordRequest represents the final password reset
type ResetPasswordRequest struct {
	Email       string `json:"email"`
	OTP         string `json:"otp"`
	NewPassword string `json:"new_password"`
}

// ResetPassword handles the actual password reset
func (h *Handler) ResetPassword(w http.ResponseWriter, r *http.Request) {
	var req ResetPasswordRequest

	decoder := json.NewDecoder(r.Body)
	err := decoder.Decode(&req)
	if err != nil {
		util.SendError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate inputs
	if req.Email == "" || req.OTP == "" || req.NewPassword == "" {
		util.SendError(w, http.StatusBadRequest, "Email, OTP, and new password are required")
		return
	}

	if !isValidEmail(req.Email) {
		util.SendError(w, http.StatusBadRequest, "Invalid email format")
		return
	}

	// Validate OTP format
	matched, _ := regexp.MatchString(`^\d{6}$`, req.OTP)
	if !matched {
		util.SendError(w, http.StatusBadRequest, "OTP must be 6 digits")
		return
	}

	// Validate password
	if len(req.NewPassword) < 6 {
		util.SendError(w, http.StatusBadRequest, "Password must be at least 6 characters long")
		return
	}

	// Find user by email
	user, err := h.userRepo.FindByEmail(req.Email, "")
	if err != nil {
		fmt.Println("Error finding user:", err)
		util.SendError(w, http.StatusInternalServerError, "Database error")
		return
	}
	if user == nil {
		util.SendError(w, http.StatusUnauthorized, "User not found")
		return
	}

	// Verify OTP first
	isValid, err := h.userRepo.VerifyPasswordResetOTP(user.ID, req.OTP)
	if err != nil {
		fmt.Println("Error verifying OTP:", err)
		util.SendError(w, http.StatusInternalServerError, "Failed to verify OTP")
		return
	}
	if !isValid {
		util.SendError(w, http.StatusUnauthorized, "Invalid or expired OTP")
		return
	}

	// Hash new password
	hashedPassword, err := bcrypt.GenerateFromPassword(
		[]byte(req.NewPassword),
		bcrypt.DefaultCost,
	)
	if err != nil {
		fmt.Println("Error hashing password:", err)
		util.SendError(w, http.StatusInternalServerError, "Failed to process password reset")
		return
	}

	// Update password (pass hashed password)
	err = h.userRepo.UpdatePassword(user.ID, string(hashedPassword))
	if err != nil {
		fmt.Println("Error updating password:", err)
		util.SendError(w, http.StatusInternalServerError, "Failed to update password")
		return
	}

	// Clear OTP after successful reset
	err = h.userRepo.ClearPasswordResetOTP(user.ID)
	if err != nil {
		fmt.Println("Warning: failed to clear OTP:", err)
	}

	// Send password change confirmation email
	smtpConfig := util.NewSMTPConfig()
	err = smtpConfig.SendPasswordChangedEmail(req.Email)
	if err != nil {
		fmt.Println("Warning: failed to send confirmation email:", err)
	}

	util.SendData(w, http.StatusOK, map[string]interface{}{
		"message": "Password reset successfully",
		"email":   req.Email,
	})
}
