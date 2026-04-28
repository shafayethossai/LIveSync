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

// ApprovePost marks a post as active
func (h *Handler) ApprovePost(w http.ResponseWriter, r *http.Request) {
	postIDStr := r.PathValue("postId")
	postID, err := strconv.Atoi(postIDStr)
	if err != nil {
		util.SendError(w, http.StatusBadRequest, "Invalid post ID")
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	updatedPost, err := h.postRepo.SetStatus(ctx, postID, "active")
	if err != nil {
		if err == repo.ErrPostNotFound {
			util.SendError(w, http.StatusNotFound, "Post not found")
			return
		}
		fmt.Println("Error approving post:", err)
		util.SendError(w, http.StatusInternalServerError, "Failed to approve post")
		return
	}

	util.SendData(w, http.StatusOK, map[string]interface{}{
		"message": "Post approved successfully",
		"post_id": updatedPost.ID,
		"status":  updatedPost.Status,
	})
}
