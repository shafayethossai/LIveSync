package util

import (
	"crypto/tls"
	"fmt"
	"net"
	"net/smtp"
	"os"
	"time"
)

type SMTPConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	From     string
}

func NewSMTPConfig() *SMTPConfig {
	// Try SMTP_PASSWORD first, then fall back to SMTP_PASS for backward compatibility
	password := os.Getenv("SMTP_PASSWORD")
	if password == "" {
		password = os.Getenv("SMTP_PASS")
	}
	
	return &SMTPConfig{
		Host:     os.Getenv("SMTP_HOST"),
		Port:     os.Getenv("SMTP_PORT"),
		User:     os.Getenv("SMTP_USER"),
		Password: password,
		From:     os.Getenv("SMTP_FROM"),
	}
}

func (s *SMTPConfig) senderEmail() string {
	if s.From != "" {
		return s.From
	}
	return s.User
}

func sendMailWithTimeout(addr, host, user, password, from string, recipients []string, message []byte, timeout time.Duration) error {
	conn, err := net.DialTimeout("tcp", addr, timeout)
	if err != nil {
		return fmt.Errorf("failed to connect to SMTP server: %v", err)
	}
	defer conn.Close()

	if err := conn.SetDeadline(time.Now().Add(timeout)); err != nil {
		return fmt.Errorf("failed to set SMTP deadline: %v", err)
	}

	client, err := smtp.NewClient(conn, host)
	if err != nil {
		return fmt.Errorf("failed to create SMTP client: %v", err)
	}
	defer client.Close()

	if ok, _ := client.Extension("STARTTLS"); ok {
		tlsConfig := &tls.Config{ServerName: host}
		if err := client.StartTLS(tlsConfig); err != nil {
			return fmt.Errorf("failed to start TLS: %v", err)
		}
	}

	if user != "" && password != "" {
		auth := smtp.PlainAuth("", user, password, host)
		if err := client.Auth(auth); err != nil {
			return fmt.Errorf("failed to authenticate SMTP user: %v", err)
		}
	}

	if err := client.Mail(from); err != nil {
		return fmt.Errorf("failed to set sender: %v", err)
	}

	for _, recipient := range recipients {
		if err := client.Rcpt(recipient); err != nil {
			return fmt.Errorf("failed to set recipient %s: %v", recipient, err)
		}
	}

	writer, err := client.Data()
	if err != nil {
		return fmt.Errorf("failed to open SMTP data writer: %v", err)
	}

	if _, err := writer.Write(message); err != nil {
		_ = writer.Close()
		return fmt.Errorf("failed to write email body: %v", err)
	}

	if err := writer.Close(); err != nil {
		return fmt.Errorf("failed to finalize email: %v", err)
	}

	return nil
}

func (s *SMTPConfig) SendOTPEmail(toEmail, otp string) error {
	if s.Host == "" || s.Port == "" || s.User == "" || s.Password == "" {
		missingFields := []string{}
		if s.Host == "" {
			missingFields = append(missingFields, "SMTP_HOST")
		}
		if s.Port == "" {
			missingFields = append(missingFields, "SMTP_PORT")
		}
		if s.User == "" {
			missingFields = append(missingFields, "SMTP_USER")
		}
		if s.Password == "" {
			missingFields = append(missingFields, "SMTP_PASS")
		}
		return fmt.Errorf("SMTP configuration incomplete - missing: %v. Please configure environment variables", missingFields)
	}

	from := s.senderEmail()
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

	// Create message with headers
	message := fmt.Sprintf(
		"To: %s\r\nSubject: %s\r\nMIME-Version: 1.0\r\nContent-Type: text/html; charset=\"UTF-8\"\r\n\r\n%s",
		toEmail, subject, htmlBody,
	)

	return sendMailWithTimeout(s.Host+":"+s.Port, s.Host, s.User, s.Password, from, []string{toEmail}, []byte(message), 15*time.Second)
}

func (s *SMTPConfig) SendWelcomeEmail(toEmail, userName string) error {
	if s.Host == "" || s.Port == "" || s.User == "" || s.Password == "" {
		missingFields := []string{}
		if s.Host == "" {
			missingFields = append(missingFields, "SMTP_HOST")
		}
		if s.Port == "" {
			missingFields = append(missingFields, "SMTP_PORT")
		}
		if s.User == "" {
			missingFields = append(missingFields, "SMTP_USER")
		}
		if s.Password == "" {
			missingFields = append(missingFields, "SMTP_PASS")
		}
		return fmt.Errorf("SMTP configuration incomplete - missing: %v. Please configure environment variables", missingFields)
	}

	from := s.senderEmail()
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

	message := fmt.Sprintf(
		"To: %s\r\nSubject: %s\r\nMIME-Version: 1.0\r\nContent-Type: text/html; charset=\"UTF-8\"\r\n\r\n%s",
		toEmail, subject, htmlBody,
	)

	return sendMailWithTimeout(s.Host+":"+s.Port, s.Host, s.User, s.Password, from, []string{toEmail}, []byte(message), 15*time.Second)
}

// SendPasswordResetEmail sends a password reset OTP email
func (s *SMTPConfig) SendPasswordResetEmail(toEmail, otp string) error {
	if s.Host == "" || s.Port == "" || s.User == "" || s.Password == "" {
		missingFields := []string{}
		if s.Host == "" {
			missingFields = append(missingFields, "SMTP_HOST")
		}
		if s.Port == "" {
			missingFields = append(missingFields, "SMTP_PORT")
		}
		if s.User == "" {
			missingFields = append(missingFields, "SMTP_USER")
		}
		if s.Password == "" {
			missingFields = append(missingFields, "SMTP_PASS")
		}
		return fmt.Errorf("SMTP configuration incomplete - missing: %v. Please configure environment variables", missingFields)
	}

	from := s.senderEmail()
	subject := "LiveSync Password Reset Code"

	htmlBody := fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; background-color: #f4f4f4; }
        .container { max-width: 400px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { text-align: center; color: #333; margin-bottom: 20px; }
        .otp-box { background-color: #f0f0f0; padding: 20px; text-align: center; border-radius: 5px; margin: 20px 0; }
        .otp-code { font-size: 32px; font-weight: bold; color: #e74c3c; letter-spacing: 5px; }
        .message { color: #666; text-align: center; margin: 15px 0; }
        .footer { color: #999; font-size: 12px; text-align: center; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Password Reset Request</h1>
        </div>
        <div class="message">
            <p>We received a request to reset your password. Use this code to proceed:</p>
        </div>
        <div class="otp-box">
            <div class="otp-code">%s</div>
        </div>
        <div class="message">
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
        </div>
        <div class="footer">
            <p>&copy; 2026 LiveSync. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
	`, otp)

	message := fmt.Sprintf(
		"To: %s\r\nSubject: %s\r\nMIME-Version: 1.0\r\nContent-Type: text/html; charset=\"UTF-8\"\r\n\r\n%s",
		toEmail, subject, htmlBody,
	)

	return sendMailWithTimeout(s.Host+":"+s.Port, s.Host, s.User, s.Password, from, []string{toEmail}, []byte(message), 15*time.Second)
}

// SendPasswordChangedEmail sends a confirmation email after password change
func (s *SMTPConfig) SendPasswordChangedEmail(toEmail string) error {
	if s.Host == "" || s.Port == "" || s.User == "" || s.Password == "" {
		return fmt.Errorf("SMTP configuration not fully set")
	}

	from := s.senderEmail()
	subject := "LiveSync Password Changed Successfully"

	htmlBody := `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; background-color: #f4f4f4; }
        .container { max-width: 400px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { text-align: center; color: #333; margin-bottom: 20px; }
        .message { color: #666; text-align: center; margin: 15px 0; }
        .success-box { background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; color: #155724; }
        .footer { color: #999; font-size: 12px; text-align: center; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Password Changed</h1>
        </div>
        <div class="success-box">
            <p>Your password has been successfully changed.</p>
        </div>
        <div class="message">
            <p>If you didn't make this change, please contact support immediately.</p>
        </div>
        <div class="footer">
            <p>&copy; 2026 LiveSync. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
	`

	message := fmt.Sprintf(
		"To: %s\r\nSubject: %s\r\nMIME-Version: 1.0\r\nContent-Type: text/html; charset=\"UTF-8\"\r\n\r\n%s",
		toEmail, subject, htmlBody,
	)

	return sendMailWithTimeout(s.Host+":"+s.Port, s.Host, s.User, s.Password, from, []string{toEmail}, []byte(message), 15*time.Second)
}
