package util

import (
	"crypto/rand"
	"fmt"
	"math/big"
	"time"
)

const (
	OTPLength       = 6
	OTPValidityTime = 10 * time.Minute
)

// GenerateOTP generates a random 6-digit OTP
func GenerateOTP() string {
	otp := ""
	for i := 0; i < OTPLength; i++ {
		num, err := rand.Int(rand.Reader, big.NewInt(10))
		if err != nil {
			// Fallback if rand fails
			num = big.NewInt(int64(i % 10))
		}
		otp += fmt.Sprintf("%d", num.Int64())
	}
	return otp
}

// GetOTPExpiry returns the expiry time for OTP (10 minutes from now)
func GetOTPExpiry() time.Time {
	return time.Now().Add(OTPValidityTime)
}

// IsOTPExpired checks if OTP has expired
func IsOTPExpired(expiryTime time.Time) bool {
	return time.Now().After(expiryTime)
}
