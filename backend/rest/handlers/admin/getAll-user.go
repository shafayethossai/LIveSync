package admin

import (
	"livesync-backend/util"
	"net/http"
	"strconv"
)

// GetAllUsers returns paginated list of all users
func (h *Handler) GetAllUsers(w http.ResponseWriter, r *http.Request) {
	// Get pagination params
	page := 1
	limit := 10
	if p := r.URL.Query().Get("page"); p != "" {
		if v, err := strconv.Atoi(p); err == nil {
			page = v
		}
	}
	if l := r.URL.Query().Get("limit"); l != "" {
		if v, err := strconv.Atoi(l); err == nil {
			limit = v
		}
	}

	offset := (page - 1) * limit

	users, total, err := h.userRepo.GetAllUsers(limit, offset)
	if err != nil {
		util.SendError(w, http.StatusInternalServerError, "Failed to fetch users")
		return
	}

	response := map[string]interface{}{
		"users": users,
		"pagination": map[string]interface{}{
			"page":  page,
			"limit": limit,
			"total": total,
		},
	}

	util.SendData(w, http.StatusOK, response)
}
