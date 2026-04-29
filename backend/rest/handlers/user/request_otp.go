package user

import (
	"encoding/json"
	"fmt"
	"net/http"
	"regexp"

	"livesync-backend/repo"
	"livesync-backend/util"
)

type RequestOTPRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
	Phone    string `json:"phone,omitempty"`
	Role     string `json:"role,omitempty"`
}

type OTPResponse struct {
	Message string `json:"message"`
	Email   string `json:"email"`
}

func isValidEmail(email string) bool {
	pattern := `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`
	matched, _ := regexp.MatchString(pattern, email)
	return matched
}

func (h *Handler) RequestOTP(w http.ResponseWriter, r *http.Request) {
	var req RequestOTPRequest

	decoder := json.NewDecoder(r.Body)
	err := decoder.Decode(&req)
	if err != nil {
		fmt.Println(err)
		util.SendError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate required fields
	if req.Name == "" || req.Email == "" || req.Password == "" {
		util.SendError(w, http.StatusBadRequest, "Name, email, and password are required")
		return
	}

	// Validate email format
	if !isValidEmail(req.Email) {
		util.SendError(w, http.StatusBadRequest, "Invalid email format")
		return
	}

	// Validate password length
	if len(req.Password) < 6 {
		util.SendError(w, http.StatusBadRequest, "Password must be at least 6 characters long")
		return
	}

	// Set default role
	role := req.Role
	if role == "" {
		role = "tenant"
	}

	// Check if email already exists in users table
	user, err := h.userRepo.FindByEmail(req.Email, "")
	if err != nil {
		fmt.Println("Error checking email:", err)
		util.SendError(w, http.StatusInternalServerError, "Database error")
		return
	}
	if user != nil {
		util.SendError(w, http.StatusConflict, "Email already registered")
		return
	}

	// Generate OTP
	otp := util.GenerateOTP()
	otpExpiry := util.GetOTPExpiry()

	// Store temporary signup data with OTP
	tempSignup := repo.TemporarySignup{
		Name:         req.Name,
		Email:        req.Email,
		Password:     req.Password,
		Phone:        req.Phone,
		Role:         role,
		OTPCode:      otp,
		OTPExpiresAt: otpExpiry,
	}

	err = h.userRepo.SaveTemporarySignup(tempSignup)
	if err != nil {
		fmt.Println("Error saving temp signup:", err)
		util.SendError(w, http.StatusInternalServerError, "Failed to process signup request")
		return
	}

	// Send OTP via email SYNCHRONOUSLY
	smtpConfig := util.NewSMTPConfig()
	fmt.Println("=== Sending OTP ===")
	fmt.Printf("To: %s\n", req.Email)
	fmt.Printf("OTP Code: %s\n", otp)
	fmt.Printf("SMTP Host: %s\n", smtpConfig.Host)
	fmt.Printf("SMTP Port: %s\n", smtpConfig.Port)
	
	// Send email and wait for result
	err = smtpConfig.SendOTPEmail(req.Email, otp)
	if err != nil {
		fmt.Printf("❌ Error sending OTP email: %v\n", err)
		util.SendError(w, http.StatusInternalServerError, "Failed to send OTP email. Please check your email settings or try again later.")
		return
	}
	fmt.Println("✅ OTP email sent successfully")

	response := OTPResponse{
		Message: "OTP sent successfully to your email. Please verify within 10 minutes.",
		Email:   req.Email,
	}
	util.SendData(w, http.StatusOK, response)
}
