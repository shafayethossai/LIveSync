package post

import (
	"context"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"livesync-backend/repo"
	"livesync-backend/util"
)

// DeletePost deletes a post (only owner can delete their own post)
func (h *Handler) DeletePost(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("userID")
	if userID == nil {
		util.SendError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	userIDInt, ok := userID.(int)
	if !ok {
		fmt.Println("Error: userID is not an integer:", userID)
		util.SendError(w, http.StatusUnauthorized, "Invalid user ID type")
		return
	}

	postIDStr := r.PathValue("id")
	postID, err := strconv.Atoi(postIDStr)
	if err != nil {
		util.SendError(w, http.StatusBadRequest, "Invalid post ID")
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	ownerID, err := h.postRepo.GetOwnerID(ctx, postID)
	if err != nil {
		if err == repo.ErrPostNotFound {
			util.SendError(w, http.StatusNotFound, "Post not found")
			return
		}
		fmt.Println("Error fetching post owner:", err)
		util.SendError(w, http.StatusInternalServerError, "Failed to delete post")
		return
	}

	if ownerID != userIDInt {
		util.SendError(w, http.StatusForbidden, "You can only delete your own posts")
		return
	}

	err = h.postRepo.DeleteByIDAndOwner(ctx, postID, userIDInt)
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
