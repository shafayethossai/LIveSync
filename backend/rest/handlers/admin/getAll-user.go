package admin

import (
	"fmt"
	"livesync-backend/util"
	"net/http"
	"strconv"

	"github.com/jmoiron/sqlx"
)

type UserData struct {
	ID        int     `json:"id" db:"id"`
	Name      string  `json:"name" db:"name"`
	Email     string  `json:"email" db:"email"`
	Phone     string  `json:"phone" db:"phone"`
	Role      string  `json:"role" db:"role"`
	IsActive  bool    `json:"is_active" db:"is_active"`
	CreatedAt string  `json:"created_at" db:"created_at"`
	LastLogin *string `json:"last_login" db:"last_login"`
}

// GetAllUsers returns paginated list of all users
func (h *Handler) GetAllUsers(w http.ResponseWriter, r *http.Request) {
	db := h.db.(*sqlx.DB)

	// Get pagination params
	page := 1
	limit := 10
	if p := r.URL.Query().Get("page"); p != "" {
		if v, err := strconv.Atoi(p); err == nil {
			page = v
		}
	}
	if l := r.URL.Query().Get("limit"); l != "" {
		if v, err := strconv.Atoi(l); err == nil {
			limit = v
		}
	}

	offset := (page - 1) * limit

	query := `
		SELECT id, name, email, phone, role, is_active, created_at, last_login
		FROM users
		ORDER BY created_at DESC
		LIMIT $1 OFFSET $2
	`

	var users []UserData
	err := db.Select(&users, query, limit, offset)
	if err != nil {
		fmt.Println(err)
		util.SendError(w, http.StatusInternalServerError, "Failed to fetch users")
		return
	}

	// Get total count
	var count int64
	db.Get(&count, "SELECT COUNT(*) FROM users")

	response := map[string]interface{}{
		"users": users,
		"pagination": map[string]interface{}{
			"page":  page,
			"limit": limit,
			"total": count,
		},
	}

	util.SendData(w, http.StatusOK, response)
}
