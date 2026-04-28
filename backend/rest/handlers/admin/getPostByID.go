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

// GetPostByID returns post details
func (h *Handler) GetPostByID(w http.ResponseWriter, r *http.Request) {
	postIDStr := r.PathValue("postId")
	postID, err := strconv.Atoi(postIDStr)
	if err != nil {
		util.SendError(w, http.StatusBadRequest, "Invalid post ID")
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	post, err := h.postRepo.GetAdminPostByID(ctx, postID)
	if err != nil {
		if err == repo.ErrPostNotFound {
			util.SendError(w, http.StatusNotFound, "Post not found")
			return
		}
		fmt.Println("Error fetching admin post:", err)
		util.SendError(w, http.StatusInternalServerError, "Failed to fetch post")
		return
	}

	images := []string{}
	if len(post.Images) > 0 {
		images = post.Images
	}

	util.SendData(w, http.StatusOK, map[string]interface{}{
		"id":          post.ID,
		"user_id":     post.UserID,
		"type":        post.Type,
		"post_type":   post.PostType,
		"area":        post.Area,
		"description": post.Description,
		"images":      images,
		"rooms":       post.Rooms.Int64,
		"price":       post.Rent.Int64,
		"budget":      post.Budget.Int64,
		"status":      post.Status,
		"views_count": post.ViewsCount,
		"created_at":  post.CreatedAt,
		"user_name":   post.UserName,
		"user_email":  post.UserEmail,
	})
}
