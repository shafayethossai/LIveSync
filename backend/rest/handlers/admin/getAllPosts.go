package admin

import (
	"database/sql"
	"fmt"
	"livesync-backend/util"
	"net/http"
	"strconv"

	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"
)

type AdminPostData struct {
	ID               string         `json:"id" db:"id"`
	UserID           string         `json:"user_id" db:"user_id"`
	Type             string         `json:"type" db:"type"`
	PostType         string         `json:"post_type" db:"post_type"`
	Area             string         `json:"area" db:"area"`
	Description      string         `json:"description" db:"description"`
	Images           pq.StringArray `json:"images" db:"images"`
	Rooms            sql.NullInt64  `json:"rooms" db:"rooms"`
	Rent             sql.NullInt64  `json:"price" db:"rent"`
	Budget           sql.NullInt64  `json:"budget" db:"budget"`
	Status           string         `json:"status" db:"status"`
	ViewsCount       int            `json:"views_count" db:"views_count"`
	CreatedAt        string         `json:"created_at" db:"created_at"`
	UserName         string         `json:"user_name" db:"user_name"`
	UserEmail        string         `json:"user_email" db:"user_email"`
}

// GetAllPosts returns paginated list of all posts - optimized single query
func (h *Handler) GetAllPosts(w http.ResponseWriter, r *http.Request) {
	db := h.db.(*sqlx.DB)

	// Get pagination params
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

	// Get filter params
	status := r.URL.Query().Get("status") // active, inactive, rejected

	offset := (page - 1) * limit

	// Build query with window function for total count
	query := `
		SELECT p.id, p.user_id, p.type, p.post_type, p.area, p.description, p.images, p.rooms, 
		       p.rent, p.budget, p.status, p.views_count, p.created_at,
		       u.name as user_name, u.email as user_email,
		       COUNT(*) OVER() AS total_count
		FROM posts p
		JOIN users u ON p.user_id = u.id
	`

	args := []interface{}{}
	if status != "" {
		query += " WHERE p.status = $1"
		args = append(args, status)
		if limit != 0 {
			query += " ORDER BY p.created_at DESC LIMIT $2 OFFSET $3"
			args = append(args, limit, offset)
		}
	} else {
		if limit != 0 {
			query += " ORDER BY p.created_at DESC LIMIT $1 OFFSET $2"
			args = append(args, limit, offset)
		}
	}

	// Temporary struct to include total count
	type AdminPostDataWithCount struct {
		AdminPostData
		TotalCount int64 `db:"total_count"`
	}

	var postsWithCount []AdminPostDataWithCount
	err := db.Select(&postsWithCount, query, args...)
	if err != nil {
		fmt.Println(err)
		util.SendError(w, http.StatusInternalServerError, "Failed to fetch posts")
		return
	}

	count := int64(0)
	if len(postsWithCount) > 0 {
		count = postsWithCount[0].TotalCount
	}

	// Convert posts to clean response format
	cleanPosts := make([]map[string]interface{}, len(postsWithCount))
	for i, post := range postsWithCount {
		images := []string{}
		if len(post.Images) > 0 {
			images = post.Images
		}

		cleanPosts[i] = map[string]interface{}{
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
	}

	response := map[string]interface{}{
		"posts": cleanPosts,
		"pagination": map[string]interface{}{
			"page":  page,
			"limit": limit,
			"total": count,
		},
	}

	util.SendData(w, http.StatusOK, response)
}
