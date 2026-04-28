package post

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"livesync-backend/repo"
	"livesync-backend/util"
)

type CreatePostRequest struct {
	Type             string   `json:"type"`      // family, bachelor
	PostType         string   `json:"post_type"` // offer, requirement
	Area             string   `json:"area"`
	Description      string   `json:"description"`
	Images           []string `json:"images"`
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
	DistanceFrom     string   `json:"distance_from,omitempty"`
	DistanceKm       float64  `json:"distance_km,omitempty"`
}

// CreatePost creates a new post by the logged-in user
func (h *Handler) CreatePost(w http.ResponseWriter, r *http.Request) {
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

	var req CreatePostRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		fmt.Println("Error decoding request:", err)
		util.SendError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Type == "" || req.PostType == "" || req.Area == "" || req.Description == "" {
		util.SendError(w, http.StatusBadRequest, "Type, post_type, area, and description are required")
		return
	}

	validTypes := map[string]bool{"family": true, "bachelor": true}
	validPostTypes := map[string]bool{"offer": true, "requirement": true}
	if !validTypes[req.Type] || !validPostTypes[req.PostType] {
		util.SendError(w, http.StatusBadRequest, "Invalid type or post_type value")
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	post := repo.Post{
		UserID:           userIDInt,
		Type:             req.Type,
		PostType:         req.PostType,
		Area:             req.Area,
		Description:      req.Description,
		Images:           req.Images,
		Rooms:            nullableInt(req.Rooms),
		Rent:             nullableInt(req.Rent),
		Budget:           nullableInt(req.Budget),
		RentShare:        nullableInt(req.RentShare),
		Floor:            nullableInt(req.Floor),
		Bathrooms:        nullableInt(req.Bathrooms),
		Balconies:        nullableInt(req.Balconies),
		HasLift:          req.HasLift,
		UtilityCost:      nullableInt(req.UtilityCost),
		AvailableFrom:    nullableString(req.AvailableFrom),
		SharedFacilities: nullableString(req.SharedFacilities),
	}

	createdPost, err := h.postRepo.Create(ctx, post)
	if err != nil {
		fmt.Println("Error creating post:", err)
		util.SendError(w, http.StatusInternalServerError, "Failed to create post: "+err.Error())
		return
	}

	util.SendData(w, http.StatusCreated, map[string]interface{}{
		"message": "Post created successfully",
		"post":    convertPostToResponse(createdPost),
	})
}

func nullableInt(value int) sql.NullInt64 {
	if value == 0 {
		return sql.NullInt64{}
	}
	return sql.NullInt64{Int64: int64(value), Valid: true}
}

func nullableString(value string) sql.NullString {
	if strings.TrimSpace(value) == "" {
		return sql.NullString{}
	}
	return sql.NullString{String: value, Valid: true}
}

func convertPostToResponse(post *repo.Post) map[string]interface{} {
	images := []string{}
	if len(post.Images) > 0 {
		images = post.Images
	}

	return map[string]interface{}{
		"id":                post.ID,
		"user_id":           post.UserID,
		"type":              post.Type,
		"post_type":         post.PostType,
		"area":              post.Area,
		"description":       post.Description,
		"images":            images,
		"rooms":             nullInt64ToPtr(post.Rooms),
		"rent":              nullInt64ToPtr(post.Rent),
		"budget":            nullInt64ToPtr(post.Budget),
		"rent_share":        nullInt64ToPtr(post.RentShare),
		"floor":             nullInt64ToPtr(post.Floor),
		"bathrooms":         nullInt64ToPtr(post.Bathrooms),
		"balconies":         nullInt64ToPtr(post.Balconies),
		"has_lift":          post.HasLift,
		"utility_cost":      nullInt64ToPtr(post.UtilityCost),
		"available_from":    nullStringToPtr(post.AvailableFrom),
		"shared_facilities": nullStringToPtr(post.SharedFacilities),
		"status":            post.Status,
		"views_count":       post.ViewsCount,
		"created_at":        post.CreatedAt,
		"updated_at":        post.UpdatedAt,
	}
}

func nullInt64ToPtr(value sql.NullInt64) interface{} {
	if !value.Valid {
		return nil
	}
	return value.Int64
}

func nullStringToPtr(value sql.NullString) interface{} {
	if !value.Valid {
		return nil
	}
	return value.String
}
