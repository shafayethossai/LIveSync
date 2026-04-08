# Go Backend Implementation - Admin Portal Template

This document provides Go/Gin boilerplate code to implement the admin authentication system.

---

## Project Structure

```
backend/
├── cmd/
│   └── main.go
├── internal/
│   ├── models/
│   │   ├── admin.go
│   │   └── responses.go
│   ├── handlers/
│   │   └── admin.go
│   ├── middleware/
│   │   └── auth.go
│   ├── database/
│   │   ├── db.go
│   │   └── migrations.go
│   └── utils/
│       ├── jwt.go
│       └── validation.go
├── migrations/
│   └── 001_create_admins_table.sql
├── go.mod
├── go.sum
└── .env
```

---

## 1. Models (internal/models/admin.go)

```go
package models

import (
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type AdminRole string

const (
	AdminRoleUser      AdminRole = "admin"
	AdminRoleSuper     AdminRole = "super_admin"
	AdminRoleModerator AdminRole = "moderator"
)

// Admin model
type Admin struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	Name      string    `gorm:"type:varchar(255);not null" json:"name"`
	Email     string    `gorm:"type:varchar(255);uniqueIndex:idx_admins_email_active;not null" json:"email"`
	Password  string    `gorm:"type:varchar(255);not null" json:"-"` // Never expose password
	Phone     *string   `gorm:"type:varchar(20)" json:"phone"`
	IsActive  bool      `gorm:"default:true" json:"is_active"`
	Role      AdminRole `gorm:"type:varchar(50);default:'admin'" json:"role"`
	LastLogin *time.Time `json:"last_login"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	DeletedAt *time.Time `gorm:"index" json:"-"` // Soft delete
}

// TableName specifies the table name
func (Admin) TableName() string {
	return "admins"
}

// SetPassword hashes and sets the password
func (a *Admin) SetPassword(password string) error {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), 12)
	if err != nil {
		return err
	}
	a.Password = string(hash)
	return nil
}

// CheckPassword validates the password
func (a *Admin) CheckPassword(password string) bool {
	return bcrypt.CompareHashAndPassword([]byte(a.Password), []byte(password)) == nil
}

// DTO for login request
type AdminLoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
}

// DTO for signup request
type AdminSignupRequest struct {
	Name     string `json:"name" binding:"required,min=2"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
	Phone    *string `json:"phone"`
}

// DTO for login response
type AdminLoginResponse struct {
	Token string      `json:"token"`
	Admin *AdminResponse `json:"admin"`
}

// DTO for admin response (no password)
type AdminResponse struct {
	ID        uuid.UUID `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Phone     *string   `json:"phone"`
	Role      AdminRole `json:"role"`
	IsActive  bool      `json:"is_active"`
	LastLogin *time.Time `json:"last_login"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// ToResponse converts Admin to AdminResponse
func (a *Admin) ToResponse() *AdminResponse {
	return &AdminResponse{
		ID:        a.ID,
		Name:      a.Name,
		Email:     a.Email,
		Phone:     a.Phone,
		Role:      a.Role,
		IsActive:  a.IsActive,
		LastLogin: a.LastLogin,
		CreatedAt: a.CreatedAt,
		UpdatedAt: a.UpdatedAt,
	}
}
```

---

## 2. JWT Utility (internal/utils/jwt.go)

```go
package utils

import (
	"errors"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type AdminClaims struct {
	ID    uuid.UUID `json:"id"`
	Email string    `json:"email"`
	Role  string    `json:"role"`
	Type  string    `json:"type"` // "admin"
	jwt.RegisteredClaims
}

// GenerateAdminToken creates a JWT token for admin
func GenerateAdminToken(id uuid.UUID, email, role string) (string, error) {
	secretKey := os.Getenv("JWT_SECRET")
	if secretKey == "" {
		return "", errors.New("JWT_SECRET not set")
	}

	expirationHours := 168 // 7 days
	expirationTime := time.Now().Add(time.Duration(expirationHours) * time.Hour)

	claims := AdminClaims{
		ID:    id,
		Email: email,
		Role:  role,
		Type:  "admin",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signedToken, err := token.SignedString([]byte(secretKey))
	if err != nil {
		return "", err
	}

	return signedToken, nil
}

// ValidateAdminToken validates and parses the JWT token
func ValidateAdminToken(tokenString string) (*AdminClaims, error) {
	secretKey := os.Getenv("JWT_SECRET")
	claims := &AdminClaims{}

	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("invalid signing method")
		}
		return []byte(secretKey), nil
	})

	if err != nil {
		return nil, err
	}

	if !token.Valid {
		return nil, errors.New("invalid token")
	}

	if claims.Type != "admin" {
		return nil, errors.New("token is not for admin")
	}

	return claims, nil
}
```

---

## 3. Authentication Middleware (internal/middleware/auth.go)

```go
package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"yourmodule/internal/utils"
)

// AdminAuthMiddleware validates admin JWT token
func AdminAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "missing authorization header",
			})
			c.Abort()
			return
		}

		// Extract token from "Bearer {token}"
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "invalid authorization header format",
			})
			c.Abort()
			return
		}

		token := parts[1]
		claims, err := utils.ValidateAdminToken(token)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "invalid or expired token",
			})
			c.Abort()
			return
		}

		// Store claims in context for use in handlers
		c.Set("adminID", claims.ID)
		c.Set("adminEmail", claims.Email)
		c.Set("adminRole", claims.Role)

		c.Next()
	}
}

// SuperAdminOnly middleware checks if user is super_admin
func SuperAdminOnly() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, _ := c.Get("adminRole")
		if role != "super_admin" {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "only super admins can perform this action",
			})
			c.Abort()
			return
		}
		c.Next()
	}
}
```

---

## 4. Admin Handlers (internal/handlers/admin.go)

```go
package handlers

import (
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"yourmodule/internal/models"
	"yourmodule/internal/utils"
)

type AdminHandler struct {
	db *gorm.DB
}

func NewAdminHandler(db *gorm.DB) *AdminHandler {
	return &AdminHandler{db: db}
}

// AdminLogin handles admin login
func (h *AdminHandler) AdminLogin(c *gin.Context) {
	var req models.AdminLoginRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid request payload",
		})
		return
	}

	var admin models.Admin
	if err := h.db.Where("email = ? AND is_active = ?", req.Email, true).First(&admin).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "invalid credentials",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "database error",
		})
		return
	}

	if !admin.CheckPassword(req.Password) {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "invalid credentials",
		})
		return
	}

	// Generate JWT token
	token, err := utils.GenerateAdminToken(admin.ID, admin.Email, string(admin.Role))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to generate token",
		})
		return
	}

	// Update last login
	now := time.Now()
	h.db.Model(&admin).Update("last_login", now)

	c.JSON(http.StatusOK, models.AdminLoginResponse{
		Token: token,
		Admin: admin.ToResponse(),
	})
}

// AdminSignup handles admin registration
func (h *AdminHandler) AdminSignup(c *gin.Context) {
	var req models.AdminSignupRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid request payload",
		})
		return
	}

	// Check if email already exists
	var existingAdmin models.Admin
	if err := h.db.Where("email = ?", req.Email).First(&existingAdmin).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{
			"error": "email already exists",
		})
		return
	}

	// Create new admin
	admin := models.Admin{
		ID:       uuid.New(),
		Name:     req.Name,
		Email:    req.Email,
		Phone:    req.Phone,
		IsActive: true,
		Role:     models.AdminRoleUser,
	}

	// Hash password
	if err := admin.SetPassword(req.Password); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to process password",
		})
		return
	}

	// Save to database
	if err := h.db.Create(&admin).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to create admin account",
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "admin account created successfully",
		"admin":   admin.ToResponse(),
	})
}

// GetCurrentAdmin retrieves the current logged-in admin
func (h *AdminHandler) GetCurrentAdmin(c *gin.Context) {
	adminID := c.GetString("adminID")

	var admin models.Admin
	if err := h.db.Where("id = ?", adminID).First(&admin).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "admin not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "database error",
		})
		return
	}

	c.JSON(http.StatusOK, admin.ToResponse())
}

// GetAllAdmins retrieves all admins (super admin only)
func (h *AdminHandler) GetAllAdmins(c *gin.Context) {
	var admins []models.Admin

	page := c.DefaultQuery("page", "1")
	limit := c.DefaultQuery("limit", "10")

	if err := h.db.Where("deleted_at IS NULL").
		Limit(10). // max 10 per page for this example
		Offset((parseInt(page) - 1) * parseInt(limit)).
		Find(&admins).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to fetch admins",
		})
		return
	}

	var responses []*models.AdminResponse
	for _, admin := range admins {
		responses = append(responses, admin.ToResponse())
	}

	c.JSON(http.StatusOK, gin.H{
		"data": responses,
	})
}

// UpdateAdmin updates admin profile
func (h *AdminHandler) UpdateAdmin(c *gin.Context) {
	adminID := c.GetString("adminID")
	targetAdminID := c.Param("id")

	// Check if user can update this admin (self or super admin)
	if adminID != targetAdminID {
		role := c.GetString("adminRole")
		if role != "super_admin" {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "forbidden",
			})
			return
		}
	}

	var req struct {
		Name  string `json:"name"`
		Phone *string `json:"phone"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid request",
		})
		return
	}

	if err := h.db.Model(&models.Admin{}).
		Where("id = ?", targetAdminID).
		Updates(models.Admin{Name: req.Name, Phone: req.Phone}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to update admin",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "admin updated successfully",
	})
}

// ChangePassword changes admin password
func (h *AdminHandler) ChangePassword(c *gin.Context) {
	adminID := c.GetString("adminID")

	var req struct {
		OldPassword string `json:"old_password" binding:"required"`
		NewPassword string `json:"new_password" binding:"required,min=8"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid request",
		})
		return
	}

	var admin models.Admin
	if err := h.db.Where("id = ?", adminID).First(&admin).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "admin not found",
		})
		return
	}

	if !admin.CheckPassword(req.OldPassword) {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "old password is incorrect",
		})
		return
	}

	if err := admin.SetPassword(req.NewPassword); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to process password",
		})
		return
	}

	if err := h.db.Model(&admin).Update("password", admin.Password).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to update password",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "password changed successfully",
	})
}

// Helper function - add this to utils
func parseInt(s string) int {
	var i int
	_, _ = sscanf(s, "%d", &i)
	return i
}
```

---

## 5. Main Application (cmd/main.go)

```go
package main

import (
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"yourmodule/internal/database"
	"yourmodule/internal/handlers"
	"yourmodule/internal/middleware"
	"yourmodule/internal/models"
)

func main() {
	// Load environment variables
	_ = godotenv.Load()

	// Initialize database
	db := database.InitDB()
	if db == nil {
		panic("failed to initialize database")
	}

	// Run migrations
	if err := db.AutoMigrate(&models.Admin{}); err != nil {
		panic("failed to run migrations")
	}

	// Initialize Gin router
	router := gin.Default()

	// CORS configuration
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173", "https://yourdomain.com"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// Initialize handlers
	adminHandler := handlers.NewAdminHandler(db)

	// Public routes
	pub := router.Group("/api")
	{
		pub.POST("/admins/login", adminHandler.AdminLogin)
		pub.POST("/admins", adminHandler.AdminSignup)
	}

	// Protected routes
	protected := router.Group("/api")
	protected.Use(middleware.AdminAuthMiddleware())
	{
		protected.GET("/admins/me", adminHandler.GetCurrentAdmin)
		protected.PUT("/admins/:id", adminHandler.UpdateAdmin)
		protected.PUT("/admins/:id/password", adminHandler.ChangePassword)

		// Super admin only routes
		superAdmin := protected.Group("")
		superAdmin.Use(middleware.SuperAdminOnly())
		{
			superAdmin.GET("/admins", adminHandler.GetAllAdmins)
		}
	}

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "3001"
	}
	router.Run(":" + port)
}
```

---

## 6. Database Setup (internal/database/db.go)

```go
package database

import (
	"fmt"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func InitDB() *gorm.DB {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		panic("DATABASE_URL not set")
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		fmt.Println("Failed to connect to database:", err)
		return nil
	}

	fmt.Println("Database connected successfully")
	return db
}
```

---

## 7. Environment Variables (.env)

```env
# Server
PORT=3001

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/livesync

# JWT
JWT_SECRET=your-super-secret-key-min-32-characters-long!!!
JWT_EXPIRATION_HOURS=168

# CORS
CORS_ORIGINS=http://localhost:5173,https://yourdomain.com

# Environment
ENV=development
```

---

## 8. Dependencies (go.mod example)

```mod
go 1.21

require (
	github.com/gin-contrib/cors v1.4.0
	github.com/gin-gonic/gin v1.9.1
	github.com/golang-jwt/jwt/v5 v5.0.0
	github.com/google/uuid v1.3.0
	github.com/joho/godotenv v1.5.1
	golang.org/x/crypto v0.13.0
	gorm.io/driver/postgres v1.5.2
	gorm.io/gorm v1.25.2
)
```

---

## 9. Migration SQL (migrations/001_create_admins_table.sql)

```sql
-- Create admin_role enum
CREATE TYPE admin_role AS ENUM ('admin', 'super_admin', 'moderator');

-- Create admins table
CREATE TABLE admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    role admin_role DEFAULT 'admin',
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    UNIQUE(email)
);

-- Create indexes
CREATE UNIQUE INDEX idx_admins_email_active ON admins(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_admins_is_active ON admins(is_active);
CREATE INDEX idx_admins_role ON admins(role);
CREATE INDEX idx_admins_deleted_at ON admins(deleted_at);

-- Insert initial super admin (change password after first login)
INSERT INTO admins (name, email, password, phone, is_active, role)
VALUES (
    'Super Admin',
    'superadmin@livesync.com',
    '$2a$12$[BCRYPT_HASH_HERE]',  -- Use bcrypt to hash "SecurePassword123!"
    '+1234567890',
    true,
    'super_admin'
);
```

---

## 10. Installation & Setup

```bash
# 1. Copy this template to your Go project
cd backend

# 2. Install dependencies
go mod tidy
go get github.com/gin-contrib/cors
go get github.com/golang-jwt/jwt/v5
go get github.com/google/uuid
go get golang.org/x/crypto
go get gorm.io/driver/postgres
go get gorm.io/gorm

# 3. Create .env file with your configuration

# 4. Create PostgreSQL database
createdb livesync

# 5. Run migrations
psql livesync < migrations/001_create_admins_table.sql

# 6. Run the application
go run cmd/main.go
```

---

## 11. Testing API Endpoints

### Login
```bash
curl -X POST http://localhost:3001/api/admins/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@livesync.com",
    "password": "SecurePassword123!"
  }'
```

### Signup
```bash
curl -X POST http://localhost:3001/api/admins \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Admin",
    "email": "john@example.com",
    "password": "CurrentPass123",
    "phone": "+1234567890"
  }'
```

### Get Current Admin
```bash
curl -X GET http://localhost:3001/api/admins/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Next Steps

1. ✅ Copy the models
2. ✅ Set up database connection
3. ✅ Implement JWT utility functions
4. ✅ Create middleware
5. ✅ Create handlers
6. ✅ Set up routes
7. ✅ Add other endpoints (users, posts, etc.)
8. ✅ Add request logging/auditing
9. ✅ Write unit tests
10. ✅ Deploy to production

---

## Important Notes

- Always hash passwords with bcrypt (cost 12+)
- Validate all inputs on the backend
- Implement rate limiting on login endpoint
- Log all admin actions for audit trail
- Use environment variables for sensitive data
- Test thoroughly before production
- Keep JWT_SECRET secure and strong
