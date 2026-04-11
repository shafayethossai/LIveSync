package admin

import (
	"fmt"
	"livesync-backend/util"
	"net/http"

	"github.com/jmoiron/sqlx"
)

// Dashboard Stats
type DashboardStats struct {
	TotalUsers     int64 `json:"total_users" db:"total_users"`
	TotalPosts     int64 `json:"total_posts" db:"total_posts"`
	ActivePosts    int64 `json:"active_posts" db:"active_posts"`
	InactivePosts  int64 `json:"inactive_posts" db:"inactive_posts"`
	RejectedPosts  int64 `json:"rejected_posts" db:"rejected_posts"`
	TotalMessages  int64 `json:"total_messages" db:"total_messages"`
	TotalFavorites int64 `json:"total_favorites" db:"total_favorites"`
}

// GetStats returns dashboard statistics
func (h *Handler) GetStats(w http.ResponseWriter, r *http.Request) {
	db := h.db.(*sqlx.DB)
	var stats DashboardStats

	query := `
		SELECT
			(SELECT COUNT(*) FROM users) as total_users,
			(SELECT COUNT(*) FROM posts) as total_posts,
			(SELECT COUNT(*) FROM posts WHERE status = 'active') as active_posts,
			(SELECT COUNT(*) FROM posts WHERE status = 'inactive') as inactive_posts,
			(SELECT COUNT(*) FROM posts WHERE status = 'rejected') as rejected_posts,
			(SELECT COUNT(*) FROM messages) as total_messages,
			(SELECT COUNT(*) FROM favorites) as total_favorites
	`

	err := db.Get(&stats, query)
	if err != nil {
		fmt.Println(err)
		util.SendError(w, http.StatusInternalServerError, "Failed to fetch stats")
		return
	}

	util.SendData(w, http.StatusOK, stats)
}
