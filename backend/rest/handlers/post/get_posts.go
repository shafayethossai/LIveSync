package post

import (
	"fmt"
	"net/http"
	"strconv"

	"livesync-backend/util"

	"github.com/jmoiron/sqlx"
)

// GetAllPosts returns all active posts with pagination - optimized single query
func (h *Handler) GetAllPosts(w http.ResponseWriter, r *http.Request) {
	db := h.db.(*sqlx.DB)

	// Get pagination parameters
	page := r.URL.Query().Get("page")
	limit := r.URL.Query().Get("limit")

	if page == "" {
		page = "1"
	}
	if limit == "" {
		limit = "10"
	}

	pageNum, _ := strconv.Atoi(page)
	limitNum, _ := strconv.Atoi(limit)

	if pageNum < 1 {
		pageNum = 1
	}
	if limitNum < 1 || limitNum > 100 {
		limitNum = 10
	}

	offset := (pageNum - 1) * limitNum

	// Use window function to get total count in same query
	query := `
		SELECT 
			id, user_id, type, post_type, area, description, images, rooms, rent, budget, 
			rent_share, floor, bathrooms, balconies, has_lift, utility_cost, available_from, 
			shared_facilities, status, views_count, created_at, updated_at,
			COUNT(*) OVER() AS total_count
		FROM posts
		WHERE status = 'active'
		ORDER BY created_at DESC
		LIMIT $1 OFFSET $2
	`

	// Temporary struct to hold the total_count from the query
	type PostResponseWithCount struct {
		PostResponse
		TotalCount int `db:"total_count"`
	}

	var postsWithCount []PostResponseWithCount
	err := db.Select(&postsWithCount, query, limitNum, offset)
	if err != nil {
		fmt.Println("Error fetching posts:", err)
		util.SendError(w, http.StatusInternalServerError, "Failed to fetch posts")
		return
	}

	totalCount := 0
	if len(postsWithCount) > 0 {
		totalCount = postsWithCount[0].TotalCount
	}

	// Convert posts to clean response format
	cleanPosts := make([]map[string]interface{}, len(postsWithCount))
	for i, p := range postsWithCount {
		cleanPosts[i] = convertPostToResponse(p.PostResponse)
	}

	if cleanPosts == nil {
		cleanPosts = []map[string]interface{}{}
	}

	response := map[string]interface{}{
		"posts": cleanPosts,
		"pagination": map[string]interface{}{
			"page":  pageNum,
			"limit": limitNum,
			"total": totalCount,
		},
	}

	util.SendData(w, http.StatusOK, response)
}

// GetPostByID returns a single post by ID
func (h *Handler) GetPostByID(w http.ResponseWriter, r *http.Request) {
	db := h.db.(*sqlx.DB)

	// Get post ID from URL path
	postIDStr := r.PathValue("id")
	postID, err := strconv.Atoi(postIDStr)
	if err != nil {
		util.SendError(w, http.StatusBadRequest, "Invalid post ID")
		return
	}

	// Increment views count
	go func() {
		db.Exec("UPDATE posts SET views_count = views_count + 1 WHERE id = $1", postID)
	}()

	// Fetch post
	query := `
		SELECT id, user_id, type, post_type, area, description, images, rooms, rent, budget, rent_share, floor, bathrooms, balconies, has_lift, utility_cost, available_from, shared_facilities, status, views_count, created_at, updated_at
		FROM posts
		WHERE id = $1
	`

	var post PostResponse
	err = db.Get(&post, query, postID)
	if err != nil {
		fmt.Println("Error fetching post:", err)
		util.SendError(w, http.StatusNotFound, "Post not found")
		return
	}

	util.SendData(w, http.StatusOK, convertPostToResponse(post))
}

// GetUserPosts returns all posts created by the logged-in user - optimized
func (h *Handler) GetUserPosts(w http.ResponseWriter, r *http.Request) {
	db := h.db.(*sqlx.DB)

	// Get user ID from JWT token (set by middleware)
	userID := r.Context().Value("userID")
	if userID == nil {
		util.SendError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	// Type assert userID to int
	userIDInt, ok := userID.(int)
	if !ok {
		fmt.Println("Error: userID is not an integer:", userID)
		util.SendError(w, http.StatusUnauthorized, "Invalid user ID type")
		return
	}

	// Get pagination parameters
	page := r.URL.Query().Get("page")
	limit := r.URL.Query().Get("limit")

	if page == "" {
		page = "1"
	}
	if limit == "" {
		limit = "10"
	}

	pageNum, _ := strconv.Atoi(page)
	limitNum, _ := strconv.Atoi(limit)

	if pageNum < 1 {
		pageNum = 1
	}
	if limitNum < 1 || limitNum > 100 {
		limitNum = 10
	}

	offset := (pageNum - 1) * limitNum

	// Use window function to get total count in same query
	query := `
		SELECT 
			id, user_id, type, post_type, area, description, images, rooms, rent, budget, 
			rent_share, floor, bathrooms, balconies, has_lift, utility_cost, available_from, 
			shared_facilities, status, views_count, created_at, updated_at,
			COUNT(*) OVER() AS total_count
		FROM posts
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`

	// Temporary struct to hold the total_count from the query
	type PostResponseWithCount struct {
		PostResponse
		TotalCount int `db:"total_count"`
	}

	var postsWithCount []PostResponseWithCount
	err := db.Select(&postsWithCount, query, userIDInt, limitNum, offset)
	if err != nil {
		fmt.Println("Error fetching user posts:", err)
		util.SendError(w, http.StatusInternalServerError, "Failed to fetch posts")
		return
	}

	totalCount := 0
	if len(postsWithCount) > 0 {
		totalCount = postsWithCount[0].TotalCount
	}

	// Convert posts to clean response format
	cleanPosts := make([]map[string]interface{}, len(postsWithCount))
	for i, p := range postsWithCount {
		cleanPosts[i] = convertPostToResponse(p.PostResponse)
	}

	if cleanPosts == nil {
		cleanPosts = []map[string]interface{}{}
	}

	response := map[string]interface{}{
		"posts": cleanPosts,
		"pagination": map[string]interface{}{
			"page":  pageNum,
			"limit": limitNum,
			"total": totalCount,
		},
	}

	util.SendData(w, http.StatusOK, response)
}
