package admin

import (
	"fmt"
	"livesync-backend/util"
	"net/http"
	"strconv"

	"github.com/jmoiron/sqlx"
)

type PostData struct {
	ID         int    `json:"id" db:"id"`
	UserID     int    `json:"user_id" db:"user_id"`
	Type       string `json:"type" db:"type"`
	PostType   string `json:"post_type" db:"post_type"`
	Area       string `json:"area" db:"area"`
	Rent       *int   `json:"rent" db:"rent"`
	Budget     *int   `json:"budget" db:"budget"`
	Status     string `json:"status" db:"status"`
	ViewsCount int    `json:"views_count" db:"views_count"`
	CreatedAt  string `json:"created_at" db:"created_at"`
	UserName   string `json:"user_name" db:"user_name"`
	UserEmail  string `json:"user_email" db:"user_email"`
}

// GetAllPosts returns paginated list of all posts
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

	query := `
		SELECT p.id, p.user_id, p.type, p.post_type, p.area, p.rent, p.budget, p.status, p.views_count, p.created_at,
		       u.name as user_name, u.email as user_email
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
		query += " ORDER BY p.created_at DESC LIMIT $1 OFFSET $2"
		args = append(args, limit, offset)
	}

	var posts []PostData
	err := db.Select(&posts, query, args...)
	if err != nil {
		fmt.Println(err)
		util.SendError(w, http.StatusInternalServerError, "Failed to fetch posts")
		return
	}

	// Get total count
	var count int64
	countQuery := "SELECT COUNT(*) FROM posts"
	if status != "" {
		countQuery += " WHERE status = $1"
		db.Get(&count, countQuery, status)
	} else {
		db.Get(&count, countQuery)
	}

	response := map[string]interface{}{
		"posts": posts,
		"pagination": map[string]interface{}{
			"page":  page,
			"limit": limit,
			"total": count,
		},
	}

	util.SendData(w, http.StatusOK, response)
}
