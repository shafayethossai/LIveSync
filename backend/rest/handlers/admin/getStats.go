package admin

import (
	"livesync-backend/util"
	"net/http"
)

// GetStats returns dashboard statistics
func (h *Handler) GetStats(w http.ResponseWriter, r *http.Request) {
	stats, err := h.userRepo.GetDashboardStats()
	if err != nil {
		util.SendError(w, http.StatusInternalServerError, "Failed to fetch statistics")
		return
	}

	util.SendData(w, http.StatusOK, stats)
}
