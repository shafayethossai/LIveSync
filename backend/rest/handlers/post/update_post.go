package post

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"livesync-backend/repo"
	"livesync-backend/util"
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
	HasLift          *bool    `json:"has_lift,omitempty"`
	UtilityCost      int      `json:"utility_cost,omitempty"`
	AvailableFrom    string   `json:"available_from,omitempty"`
	SharedFacilities string   `json:"shared_facilities,omitempty"`
}

// UpdatePost updates a post (only owner can update their own post)
func (h *Handler) UpdatePost(w http.ResponseWriter, r *http.Request) {
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

	postIDStr := r.PathValue("id")
	postID, err := strconv.Atoi(postIDStr)
	if err != nil {
		util.SendError(w, http.StatusBadRequest, "Invalid post ID")
		return
	}

	var req UpdatePostRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		fmt.Println("Error decoding request:", err)
		util.SendError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Type == "" && req.PostType == "" && req.Area == "" && req.Description == "" && len(req.Images) == 0 && req.Rooms == 0 && req.Rent == 0 && req.Budget == 0 && req.RentShare == 0 && req.Floor == 0 && req.Bathrooms == 0 && req.Balconies == 0 && req.HasLift == nil && strings.TrimSpace(req.AvailableFrom) == "" && strings.TrimSpace(req.SharedFacilities) == "" {
		util.SendError(w, http.StatusBadRequest, "No fields provided for update")
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	ownerID, err := h.postRepo.GetOwnerID(ctx, postID)
	if err != nil {
		if err == repo.ErrPostNotFound {
			util.SendError(w, http.StatusNotFound, "Post not found")
			return
		}
		fmt.Println("Error fetching post owner:", err)
		util.SendError(w, http.StatusInternalServerError, "Failed to check post ownership")
		return
	}

	if ownerID != userIDInt {
		util.SendError(w, http.StatusForbidden, "You can only update your own posts")
		return
	}

	fields := repo.PostUpdateFields{}
	if req.Type != "" {
		fields.Type = &req.Type
	}
	if req.PostType != "" {
		fields.PostType = &req.PostType
	}
	if req.Area != "" {
		fields.Area = &req.Area
	}
	if req.Description != "" {
		fields.Description = &req.Description
	}
	if len(req.Images) > 0 {
		fields.Images = &req.Images
	}
	if req.Rooms > 0 {
		fields.Rooms = &req.Rooms
	}
	if req.Rent > 0 {
		fields.Rent = &req.Rent
	}
	if req.Budget > 0 {
		fields.Budget = &req.Budget
	}
	if req.RentShare > 0 {
		fields.RentShare = &req.RentShare
	}
	if req.Floor > 0 {
		fields.Floor = &req.Floor
	}
	if req.Bathrooms > 0 {
		fields.Bathrooms = &req.Bathrooms
	}
	if req.Balconies > 0 {
		fields.Balconies = &req.Balconies
	}
	if req.HasLift != nil {
		fields.HasLift = req.HasLift
	}
	if req.UtilityCost > 0 {
		fields.UtilityCost = &req.UtilityCost
	}
	if strings.TrimSpace(req.AvailableFrom) != "" {
		fields.AvailableFrom = &req.AvailableFrom
	}
	if strings.TrimSpace(req.SharedFacilities) != "" {
		fields.SharedFacilities = &req.SharedFacilities
	}

	updatedPost, err := h.postRepo.UpdateByIDAndOwner(ctx, postID, userIDInt, fields)
	if err != nil {
		if err == repo.ErrPostNotFound {
			util.SendError(w, http.StatusNotFound, "Post not found")
			return
		}
		fmt.Println("Error updating post:", err)
		util.SendError(w, http.StatusInternalServerError, "Failed to update post")
		return
	}

	util.SendData(w, http.StatusOK, map[string]interface{}{
		"message": "Post updated successfully",
		"post":    convertPostToResponse(updatedPost),
	})
}
