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

// GetAllPosts returns all active posts with pagination - optimized single query
func (h *Handler) GetAllPosts(w http.ResponseWriter, r *http.Request) {
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

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	posts, totalCount, err := h.postRepo.GetAllActive(ctx, limitNum, offset)
	if err != nil {
		fmt.Println("Error fetching posts:", err)
		util.SendError(w, http.StatusInternalServerError, "Failed to fetch posts")
		return
	}

	cleanPosts := make([]map[string]interface{}, len(posts))
	for i, post := range posts {
		cleanPosts[i] = convertPostToResponse(&post)
	}

	if cleanPosts == nil {
		cleanPosts = []map[string]interface{}{}
	}

	util.SendData(w, http.StatusOK, map[string]interface{}{
		"posts": cleanPosts,
		"pagination": map[string]interface{}{
			"page":  pageNum,
			"limit": limitNum,
			"total": totalCount,
		},
	})
}

// GetPostByID returns a single post by ID
func (h *Handler) GetPostByID(w http.ResponseWriter, r *http.Request) {
	postIDStr := r.PathValue("id")
	postID, err := strconv.Atoi(postIDStr)
	if err != nil {
		util.SendError(w, http.StatusBadRequest, "Invalid post ID")
		return
	}

	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		_ = h.postRepo.IncrementViews(ctx, postID)
	}()

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	post, err := h.postRepo.GetByID(ctx, postID)
	if err != nil {
		if err == repo.ErrPostNotFound {
			util.SendError(w, http.StatusNotFound, "Post not found")
			return
		}
		fmt.Println("Error fetching post:", err)
		util.SendError(w, http.StatusInternalServerError, "Failed to fetch post")
		return
	}

	util.SendData(w, http.StatusOK, convertPostToResponse(post))
}

// GetUserPosts returns all posts created by the logged-in user - optimized
func (h *Handler) GetUserPosts(w http.ResponseWriter, r *http.Request) {
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

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	posts, totalCount, err := h.postRepo.GetByUserID(ctx, userIDInt, limitNum, offset)
	if err != nil {
		fmt.Println("Error fetching user posts:", err)
		util.SendError(w, http.StatusInternalServerError, "Failed to fetch posts")
		return
	}

	cleanPosts := make([]map[string]interface{}, len(posts))
	for i, post := range posts {
		cleanPosts[i] = convertPostToResponse(&post)
	}

	if cleanPosts == nil {
		cleanPosts = []map[string]interface{}{}
	}

	util.SendData(w, http.StatusOK, map[string]interface{}{
		"posts": cleanPosts,
		"pagination": map[string]interface{}{
			"page":  pageNum,
			"limit": limitNum,
			"total": totalCount,
		},
	})
}
