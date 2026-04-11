package util

import (
	"fmt"
	"net/smtp"
	"os"
)

type SMTPConfig struct {
	Host     string
	Port     string
	User     string
	Password string
}

func NewSMTPConfig() *SMTPConfig {
	return &SMTPConfig{
		Host:     os.Getenv("SMTP_HOST"),
		Port:     os.Getenv("SMTP_PORT"),
		User:     os.Getenv("SMTP_USER"),
		Password: os.Getenv("SMTP_PASS"),
	}
}

func (s *SMTPConfig) SendOTPEmail(toEmail, otp string) error {
	if s.Host == "" || s.Port == "" || s.User == "" || s.Password == "" {
		return fmt.Errorf("SMTP configuration not fully set")
	}

	from := s.User
	subject := "Your LiveSync OTP Verification Code"

	htmlBody := fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; background-color: #f4f4f4; }
        .container { max-width: 400px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { text-align: center; color: #333; margin-bottom: 20px; }
        .otp-box { background-color: #f0f0f0; padding: 20px; text-align: center; border-radius: 5px; margin: 20px 0; }
        .otp-code { font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 5px; }
        .message { color: #666; text-align: center; margin: 15px 0; }
        .footer { color: #999; font-size: 12px; text-align: center; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>LiveSync Email Verification</h1>
        </div>
        <div class="message">
            <p>Welcome to LiveSync! Your email verification code is:</p>
        </div>
        <div class="otp-box">
            <div class="otp-code">%s</div>
        </div>
        <div class="message">
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't request this code, please ignore this email.</p>
        </div>
        <div class="footer">
            <p>&copy; 2026 LiveSync. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
	`, otp)

	// Set up authentication
	auth := smtp.PlainAuth("", s.User, s.Password, s.Host)

	// Create message with headers
	message := fmt.Sprintf(
		"To: %s\r\nSubject: %s\r\nMIME-Version: 1.0\r\nContent-Type: text/html; charset=\"UTF-8\"\r\n\r\n%s",
		toEmail, subject, htmlBody,
	)

	// Send email
	addr := s.Host + ":" + s.Port
	err := smtp.SendMail(addr, auth, from, []string{toEmail}, []byte(message))
	if err != nil {
		return fmt.Errorf("failed to send email: %v", err)
	}

	return nil
}

func (s *SMTPConfig) SendWelcomeEmail(toEmail, userName string) error {
	if s.Host == "" || s.Port == "" || s.User == "" || s.Password == "" {
		return fmt.Errorf("SMTP configuration not fully set")
	}

	from := s.User
	subject := "Welcome to LiveSync!"

	htmlBody := fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; background-color: #f4f4f4; }
        .container { max-width: 500px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { text-align: center; color: #333; margin-bottom: 20px; }
        .content { color: #666; line-height: 1.6; }
        .footer { color: #999; font-size: 12px; text-align: center; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to LiveSync, %s!</h1>
        </div>
        <div class="content">
            <p>Your account has been successfully created and verified.</p>
            <p>You can now log in and start exploring housing opportunities on LiveSync.</p>
            <p>Happy searching!</p>
        </div>
        <div class="footer">
            <p>&copy; 2026 LiveSync. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
	`, userName)

	auth := smtp.PlainAuth("", s.User, s.Password, s.Host)
	message := fmt.Sprintf(
		"To: %s\r\nSubject: %s\r\nMIME-Version: 1.0\r\nContent-Type: text/html; charset=\"UTF-8\"\r\n\r\n%s",
		toEmail, subject, htmlBody,
	)

	addr := s.Host + ":" + s.Port
	err := smtp.SendMail(addr, auth, from, []string{toEmail}, []byte(message))
	if err != nil {
		return fmt.Errorf("failed to send welcome email: %v", err)
	}

	return nil
}
