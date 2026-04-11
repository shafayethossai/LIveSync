package admin

import (
	"fmt"
	"livesync-backend/util"
	"net/http"

	"github.com/jmoiron/sqlx"
)

// GetUserByID returns user details
func (h *Handler) GetUserByID(w http.ResponseWriter, r *http.Request) {
	db := h.db.(*sqlx.DB)
	userID := r.PathValue("userId")

	var user UserData
	query := `
		SELECT id, name, email, phone, role, is_active, created_at, last_login
		FROM users
		WHERE id = $1
	`

	err := db.Get(&user, query, userID)
	if err != nil {
		fmt.Println(err)
		util.SendError(w, http.StatusNotFound, "User not found")
		return
	}

	util.SendData(w, http.StatusOK, user)
}
