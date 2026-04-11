package admin

import (
	"fmt"
	"livesync-backend/util"
	"net/http"

	"github.com/jmoiron/sqlx"
)

// GetPostByID returns post details
func (h *Handler) GetPostByID(w http.ResponseWriter, r *http.Request) {
	db := h.db.(*sqlx.DB)
	postID := r.PathValue("postId")

	var post PostData
	query := `
		SELECT p.id, p.user_id, p.type, p.post_type, p.area, p.rent, p.budget, p.status, p.views_count, p.created_at,
		       u.name as user_name, u.email as user_email
		FROM posts p
		JOIN users u ON p.user_id = u.id
		WHERE p.id = $1
	`

	err := db.Get(&post, query, postID)
	if err != nil {
		fmt.Println(err)
		util.SendError(w, http.StatusNotFound, "Post not found")
		return
	}

	util.SendData(w, http.StatusOK, post)
}
