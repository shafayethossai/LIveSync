package post

import (
	"fmt"
	"net/http"
	"strconv"

	"livesync-backend/util"

	"github.com/jmoiron/sqlx"
)

// DeletePost deletes a post (only owner can delete their own post)
func (h *Handler) DeletePost(w http.ResponseWriter, r *http.Request) {
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
		util.SendError(w, http.StatusForbidden, "You can only delete your own posts")
		return
	}

	fmt.Printf("Deleting post ID: %v for userID: %v\n", postID, userIDInt)

	// Delete the post (cascades to favorites and messages)
	query := `DELETE FROM posts WHERE id = $1`
	result, err := db.Exec(query, postID)
	if err != nil {
		fmt.Println("Error deleting post:", err)
		util.SendError(w, http.StatusInternalServerError, "Failed to delete post")
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil || rowsAffected == 0 {
		util.SendError(w, http.StatusNotFound, "Post not found")
		return
	}

	fmt.Printf("Post deleted successfully for postID: %v\n", postID)

	response := map[string]interface{}{
		"message": "Post deleted successfully",
		"post_id": postID,
	}

	util.SendData(w, http.StatusOK, response)
}
