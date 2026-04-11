package admin

import (
	"fmt"
	"livesync-backend/util"
	"net/http"

	"github.com/jmoiron/sqlx"
)

// RejectPost marks a post as rejected
func (h *Handler) RejectPost(w http.ResponseWriter, r *http.Request) {
	db := h.db.(*sqlx.DB)
	postID := r.PathValue("postId")

	query := `
		UPDATE posts 
		SET status = 'rejected'
		WHERE id = $1
		RETURNING id, status
	`

	var updatedPost struct {
		ID     string `db:"id"`
		Status string `db:"status"`
	}
	err := db.Get(&updatedPost, query, postID)
	if err != nil {
		fmt.Println(err)
		util.SendError(w, http.StatusNotFound, "Post not found")
		return
	}

	response := map[string]interface{}{
		"message": "Post rejected successfully",
		"post_id": updatedPost.ID,
		"status":  updatedPost.Status,
	}
	util.SendData(w, http.StatusOK, response)
}
