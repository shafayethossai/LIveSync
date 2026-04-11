package user

import (
	"encoding/json"
	"fmt"
	"net/http"

	"livesync-backend/util"

	"github.com/jmoiron/sqlx"
)

type UpdateProfileRequest struct {
	Name      string `json:"name"`
	Email     string `json:"email"`
	Phone     string `json:"phone"`
	Role      string `json:"role,omitempty"`
	AvatarURL string `json:"avatar_url,omitempty"`
}

// UpdateProfile updates the profile of the logged-in user
func (h *Handler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	db := h.db.(*sqlx.DB)

	// Get user ID from JWT token (set by middleware)
	userID := r.Context().Value("userID")
	if userID == nil {
		util.SendError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	var req UpdateProfileRequest

	decoder := json.NewDecoder(r.Body)
	err := decoder.Decode(&req)
	if err != nil {
		fmt.Println("Error decoding request:", err)
		util.SendError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	fmt.Printf("Updating profile for userID: %v, Name: %s, Email: %s, Role: %s\n", userID, req.Name, req.Email, req.Role)

	// Validate required fields
	if req.Name == "" || req.Email == "" {
		util.SendError(w, http.StatusBadRequest, "Name and email are required")
		return
	}

	// Update user in database
	query := `
		UPDATE users
		SET name = $1, email = $2, phone = $3, avatar_url = $4, role = COALESCE(NULLIF($5, ''), role), updated_at = CURRENT_TIMESTAMP
		WHERE id = $6
		RETURNING id, name, email, phone, avatar_url, role, created_at
	`

	var updatedProfile UserProfile
	err = db.Get(&updatedProfile, query, req.Name, req.Email, req.Phone, req.AvatarURL, req.Role, userID)
	if err != nil {
		fmt.Println(err)
		util.SendError(w, http.StatusInternalServerError, "Failed to update profile")
		return
	}

	response := map[string]interface{}{
		"message": "Profile updated successfully",
		"user":    updatedProfile,
	}

	util.SendData(w, http.StatusOK, response)
}
