package user

import (
	"fmt"
	"net/http"

	"livesync-backend/util"

	"github.com/jmoiron/sqlx"
)

type UserProfile struct {
	ID        int    `json:"id" db:"id"`
	Name      string `json:"name" db:"name"`
	Email     string `json:"email" db:"email"`
	Phone     string `json:"phone" db:"phone"`
	AvatarURL string `json:"avatar_url" db:"avatar_url"`
	Role      string `json:"role" db:"role"`
	CreatedAt string `json:"created_at" db:"created_at"`
}

// GetProfile returns the profile of the logged-in user
func (h *Handler) GetProfile(w http.ResponseWriter, r *http.Request) {
	db := h.db.(*sqlx.DB)

	// Get user ID from JWT token (set by middleware)
	userID := r.Context().Value("userID")
	if userID == nil {
		util.SendError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	var profile UserProfile
	query := `
		SELECT id, name, email, phone, avatar_url, role, created_at
		FROM users
		WHERE id = $1
	`

	err := db.Get(&profile, query, userID)
	if err != nil {
		fmt.Println(err)
		util.SendError(w, http.StatusNotFound, "User not found")
		return
	}

	util.SendData(w, http.StatusOK, profile)
}
