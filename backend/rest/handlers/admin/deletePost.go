package admin

import (
	"context"
	"fmt"
	"livesync-backend/repo"
	"livesync-backend/util"
	"net/http"
	"strconv"
	"time"
)

// DeletePost deletes a post
func (h *Handler) DeletePost(w http.ResponseWriter, r *http.Request) {
	postIDStr := r.PathValue("postId")
	postID, err := strconv.Atoi(postIDStr)
	if err != nil {
		util.SendError(w, http.StatusBadRequest, "Invalid post ID")
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	err = h.postRepo.DeleteByID(ctx, postID)
	if err != nil {
		if err == repo.ErrPostNotFound {
			util.SendError(w, http.StatusNotFound, "Post not found")
			return
		}
		fmt.Println("Error deleting post:", err)
		util.SendError(w, http.StatusInternalServerError, "Failed to delete post")
		return
	}

	util.SendData(w, http.StatusOK, map[string]interface{}{
		"message": "Post deleted successfully",
		"post_id": postID,
	})
}
