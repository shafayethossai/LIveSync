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

// RejectPost marks a post as rejected
func (h *Handler) RejectPost(w http.ResponseWriter, r *http.Request) {
	postIDStr := r.PathValue("postId")
	postID, err := strconv.Atoi(postIDStr)
	if err != nil {
		util.SendError(w, http.StatusBadRequest, "Invalid post ID")
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	updatedPost, err := h.postRepo.SetStatus(ctx, postID, "rejected")
	if err != nil {
		if err == repo.ErrPostNotFound {
			util.SendError(w, http.StatusNotFound, "Post not found")
			return
		}
		fmt.Println("Error rejecting post:", err)
		util.SendError(w, http.StatusInternalServerError, "Failed to reject post")
		return
	}

	util.SendData(w, http.StatusOK, map[string]interface{}{
		"message": "Post rejected successfully",
		"post_id": updatedPost.ID,
		"status":  updatedPost.Status,
	})
}
