package user

import (
	"encoding/json"
	"net/http"

	"livesync-backend/util"
)

func (h *Handler) GetUserByJWT(w http.ResponseWriter, r *http.Request) {
	// Get user ID from context (set by AuthenticateJWT middleware)
	userID := r.Context().Value("userID")
	if userID == nil {
		util.SendError(w, http.StatusUnauthorized, "Unauthorized: No user in context")
		return
	}

	// Find user by ID
	user := map[string]interface{}{
		"id":   userID,
		"role": r.Context().Value("userRole"),
	}

	// Return user data from context
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}
