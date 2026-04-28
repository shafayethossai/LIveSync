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

// GetAllUsers returns paginated list of all users - optimized single query
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

	// Use window function to get total count in same query
	query := `
		SELECT 
			id, name, email, phone, role, is_active, created_at, last_login,
			COUNT(*) OVER() AS total_count
		FROM users
		ORDER BY created_at DESC
		LIMIT $1 OFFSET $2
	`

	// Temporary struct to hold the total_count from the query
	type UserDataWithCount struct {
		UserData
		TotalCount int64 `db:"total_count"`
	}

	var usersWithCount []UserDataWithCount
	err := db.Select(&usersWithCount, query, limit, offset)
	if err != nil {
		fmt.Println(err)
		util.SendError(w, http.StatusInternalServerError, "Failed to fetch users")
		return
	}

	count := int64(0)
	if len(usersWithCount) > 0 {
		count = usersWithCount[0].TotalCount
	}

	// Extract just the users
	users := make([]UserData, len(usersWithCount))
	for i, u := range usersWithCount {
		users[i] = u.UserData
	}

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
