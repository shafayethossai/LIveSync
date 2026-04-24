package user

import (
	"encoding/json"
	"fmt"
	"net/http"
	"regexp"

	"livesync-backend/util"

	"golang.org/x/crypto/bcrypt"
)

// ForgotPasswordRequest represents a forgot password request
type ForgotPasswordRequest struct {
	Email string `json:"email"`
}

// VerifyResetOTPRequest represents OTP verification for password reset
type VerifyResetOTPRequest struct {
	Email string `json:"email"`
	OTP   string `json:"otp"`
}

// ResetPasswordRequest represents the final password reset
type ResetPasswordRequest struct {
	Email       string `json:"email"`
	OTP         string `json:"otp"`
	NewPassword string `json:"new_password"`
}

// ForgotPassword handles forgotten password OTP request
func (h *Handler) ForgotPassword(w http.ResponseWriter, r *http.Request) {
	var req ForgotPasswordRequest

	decoder := json.NewDecoder(r.Body)
	err := decoder.Decode(&req)
	if err != nil {
		util.SendError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate email
	if req.Email == "" {
		util.SendError(w, http.StatusBadRequest, "Email is required")
		return
	}

	if !isValidEmail(req.Email) {
		util.SendError(w, http.StatusBadRequest, "Invalid email format")
		return
	}

	// Check if user exists
	user, err := h.userRepo.FindByEmail(req.Email, "")
	if err != nil {
		fmt.Println("Error checking email:", err)
		util.SendError(w, http.StatusInternalServerError, "Database error")
		return
	}
	if user == nil {
		// For security, don't reveal if email exists
		util.SendData(w, http.StatusOK, map[string]interface{}{
			"message": "If this email exists, a reset code has been sent",
			"email":   req.Email,
		})
		return
	}

	// Generate OTP
	otp := util.GenerateOTP()
	otpExpiry := util.GetOTPExpiry()

	// Save OTP to user record
	err = h.userRepo.SetPasswordResetOTP(user.ID, otp, otpExpiry)
	if err != nil {
		fmt.Println("Error saving reset OTP:", err)
		util.SendError(w, http.StatusInternalServerError, "Failed to process password reset request")
		return
	}

	// Send OTP via email
	smtpConfig := util.NewSMTPConfig()
	err = smtpConfig.SendPasswordResetEmail(req.Email, otp)
	if err != nil {
		fmt.Println("Error sending password reset email:", err)
		// Don't fail the request if email fails, just log it
	}

	util.SendData(w, http.StatusOK, map[string]interface{}{
		"message": "Password reset code sent to your email",
		"email":   req.Email,
	})
}

// VerifyResetOTP handles OTP verification for password reset
func (h *Handler) VerifyResetOTP(w http.ResponseWriter, r *http.Request) {
	var req VerifyResetOTPRequest

	decoder := json.NewDecoder(r.Body)
	err := decoder.Decode(&req)
	if err != nil {
		util.SendError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate inputs
	if req.Email == "" || req.OTP == "" {
		util.SendError(w, http.StatusBadRequest, "Email and OTP are required")
		return
	}

	if !isValidEmail(req.Email) {
		util.SendError(w, http.StatusBadRequest, "Invalid email format")
		return
	}

	// Validate OTP format (should be 6 digits)
	matched, _ := regexp.MatchString(`^\d{6}$`, req.OTP)
	if !matched {
		util.SendError(w, http.StatusBadRequest, "OTP must be 6 digits")
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

	// Verify OTP
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

	util.SendData(w, http.StatusOK, map[string]interface{}{
		"message": "OTP verified successfully",
		"email":   req.Email,
	})
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
