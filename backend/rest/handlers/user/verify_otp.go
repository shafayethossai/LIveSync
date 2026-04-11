package user

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"livesync-backend/util"
)

type VerifyOTPRequest struct {
	Email string `json:"email"`
	OTP   string `json:"otp"`
}

type SignupSuccessResponse struct {
	Message string                 `json:"message"`
	User    map[string]interface{} `json:"user"`
	Token   string                 `json:"token,omitempty"`
}

func (h *Handler) VerifyOTP(w http.ResponseWriter, r *http.Request) {
	var req VerifyOTPRequest

	decoder := json.NewDecoder(r.Body)
	err := decoder.Decode(&req)
	if err != nil {
		fmt.Println(err)
		util.SendError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate request
	if req.Email == "" || req.OTP == "" {
		util.SendError(w, http.StatusBadRequest, "Email and OTP are required")
		return
	}

	// Retrieve temporary signup data
	tempSignup, err := h.userRepo.GetTemporarySignupByEmail(req.Email)
	if err != nil {
		fmt.Println("Error fetching temp signup:", err)
		util.SendError(w, http.StatusInternalServerError, "Database error")
		return
	}

	if tempSignup == nil {
		util.SendError(w, http.StatusNotFound, "No signup request found for this email. Please request OTP first.")
		return
	}

	// Validate OTP
	if tempSignup.OTPCode != req.OTP {
		util.SendError(w, http.StatusUnauthorized, "Invalid OTP")
		return
	}

	// Check if OTP is expired
	expiryTime, ok := tempSignup.OTPExpiresAt.(time.Time)
	if !ok {
		// Try to parse if it's a string
		parsedTime, err := time.Parse(time.RFC3339, fmt.Sprintf("%v", tempSignup.OTPExpiresAt))
		if err != nil {
			fmt.Println("Error parsing OTP expiry time:", err)
			util.SendError(w, http.StatusInternalServerError, "Invalid OTP data")
			return
		}
		expiryTime = parsedTime
	}

	if util.IsOTPExpired(expiryTime) {
		util.SendError(w, http.StatusUnauthorized, "OTP has expired. Please request a new OTP.")
		return
	}

	// Create user account
	user, err := h.userRepo.VerifyAndCreateUser(*tempSignup)
	if err != nil {
		fmt.Println("Error creating user:", err)
		util.SendError(w, http.StatusInternalServerError, "Failed to create user account")
		return
	}

	// Delete temporary signup record
	err = h.userRepo.DeleteTemporarySignup(req.Email)
	if err != nil {
		fmt.Println("Warning: Failed to delete temporary signup:", err)
		// Don't return error, user is already created
	}

	// Send welcome email
	smtpConfig := util.NewSMTPConfig()
	go func() {
		err := smtpConfig.SendWelcomeEmail(req.Email, tempSignup.Name)
		if err != nil {
			fmt.Println("Warning: Failed to send welcome email:", err)
		}
	}()

	// Generate JWT token
	claims := util.CustomClaims{
		ID:    user.ID,
		Name:  user.Name,
		Email: user.Email,
		Role:  user.Role,
	}

	token, err := util.CreateJWT("livesync-secret-key-2026-change-in-production", claims)
	if err != nil {
		fmt.Println("Error generating JWT:", err)
		// Don't return error, user is already created
		// Just return without token
	}

	// Return success response
	response := SignupSuccessResponse{
		Message: "Email verified successfully! Your account has been created.",
		User: map[string]interface{}{
			"id":         user.ID,
			"name":       user.Name,
			"email":      user.Email,
			"phone":      user.Phone,
			"avatar_url": user.AvatarURL,
			"role":       user.Role,
			"created_at": user.CreatedAt,
		},
		Token: token,
	}

	util.SendData(w, http.StatusCreated, response)
}
