package user

import (
	"fmt"
	"net/http"
	"strconv"

	"livesync-backend/util"
)

// GetUserByJWT returns the user data from JWT token
func (h *Handler) GetUserByJWT(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("userID")
	if userID == nil {
		util.SendError(w, http.StatusUnauthorized, "Unauthorized: No user in context")
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

	fmt.Printf("[GetUserByJWT] Fetching user for userID=%d\n", userIDInt)

	profile, err := h.userRepo.GetProfileByID(userIDInt)
	if err != nil {
		fmt.Printf("[GetUserByJWT] Error: %v\n", err)
		util.SendError(w, http.StatusNotFound, "User not found")
		return
	}

	util.SendData(w, http.StatusOK, profile)
}
