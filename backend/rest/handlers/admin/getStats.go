package admin

import (
	"context"
	"database/sql"
	"fmt"
	"livesync-backend/util"
	"net/http"
	"time"

	"github.com/jmoiron/sqlx"
)

// DashboardStats represents admin dashboard statistics
type DashboardStats struct {
	TotalUsers    int64 `json:"total_users" db:"total_users"`
	TotalPosts    int64 `json:"total_posts" db:"total_posts"`
	ActivePosts   int64 `json:"active_posts" db:"active_posts"`
	InactivePosts int64 `json:"inactive_posts" db:"inactive_posts"`
	RejectedPosts int64 `json:"rejected_posts" db:"rejected_posts"`
	TotalMessages int64 `json:"total_messages" db:"total_messages"`
}

// GetStats returns dashboard statistics - optimized real-time query
func (h *Handler) GetStats(w http.ResponseWriter, r *http.Request) {
	db := h.db.(*sqlx.DB)

	// Create context with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var stats DashboardStats

	// Optimized single query combining all counts for real-time statistics
	query := `
		SELECT
			(SELECT COUNT(*) FROM users) as total_users,
			(SELECT COUNT(*) FROM posts) as total_posts,
			(SELECT COUNT(*) FROM posts WHERE status = 'active') as active_posts,
			(SELECT COUNT(*) FROM posts WHERE status = 'inactive') as inactive_posts,
			(SELECT COUNT(*) FROM posts WHERE status = 'rejected') as rejected_posts,
			(SELECT COUNT(*) FROM messages) as total_messages
	`

	err := db.GetContext(ctx, &stats, query)
	if err != nil && err != sql.ErrNoRows {
		fmt.Printf("[GetStats] Error fetching stats: %v\n", err)
		util.SendError(w, http.StatusInternalServerError, "Failed to fetch statistics")
		return
	}

	// Send real-time statistics response
	util.SendData(w, http.StatusOK, stats)
}
