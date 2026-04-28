package admin

import (
	"context"
	"fmt"
	"livesync-backend/util"
	"net/http"
	"strconv"
	"time"
)

// GetAllPosts returns paginated list of all posts - optimized single query
func (h *Handler) GetAllPosts(w http.ResponseWriter, r *http.Request) {
	page := 1
	limit := 10
	if p := r.URL.Query().Get("page"); p != "" {
		if v, err := strconv.Atoi(p); err == nil {
			page = v
		}
	}
	if l := r.URL.Query().Get("limit"); l != "" {
		if v, err := strconv.Atoi(l); err == nil {
			limit = v
		}
	}

	status := r.URL.Query().Get("status")
	offset := (page - 1) * limit

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	posts, totalCount, err := h.postRepo.ListAdminPosts(ctx, status, limit, offset)
	if err != nil {
		fmt.Println("Error fetching admin posts:", err)
		util.SendError(w, http.StatusInternalServerError, "Failed to fetch posts")
		return
	}

	cleanPosts := make([]map[string]interface{}, len(posts))
	for i, post := range posts {
		images := []string{}
		if len(post.Images) > 0 {
			images = post.Images
		}

		cleanPosts[i] = map[string]interface{}{
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
		}
	}

	util.SendData(w, http.StatusOK, map[string]interface{}{
		"posts": cleanPosts,
		"pagination": map[string]interface{}{
			"page":  page,
			"limit": limit,
			"total": totalCount,
		},
	})
}
