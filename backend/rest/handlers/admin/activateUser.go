package admin

import (
	"livesync-backend/util"
	"net/http"
	"strconv"
)

// ActivateUser reactivates a user account
func (h *Handler) ActivateUser(w http.ResponseWriter, r *http.Request) {
	userIDStr := r.PathValue("userId")
	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		util.SendError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	updatedUser, err := h.userRepo.ActivateUser(userID)
	if err != nil {
		util.SendError(w, http.StatusNotFound, "User not found")
		return
	}

	response := map[string]interface{}{
		"message": "User activated successfully",
		"user":    updatedUser,
	}
	util.SendData(w, http.StatusOK, response)
}
