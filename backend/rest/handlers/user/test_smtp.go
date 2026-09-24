package user

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"livesync-backend/util"
)

type SMTPTestRequest struct {
	TestEmail string `json:"testEmail"`
}

type SMTPTestResponse struct {
	Status    string `json:"status"`
	Message   string `json:"message"`
	SMTPHost  string `json:"smtpHost"`
	SMTPPort  string `json:"smtpPort"`
	SMTPUser  string `json:"smtpUser"`
	SMTPFrom  string `json:"smtpFrom"`
	Timestamp string `json:"timestamp"`
}

func (h *Handler) TestSMTP(w http.ResponseWriter, r *http.Request) {
	var req SMTPTestRequest

	decoder := json.NewDecoder(r.Body)
	err := decoder.Decode(&req)
	if err != nil {
		util.SendError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.TestEmail == "" {
		util.SendError(w, http.StatusBadRequest, "testEmail is required")
		return
	}

	fmt.Println("\n============================================================")
	fmt.Println("[TEST SMTP] SMTP Configuration Test Started")
	fmt.Println("============================================================")

	smtpConfig := util.NewSMTPConfig()

	fmt.Printf("[TEST SMTP] SMTP Host: %s\n", smtpConfig.Host)
	fmt.Printf("[TEST SMTP] SMTP Port: %s\n", smtpConfig.Port)
	fmt.Printf("[TEST SMTP] SMTP User: %s\n", smtpConfig.User)
	fmt.Printf("[TEST SMTP] SMTP From: %s\n", smtpConfig.From)
	fmt.Printf("[TEST SMTP] Test Email: %s\n", req.TestEmail)

	// Check if all SMTP config fields are set
	if smtpConfig.Host == "" || smtpConfig.Port == "" || smtpConfig.User == "" {
		fmt.Println("[TEST SMTP] Missing SMTP configuration!")
		response := SMTPTestResponse{
			Status:    "error",
			Message:   "SMTP configuration is incomplete. Please check environment variables.",
			SMTPHost:  smtpConfig.Host,
			SMTPPort:  smtpConfig.Port,
			SMTPUser:  smtpConfig.User,
			SMTPFrom:  smtpConfig.From,
			Timestamp: time.Now().Format(time.RFC3339),
		}
		util.SendData(w, http.StatusBadRequest, response)
		return
	}

	// Try to send test email
	fmt.Println("[TEST SMTP] Attempting to send test email...")
	err = smtpConfig.SendOTPEmail(req.TestEmail, "123456")

	if err != nil {
		fmt.Printf("[TEST SMTP] Error sending test email: %v\n", err)
		fmt.Println("============================================================")

		response := SMTPTestResponse{
			Status:    "error",
			Message:   fmt.Sprintf("Failed to send email: %v", err),
			SMTPHost:  smtpConfig.Host,
			SMTPPort:  smtpConfig.Port,
			SMTPUser:  smtpConfig.User,
			SMTPFrom:  smtpConfig.From,
			Timestamp: time.Now().Format(time.RFC3339),
		}
		util.SendData(w, http.StatusInternalServerError, response)
		return
	}

	fmt.Println("[TEST SMTP] Test email sent successfully!")
	fmt.Println("[TEST SMTP] Check your inbox for the test email")
	fmt.Println("============================================================\n")

	response := SMTPTestResponse{
		Status:    "success",
		Message:   "Test email sent successfully! Check your inbox.",
		SMTPHost:  smtpConfig.Host,
		SMTPPort:  smtpConfig.Port,
		SMTPUser:  smtpConfig.User,
		SMTPFrom:  smtpConfig.From,
		Timestamp: time.Now().Format(time.RFC3339),
	}
	util.SendData(w, http.StatusOK, response)
}
