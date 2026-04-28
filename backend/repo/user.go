package repo

import (
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"
)

type User struct {
	ID           int     `json:"id" db:"id"`
	Name         string  `json:"name" db:"name"`
	Email        string  `json:"email" db:"email"`
	PasswordHash string  `json:"password_hash" db:"password_hash"`
	Phone        string  `json:"phone" db:"phone"`
	AvatarURL    *string `json:"avatar_url" db:"avatar_url"`
	Role         string  `json:"role" db:"role"`
	CreatedAt    string  `json:"created_at" db:"created_at"`
}

type UserProfile struct {
	ID        int     `json:"id" db:"id"`
	Name      string  `json:"name" db:"name"`
	Email     string  `json:"email" db:"email"`
	Phone     string  `json:"phone" db:"phone"`
	AvatarURL *string `json:"avatar_url" db:"avatar_url"`
	Role      string  `json:"role" db:"role"`
	CreatedAt string  `json:"created_at" db:"created_at"`
}

type AdminUser struct {
	ID        int     `json:"id" db:"id"`
	Name      string  `json:"name" db:"name"`
	Email     string  `json:"email" db:"email"`
	Phone     string  `json:"phone" db:"phone"`
	Role      string  `json:"role" db:"role"`
	IsActive  bool    `json:"is_active" db:"is_active"`
	CreatedAt string  `json:"created_at" db:"created_at"`
	LastLogin *string `json:"last_login" db:"last_login"`
}

type TemporarySignup struct {
	ID           string      `json:"id" db:"id"`
	Name         string      `json:"name" db:"name"`
	Email        string      `json:"email" db:"email"`
	Password     string      `json:"password_hash" db:"password_hash"`
	Phone        string      `json:"phone" db:"phone"`
	Role         string      `json:"role" db:"role"`
	OTPCode      string      `json:"otp_code" db:"otp_code"`
	OTPExpiresAt interface{} `json:"otp_expires_at" db:"otp_expires_at"`
	CreatedAt    string      `json:"created_at" db:"created_at"`
}

type UserRepo interface {
	Create(user User) (*User, error)
	FindByEmail(email string, password string) (*User, error)
	FindByID(id string) (*User, error)
	UpdateProfile(userID int, name, email, phone, avatarURL, role string) (*UserProfile, error)
	GetProfileByID(userID int) (*UserProfile, error)
	ActivateUser(userID int) (*AdminUser, error)
	SuspendUser(userID int) (*AdminUser, error)
	GetUserAdminByID(userID int) (*AdminUser, error)
	GetAllUsers(limit, offset int) ([]AdminUser, int64, error)
	SaveTemporarySignup(signup TemporarySignup) error
	GetTemporarySignupByEmail(email string) (*TemporarySignup, error)
	VerifyAndCreateUser(tempSignup TemporarySignup) (*User, error)
	DeleteTemporarySignup(email string) error
	// Password reset methods
	SetPasswordResetOTP(userID int, otp string, expiresAt interface{}) error
	VerifyPasswordResetOTP(userID int, otp string) (bool, error)
	UpdatePassword(userID int, newPassword string) error
	ClearPasswordResetOTP(userID int) error
	GetDashboardStats() (*DashboardStats, error)
}

type userRepo struct {
	db *sqlx.DB
}

var ErrUserExists = errors.New("user already exists")

func NewUserRepo(db *sqlx.DB) UserRepo {
	return &userRepo{
		db: db,
	}
}

func (r *userRepo) Create(user User) (*User, error) {
	// For Google OAuth users, password is empty, so use a placeholder
	if user.PasswordHash != "" {
		hashedPassword, err := bcrypt.GenerateFromPassword(
			[]byte(user.PasswordHash),
			bcrypt.DefaultCost,
		)
		if err != nil {
			return nil, err
		}
		user.PasswordHash = string(hashedPassword)
	}

	query := `
		INSERT INTO users (
			name, 
			email, 
			password_hash, 
			phone, 
			role,
			avatar_url
		) VALUES (
			$1, 
			$2, 
			$3, 
			$4, 
			$5,
			$6
		)
		RETURNING id, created_at
	`

	row := r.db.QueryRow(query, user.Name, user.Email, user.PasswordHash, user.Phone, user.Role, user.AvatarURL)

	err := row.Scan(&user.ID, &user.CreatedAt)
	if err != nil {
		pqErr, ok := err.(*pq.Error)

		if ok && pqErr.Code == "23505" {
			return nil, ErrUserExists
		}
		return nil, err
	}

	return &user, nil
}

func (r *userRepo) FindByEmail(email string, password string) (*User, error) {
	var user User
	query := `
		SELECT id, name, email, password_hash, phone, role, avatar_url, created_at
		FROM users
		WHERE email = $1 LIMIT 1
	`

	err := r.db.Get(&user, query, email)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	// If password is provided, verify it (for traditional login)
	if password != "" && user.PasswordHash != "" {
		err = bcrypt.CompareHashAndPassword(
			[]byte(user.PasswordHash),
			[]byte(password),
		)
		if err != nil {
			fmt.Println(err)
			return nil, nil
		}
	}

	return &user, nil
}

func (r *userRepo) FindByID(id string) (*User, error) {
	var user User
	query := `
		SELECT id, name, email, password_hash, phone, role, created_at
		FROM users
		WHERE id = $1 LIMIT 1
	`

	err := r.db.Get(&user, query, id)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	return &user, nil
}

// UpdateProfile updates user profile information
func (r *userRepo) UpdateProfile(userID int, name, email, phone, avatarURL, role string) (*UserProfile, error) {
	var profile UserProfile

	// Build query with correct parameter ordering
	updateFields := []interface{}{name, email, phone}
	queryStr := `UPDATE users SET name = $1, email = $2, phone = $3`
	paramCount := 3

	// Add avatar_url if provided
	if avatarURL != "" {
		paramCount++
		updateFields = append(updateFields, avatarURL)
		queryStr += fmt.Sprintf(`, avatar_url = $%d`, paramCount)
	}

	// Add role if provided
	if role != "" {
		paramCount++
		updateFields = append(updateFields, role)
		queryStr += fmt.Sprintf(`, role = $%d`, paramCount)
	}

	// Add timestamp and WHERE clause
	paramCount++
	updateFields = append(updateFields, userID)
	queryStr += fmt.Sprintf(`, updated_at = CURRENT_TIMESTAMP WHERE id = $%d RETURNING id, name, email, phone, avatar_url, role, created_at`, paramCount)

	fmt.Printf("[REPO] UpdateProfile query: %s\n", queryStr)
	fmt.Printf("[REPO] UpdateProfile params: %v\n", updateFields)

	err := r.db.Get(&profile, queryStr, updateFields...)
	if err != nil {
		fmt.Printf("[REPO] UpdateProfile error: %v\n", err)
		if err == sql.ErrNoRows {
			return nil, errors.New("user not found")
		}
		if pqErr, ok := err.(*pq.Error); ok && pqErr.Code == "23505" {
			return nil, errors.New("email already exists")
		}
		return nil, err
	}

	fmt.Printf("[REPO] UpdateProfile success: id=%d name=%s\n", profile.ID, profile.Name)
	return &profile, nil
}

// GetProfileByID retrieves user profile by ID
func (r *userRepo) GetProfileByID(userID int) (*UserProfile, error) {
	var profile UserProfile

	query := `SELECT id, name, email, phone, avatar_url, role, created_at FROM users WHERE id = $1`
	err := r.db.Get(&profile, query, userID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("user not found")
		}
		return nil, err
	}

	return &profile, nil
}

func (r *userRepo) ActivateUser(userID int) (*AdminUser, error) {
	var user AdminUser
	query := `
		UPDATE users
		SET is_active = TRUE
		WHERE id = $1
		RETURNING id, name, email, phone, role, is_active, created_at, last_login
	`

	err := r.db.Get(&user, query, userID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("user not found")
		}
		return nil, err
	}

	return &user, nil
}

func (r *userRepo) SuspendUser(userID int) (*AdminUser, error) {
	var user AdminUser
	query := `
		UPDATE users
		SET is_active = FALSE
		WHERE id = $1
		RETURNING id, name, email, phone, role, is_active, created_at, last_login
	`

	err := r.db.Get(&user, query, userID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("user not found")
		}
		return nil, err
	}

	return &user, nil
}

func (r *userRepo) GetUserAdminByID(userID int) (*AdminUser, error) {
	var user AdminUser
	query := `
		SELECT id, name, email, phone, role, is_active, created_at, last_login
		FROM users
		WHERE id = $1
	`

	err := r.db.Get(&user, query, userID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("user not found")
		}
		return nil, err
	}

	return &user, nil
}

func (r *userRepo) GetAllUsers(limit, offset int) ([]AdminUser, int64, error) {
	type userWithCount struct {
		AdminUser
		TotalCount int64 `db:"total_count"`
	}

	query := `
		SELECT id, name, email, phone, role, is_active, created_at, last_login,
			COUNT(*) OVER() AS total_count
		FROM users
		ORDER BY created_at DESC
		LIMIT $1 OFFSET $2
	`

	var rows []userWithCount
	err := r.db.Select(&rows, query, limit, offset)
	if err != nil {
		return nil, 0, err
	}

	users := make([]AdminUser, len(rows))
	count := int64(0)
	for i, row := range rows {
		users[i] = row.AdminUser
		if i == 0 {
			count = row.TotalCount
		}
	}

	return users, count, nil
}

func (r *userRepo) GetDashboardStats() (*DashboardStats, error) {
	var stats DashboardStats
	query := `
		SELECT
			(SELECT COUNT(*) FROM users) AS total_users,
			(SELECT COUNT(*) FROM posts) AS total_posts,
			(SELECT COUNT(*) FROM posts WHERE status = 'active') AS active_posts,
			(SELECT COUNT(*) FROM posts WHERE status = 'inactive') AS inactive_posts,
			(SELECT COUNT(*) FROM posts WHERE status = 'rejected') AS rejected_posts,
			(SELECT COUNT(*) FROM messages) AS total_messages
		`

	err := r.db.Get(&stats, query)
	if err != nil {
		return nil, err
	}

	return &stats, nil
}

// SaveTemporarySignup saves signup data with OTP for verification
func (r *userRepo) SaveTemporarySignup(signup TemporarySignup) error {
	query := `
		INSERT INTO temporary_signups (name, email, password_hash, phone, role, otp_code, otp_expires_at, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
		ON CONFLICT (email) DO UPDATE SET 
			otp_code = $6,
			otp_expires_at = $7,
			updated_at = CURRENT_TIMESTAMP
	`

	_, err := r.db.Exec(query, signup.Name, signup.Email, signup.Password, signup.Phone, signup.Role, signup.OTPCode, signup.OTPExpiresAt)
	return err
}

// GetTemporarySignupByEmail retrieves temporary signup data by email
func (r *userRepo) GetTemporarySignupByEmail(email string) (*TemporarySignup, error) {
	var signup TemporarySignup
	query := `
		SELECT id, name, email, password_hash, phone, role, otp_code, otp_expires_at, created_at
		FROM temporary_signups
		WHERE email = $1
		LIMIT 1
	`

	err := r.db.Get(&signup, query, email)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	return &signup, nil
}

// VerifyAndCreateUser creates a user from temporary signup after OTP verification
func (r *userRepo) VerifyAndCreateUser(tempSignup TemporarySignup) (*User, error) {
	// Hash the password
	hashedPassword, err := bcrypt.GenerateFromPassword(
		[]byte(tempSignup.Password),
		bcrypt.DefaultCost,
	)
	if err != nil {
		return nil, err
	}

	// Create the user
	user := User{
		Name:         tempSignup.Name,
		Email:        tempSignup.Email,
		PasswordHash: string(hashedPassword),
		Phone:        tempSignup.Phone,
		Role:         tempSignup.Role,
	}

	query := `
		INSERT INTO users (name, email, password_hash, phone, role, is_email_verified)
		VALUES ($1, $2, $3, $4, $5, true)
		RETURNING id, created_at
	`

	row := r.db.QueryRow(query, user.Name, user.Email, user.PasswordHash, user.Phone, user.Role)
	err = row.Scan(&user.ID, &user.CreatedAt)
	if err != nil {
		pqErr, ok := err.(*pq.Error)
		if ok && pqErr.Code == "23505" {
			return nil, ErrUserExists
		}
		return nil, err
	}

	return &user, nil
}

// DeleteTemporarySignup deletes temporary signup data after successful verification
func (r *userRepo) DeleteTemporarySignup(email string) error {
	query := `DELETE FROM temporary_signups WHERE email = $1`
	_, err := r.db.Exec(query, email)
	return err
}

// SetPasswordResetOTP stores the password reset OTP for a user
func (r *userRepo) SetPasswordResetOTP(userID int, otp string, expiresAt interface{}) error {
	query := `
		UPDATE users 
		SET otp_code = $1, otp_expires_at = $2
		WHERE id = $3
	`
	_, err := r.db.Exec(query, otp, expiresAt, userID)
	return err
}

// VerifyPasswordResetOTP verifies if the OTP is valid and not expired
func (r *userRepo) VerifyPasswordResetOTP(userID int, otp string) (bool, error) {
	var storedOTP string
	var expiresAt sql.NullTime

	query := `
		SELECT otp_code, otp_expires_at 
		FROM users 
		WHERE id = $1
	`
	err := r.db.QueryRow(query, userID).Scan(&storedOTP, &expiresAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return false, errors.New("user not found")
		}
		return false, err
	}

	// Check if OTP matches
	if storedOTP != otp {
		return false, nil
	}

	// Check if OTP is expired
	if expiresAt.Valid && time.Now().After(expiresAt.Time) {
		return false, nil
	}

	return true, nil
}

// UpdatePassword updates the user's password with an hashed password
func (r *userRepo) UpdatePassword(userID int, hashedPassword string) error {
	query := `
		UPDATE users 
		SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
		WHERE id = $2
	`
	_, err := r.db.Exec(query, hashedPassword, userID)
	return err
}

// ClearPasswordResetOTP clears the OTP after successful password reset
func (r *userRepo) ClearPasswordResetOTP(userID int) error {
	query := `
		UPDATE users 
		SET otp_code = NULL, otp_expires_at = NULL
		WHERE id = $1
	`
	_, err := r.db.Exec(query, userID)
	return err
}
