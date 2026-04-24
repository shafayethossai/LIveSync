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

	var post AdminPostData
	query := `
		SELECT p.id, p.user_id, p.type, p.post_type, p.area, p.description, p.images, p.rooms, 
		       p.rent, p.budget, p.status, p.views_count, p.created_at,
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

	// Convert to response format
	images := []string{}
	if len(post.Images) > 0 {
		images = post.Images
	}

	response := map[string]interface{}{
		"id":           post.ID,
		"user_id":      post.UserID,
		"type":         post.Type,
		"post_type":    post.PostType,
		"area":         post.Area,
		"description":  post.Description,
		"images":       images,
		"rooms":        post.Rooms.Int64,
		"price":        post.Rent.Int64,
		"budget":       post.Budget.Int64,
		"status":       post.Status,
		"views_count":  post.ViewsCount,
		"created_at":   post.CreatedAt,
		"user_name":    post.UserName,
		"user_email":   post.UserEmail,
	}

	util.SendData(w, http.StatusOK, response)
}
