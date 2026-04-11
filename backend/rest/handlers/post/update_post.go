package post

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"livesync-backend/util"

	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"
)

type UpdatePostRequest struct {
	Type             string   `json:"type,omitempty"`
	PostType         string   `json:"post_type,omitempty"`
	Area             string   `json:"area,omitempty"`
	Description      string   `json:"description,omitempty"`
	Images           []string `json:"images,omitempty"`
	Rooms            int      `json:"rooms,omitempty"`
	Rent             int      `json:"rent,omitempty"`
	Budget           int      `json:"budget,omitempty"`
	RentShare        int      `json:"rent_share,omitempty"`
	Floor            int      `json:"floor,omitempty"`
	Bathrooms        int      `json:"bathrooms,omitempty"`
	Balconies        int      `json:"balconies,omitempty"`
	HasLift          bool     `json:"has_lift,omitempty"`
	UtilityCost      int      `json:"utility_cost,omitempty"`
	AvailableFrom    string   `json:"available_from,omitempty"`
	SharedFacilities string   `json:"shared_facilities,omitempty"`
}

// UpdatePost updates a post (only owner can update their own post)
func (h *Handler) UpdatePost(w http.ResponseWriter, r *http.Request) {
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

	// Get post ID from URL path
	postIDStr := r.PathValue("id")
	postID, err := strconv.Atoi(postIDStr)
	if err != nil {
		util.SendError(w, http.StatusBadRequest, "Invalid post ID")
		return
	}

	// Check if post exists and belongs to current user
	var ownerID int
	err = db.Get(&ownerID, "SELECT user_id FROM posts WHERE id = $1", postID)
	if err != nil {
		fmt.Println("Error fetching post:", err)
		util.SendError(w, http.StatusNotFound, "Post not found")
		return
	}

	// Check ownership
	if ownerID != userIDInt {
		util.SendError(w, http.StatusForbidden, "You can only update your own posts")
		return
	}

	var req UpdatePostRequest

	decoder := json.NewDecoder(r.Body)
	err = decoder.Decode(&req)
	if err != nil {
		fmt.Println("Error decoding request:", err)
		util.SendError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	fmt.Printf("Updating post ID: %v for userID: %v\n", postID, userID)

	// Build dynamic update query
	query := `UPDATE posts SET `
	args := []interface{}{}
	paramCount := 1

	if req.Type != "" {
		query += fmt.Sprintf("type = $%d, ", paramCount)
		args = append(args, req.Type)
		paramCount++
	}

	if req.Area != "" {
		query += fmt.Sprintf("area = $%d, ", paramCount)
		args = append(args, req.Area)
		paramCount++
	}

	if req.Description != "" {
		query += fmt.Sprintf("description = $%d, ", paramCount)
		args = append(args, req.Description)
		paramCount++
	}

	if len(req.Images) > 0 {
		query += fmt.Sprintf("images = $%d, ", paramCount)
		args = append(args, pq.Array(req.Images))
		paramCount++
	}

	if req.Rooms > 0 {
		query += fmt.Sprintf("rooms = $%d, ", paramCount)
		args = append(args, req.Rooms)
		paramCount++
	}

	if req.Rent > 0 {
		query += fmt.Sprintf("rent = $%d, ", paramCount)
		args = append(args, req.Rent)
		paramCount++
	}

	if req.Budget > 0 {
		query += fmt.Sprintf("budget = $%d, ", paramCount)
		args = append(args, req.Budget)
		paramCount++
	}

	if req.RentShare > 0 {
		query += fmt.Sprintf("rent_share = $%d, ", paramCount)
		args = append(args, req.RentShare)
		paramCount++
	}

	if strings.TrimSpace(req.AvailableFrom) != "" {
		query += fmt.Sprintf("available_from = $%d, ", paramCount)
		args = append(args, req.AvailableFrom)
		paramCount++
	}

	if strings.TrimSpace(req.SharedFacilities) != "" {
		query += fmt.Sprintf("shared_facilities = $%d, ", paramCount)
		args = append(args, req.SharedFacilities)
		paramCount++
	}

	// Add updated_at
	query += fmt.Sprintf("updated_at = CURRENT_TIMESTAMP WHERE id = $%d RETURNING id, user_id, type, post_type, area, description, images, rooms, rent, budget, rent_share, floor, bathrooms, balconies, has_lift, utility_cost, available_from, shared_facilities, status, views_count, created_at, updated_at", paramCount)
	args = append(args, postID)

	var post PostResponse
	err = db.Get(&post, query, args...)
	if err != nil {
		fmt.Println("Error updating post:", err)
		util.SendError(w, http.StatusInternalServerError, "Failed to update post")
		return
	}

	fmt.Printf("Post updated successfully for postID: %v\n", postID)

	response := map[string]interface{}{
		"message": "Post updated successfully",
		"post":    convertPostToResponse(post),
	}

	util.SendData(w, http.StatusOK, response)
}
