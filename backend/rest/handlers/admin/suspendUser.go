package admin

import (
	"fmt"
	"livesync-backend/util"
	"net/http"

	"github.com/jmoiron/sqlx"
)

// SuspendUser deactivates a user account
func (h *Handler) SuspendUser(w http.ResponseWriter, r *http.Request) {
	db := h.db.(*sqlx.DB)
	userID := r.PathValue("userId")

	query := `
		UPDATE users 
		SET is_active = FALSE
		WHERE id = $1
		RETURNING id, name, email, phone, role, is_active, created_at, last_login
	`

	var updatedUser UserData
	err := db.Get(&updatedUser, query, userID)
	if err != nil {
		fmt.Println(err)
		util.SendError(w, http.StatusNotFound, "User not found")
		return
	}

	response := map[string]interface{}{
		"message": "User suspended successfully",
		"user":    updatedUser,
	}
	util.SendData(w, http.StatusOK, response)
}
