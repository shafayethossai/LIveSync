package user

import (
	"encoding/json"
	"fmt"
	"net/http"

	"livesync-backend/util"
)

type ResendOTPRequest struct {
	Email string `json:"email"`
}

func (h *Handler) ResendOTP(w http.ResponseWriter, r *http.Request) {
	var req ResendOTPRequest

	decoder := json.NewDecoder(r.Body)
	err := decoder.Decode(&req)
	if err != nil {
		fmt.Println(err)
		util.SendError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Email == "" {
		util.SendError(w, http.StatusBadRequest, "Email is required")
		return
	}

	// Get existing temporary signup
	tempSignup, err := h.userRepo.GetTemporarySignupByEmail(req.Email)
	if err != nil {
		fmt.Println("Error fetching temp signup:", err)
		util.SendError(w, http.StatusInternalServerError, "Database error")
		return
	}

	if tempSignup == nil {
		util.SendError(w, http.StatusNotFound, "No signup request found for this email")
		return
	}

	// Generate new OTP
	newOTP := util.GenerateOTP()
	newExpiry := util.GetOTPExpiry()

	// Update temporary signup with new OTP
	tempSignup.OTPCode = newOTP
	tempSignup.OTPExpiresAt = newExpiry

	err = h.userRepo.SaveTemporarySignup(*tempSignup)
	if err != nil {
		fmt.Println("Error updating OTP:", err)
		util.SendError(w, http.StatusInternalServerError, "Failed to resend OTP")
		return
	}

	// Send new OTP via email
	smtpConfig := util.NewSMTPConfig()
	err = smtpConfig.SendOTPEmail(req.Email, newOTP)
	if err != nil {
		fmt.Println("Error sending OTP email:", err)
		util.SendError(w, http.StatusInternalServerError, "Failed to send OTP email")
		return
	}

	response := OTPResponse{
		Message: "New OTP sent successfully to your email. Please verify within 10 minutes.",
		Email:   req.Email,
	}
	util.SendData(w, http.StatusOK, response)
}
