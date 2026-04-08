package admin

import (
	"fmt"
	"net/http"
	"strconv"

	"livesync-backend/util"

	"github.com/jmoiron/sqlx"
)

// Dashboard Stats
type DashboardStats struct {
	TotalUsers     int64 `json:"total_users" db:"total_users"`
	TotalPosts     int64 `json:"total_posts" db:"total_posts"`
	ActivePosts    int64 `json:"active_posts" db:"active_posts"`
	InactivePosts  int64 `json:"inactive_posts" db:"inactive_posts"`
	RejectedPosts  int64 `json:"rejected_posts" db:"rejected_posts"`
	TotalMessages  int64 `json:"total_messages" db:"total_messages"`
	TotalFavorites int64 `json:"total_favorites" db:"total_favorites"`
}

type UserData struct {
	ID        int     `json:"id" db:"id"`
	Name      string  `json:"name" db:"name"`
	Email     string  `json:"email" db:"email"`
	Phone     string  `json:"phone" db:"phone"`
	Role      string  `json:"role" db:"role"`
	IsActive  bool    `json:"is_active" db:"is_active"`
	CreatedAt string  `json:"created_at" db:"created_at"`
	LastLogin *string `json:"last_login" db:"last_login"`
}

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

// GetStats returns dashboard statistics
func (h *Handler) GetStats(w http.ResponseWriter, r *http.Request) {
	db := h.db.(*sqlx.DB)
	var stats DashboardStats

	query := `
		SELECT
			(SELECT COUNT(*) FROM users) as total_users,
			(SELECT COUNT(*) FROM posts) as total_posts,
			(SELECT COUNT(*) FROM posts WHERE status = 'active') as active_posts,
			(SELECT COUNT(*) FROM posts WHERE status = 'inactive') as inactive_posts,
			(SELECT COUNT(*) FROM posts WHERE status = 'rejected') as rejected_posts,
			(SELECT COUNT(*) FROM messages) as total_messages,
			(SELECT COUNT(*) FROM favorites) as total_favorites
	`

	err := db.Get(&stats, query)
	if err != nil {
		fmt.Println(err)
		util.SendError(w, http.StatusInternalServerError, "Failed to fetch stats")
		return
	}

	util.SendData(w, http.StatusOK, stats)
}

// GetAllUsers returns paginated list of all users
func (h *Handler) GetAllUsers(w http.ResponseWriter, r *http.Request) {
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

	offset := (page - 1) * limit

	query := `
		SELECT id, name, email, phone, role, is_active, created_at, last_login
		FROM users
		ORDER BY created_at DESC
		LIMIT $1 OFFSET $2
	`

	var users []UserData
	err := db.Select(&users, query, limit, offset)
	if err != nil {
		fmt.Println(err)
		util.SendError(w, http.StatusInternalServerError, "Failed to fetch users")
		return
	}

	// Get total count
	var count int64
	db.Get(&count, "SELECT COUNT(*) FROM users")

	response := map[string]interface{}{
		"users": users,
		"pagination": map[string]interface{}{
			"page":  page,
			"limit": limit,
			"total": count,
		},
	}

	util.SendData(w, http.StatusOK, response)
}

// GetUserByID returns user details
func (h *Handler) GetUserByID(w http.ResponseWriter, r *http.Request) {
	db := h.db.(*sqlx.DB)
	userID := r.PathValue("userId")

	var user UserData
	query := `
		SELECT id, name, email, phone, role, is_active, created_at, last_login
		FROM users
		WHERE id = $1
	`

	err := db.Get(&user, query, userID)
	if err != nil {
		fmt.Println(err)
		util.SendError(w, http.StatusNotFound, "User not found")
		return
	}

	util.SendData(w, http.StatusOK, user)
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

// GetPostByID returns post details
func (h *Handler) GetPostByID(w http.ResponseWriter, r *http.Request) {
	db := h.db.(*sqlx.DB)
	postID := r.PathValue("postId")

	var post PostData
	query := `
		SELECT p.id, p.user_id, p.type, p.post_type, p.area, p.rent, p.budget, p.status, p.views_count, p.created_at,
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

	util.SendData(w, http.StatusOK, post)
}

// SuspendUser deactivates a user account
func (h *Handler) SuspendUser(w http.ResponseWriter, r *http.Request) {
	db := h.db.(*sqlx.DB)
	userID := r.PathValue("userId")

	query := `
		UPDATE users 
		SET is_active = FALSE
		WHERE id = $1
		RETURNING id, name, email, is_active
	`

	var updatedUser UserData
	err := db.Get(&updatedUser, query, userID)
	if err != nil {
		fmt.Println(err)
		util.SendError(w, http.StatusNotFound, "User not found")
		return
	}

	response := map[string]interface{}{
		"message": "User suspended successfully",
		"user":    updatedUser,
	}
	util.SendData(w, http.StatusOK, response)
}

// ActivateUser reactivates a user account
func (h *Handler) ActivateUser(w http.ResponseWriter, r *http.Request) {
	db := h.db.(*sqlx.DB)
	userID := r.PathValue("userId")

	query := `
		UPDATE users 
		SET is_active = TRUE
		WHERE id = $1
		RETURNING id, name, email, is_active
	`

	var updatedUser UserData
	err := db.Get(&updatedUser, query, userID)
	if err != nil {
		fmt.Println(err)
		util.SendError(w, http.StatusNotFound, "User not found")
		return
	}

	response := map[string]interface{}{
		"message": "User activated successfully",
		"user":    updatedUser,
	}
	util.SendData(w, http.StatusOK, response)
}

// DeletePost deletes a post
func (h *Handler) DeletePost(w http.ResponseWriter, r *http.Request) {
	db := h.db.(*sqlx.DB)
	postID := r.PathValue("postId")

	query := `
		DELETE FROM posts 
		WHERE id = $1
		RETURNING id
	`

	var deletedID string
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

// RejectPost marks a post as rejected
func (h *Handler) RejectPost(w http.ResponseWriter, r *http.Request) {
	db := h.db.(*sqlx.DB)
	postID := r.PathValue("postId")

	query := `
		UPDATE posts 
		SET status = 'rejected'
		WHERE id = $1
		RETURNING id, status
	`

	var updatedPost struct {
		ID     string `db:"id"`
		Status string `db:"status"`
	}
	err := db.Get(&updatedPost, query, postID)
	if err != nil {
		fmt.Println(err)
		util.SendError(w, http.StatusNotFound, "Post not found")
		return
	}

	response := map[string]interface{}{
		"message": "Post rejected successfully",
		"post_id": updatedPost.ID,
		"status":  updatedPost.Status,
	}
	util.SendData(w, http.StatusOK, response)
}

// ApprovePost marks a post as active
func (h *Handler) ApprovePost(w http.ResponseWriter, r *http.Request) {
	db := h.db.(*sqlx.DB)
	postID := r.PathValue("postId")

	query := `
		UPDATE posts 
		SET status = 'active'
		WHERE id = $1
		RETURNING id, status
	`

	var updatedPost struct {
		ID     string `db:"id"`
		Status string `db:"status"`
	}
	err := db.Get(&updatedPost, query, postID)
	if err != nil {
		fmt.Println(err)
		util.SendError(w, http.StatusNotFound, "Post not found")
		return
	}

	response := map[string]interface{}{
		"message": "Post approved successfully",
		"post_id": updatedPost.ID,
		"status":  updatedPost.Status,
	}
	util.SendData(w, http.StatusOK, response)
}
