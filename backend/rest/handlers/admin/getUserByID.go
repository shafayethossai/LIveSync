package admin

import (
	"livesync-backend/util"
	"net/http"
	"strconv"
)

// GetUserByID returns user details
func (h *Handler) GetUserByID(w http.ResponseWriter, r *http.Request) {
	userIDStr := r.PathValue("userId")
	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		util.SendError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	user, err := h.userRepo.GetUserAdminByID(userID)
	if err != nil {
		util.SendError(w, http.StatusNotFound, "User not found")
		return
	}

	util.SendData(w, http.StatusOK, user)
}
