package admin

import (
	"fmt"
	"livesync-backend/util"
	"net/http"

	"github.com/jmoiron/sqlx"
)

// DeletePost deletes a post
func (h *Handler) DeletePost(w http.ResponseWriter, r *http.Request) {
	db := h.db.(*sqlx.DB)
	postID := r.PathValue("postId")

	query := `
		DELETE FROM posts 
		WHERE id = $1
		RETURNING id
	`

	var deletedID int
	err := db.Get(&deletedID, query, postID)
	if err != nil {
		fmt.Println(err)
		util.SendError(w, http.StatusNotFound, "Post not found")
		return
	}

	response := map[string]interface{}{
		"message": "Post deleted successfully",
		"post_id": deletedID,
	}
	util.SendData(w, http.StatusOK, response)
}
