package user

import (
	"fmt"
	"net/http"

	"livesync-backend/util"

	"github.com/jmoiron/sqlx"
)

func (h *Handler) GetUserByJWT(w http.ResponseWriter, r *http.Request) {
	db := h.db.(*sqlx.DB)

	// Get user ID from context (set by AuthenticateJWT middleware)
	userID := r.Context().Value("userID")
	if userID == nil {
		util.SendError(w, http.StatusUnauthorized, "Unauthorized: No user in context")
		return
	}

	// Fetch complete user data from database
	var user UserProfile
	query := `
		SELECT id, name, email, phone, avatar_url, role, created_at
		FROM users
		WHERE id = $1
	`

	err := db.Get(&user, query, userID)
	if err != nil {
		fmt.Println("Error fetching user:", err)
		util.SendError(w, http.StatusNotFound, "User not found")
		return
	}

	// Return complete user data
	util.SendData(w, http.StatusOK, user)
}
