package user

import (
	"encoding/json"
	"fmt"
	"net/http"

	"livesync-backend/util"
)

// ForgotPasswordRequest represents a forgot password request
type ForgotPasswordRequest struct {
	Email string `json:"email"`
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
