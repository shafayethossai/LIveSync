package user

import (
	"context"
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

	// Send OTP via email ASYNCHRONOUSLY using background context
	// This prevents the request context cancellation from killing the email goroutine
	smtpConfig := util.NewSMTPConfig()
	go func(ctx context.Context, email, code string) {
		if err := smtpConfig.SendPasswordResetEmail(email, code); err != nil {
			fmt.Printf("❌ [ForgotPassword] Error sending password reset email to %s: %v\n", email, err)
			fmt.Printf("❌ [ForgotPassword] SMTP Config - Host: %s, Port: %s, User: %s, From: %s\n",
				smtpConfig.Host, smtpConfig.Port, smtpConfig.User, smtpConfig.From)
		} else {
			fmt.Printf("✅ [ForgotPassword] Password reset email sent successfully to %s\n", email)
		}
	}(context.Background(), req.Email, otp)

	util.SendData(w, http.StatusOK, map[string]interface{}{
		"message": "Password reset code sent to your email",
		"email":   req.Email,
	})
}
