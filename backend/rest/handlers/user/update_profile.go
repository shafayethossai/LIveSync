package user

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"livesync-backend/util"
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
	// Get user ID from JWT token (set by middleware)
	userID := r.Context().Value("userID")
	if userID == nil {
		util.SendError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	// Parse request
	var req UpdateProfileRequest
	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(&req); err != nil {
		fmt.Printf("Decode error: %v\n", err)
		util.SendError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate required fields
	if req.Name == "" || req.Email == "" {
		util.SendError(w, http.StatusBadRequest, "Name and email are required")
		return
	}

	// Convert userID - could be int or string
	var userIDInt int
	switch v := userID.(type) {
	case int:
		userIDInt = v
	case string:
		id, err := strconv.Atoi(v)
		if err != nil {
			util.SendError(w, http.StatusInternalServerError, "Invalid user ID")
			return
		}
		userIDInt = id
	default:
		util.SendError(w, http.StatusInternalServerError, "Invalid user ID type")
		return
	}

	fmt.Printf("[UpdateProfile] Calling repo for userID=%d\n", userIDInt)

	// Call repository to update profile
	updatedProfile, err := h.userRepo.UpdateProfile(userIDInt, req.Name, req.Email, req.Phone, req.AvatarURL, req.Role)
	if err != nil {
		fmt.Printf("[UpdateProfile] Error: %v\n", err)
		util.SendError(w, http.StatusInternalServerError, "Failed to update profile: "+err.Error())
		return
	}

	// Return updated profile
	util.SendData(w, http.StatusOK, updatedProfile)
}
