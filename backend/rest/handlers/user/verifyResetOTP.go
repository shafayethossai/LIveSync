package user

import (
	"encoding/json"
	"fmt"
	"livesync-backend/util"
	"net/http"
	"regexp"
)

// VerifyResetOTPRequest represents OTP verification for password reset
type VerifyResetOTPRequest struct {
	Email string `json:"email"`
	OTP   string `json:"otp"`
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