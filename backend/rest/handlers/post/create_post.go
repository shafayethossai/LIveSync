package post

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"livesync-backend/util"

	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"
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

type PostResponse struct {
	ID               int            `json:"id" db:"id"`
	UserID           int            `json:"user_id" db:"user_id"`
	Type             string         `json:"type" db:"type"`
	PostType         string         `json:"post_type" db:"post_type"`
	Area             string         `json:"area" db:"area"`
	Description      string         `json:"description" db:"description"`
	Images           pq.StringArray `json:"images" db:"images"`
	Rooms            sql.NullInt64  `json:"rooms" db:"rooms"`
	Rent             sql.NullInt64  `json:"rent" db:"rent"`
	Budget           sql.NullInt64  `json:"budget" db:"budget"`
	RentShare        sql.NullInt64  `json:"rent_share" db:"rent_share"`
	Floor            sql.NullInt64  `json:"floor" db:"floor"`
	Bathrooms        sql.NullInt64  `json:"bathrooms" db:"bathrooms"`
	Balconies        sql.NullInt64  `json:"balconies" db:"balconies"`
	HasLift          bool           `json:"has_lift" db:"has_lift"`
	UtilityCost      sql.NullInt64  `json:"utility_cost" db:"utility_cost"`
	AvailableFrom    sql.NullString `json:"available_from" db:"available_from"`
	SharedFacilities sql.NullString `json:"shared_facilities" db:"shared_facilities"`
	Status           string         `json:"status" db:"status"`
	ViewsCount       int            `json:"views_count" db:"views_count"`
	CreatedAt        string         `json:"created_at" db:"created_at"`
	UpdatedAt        string         `json:"updated_at" db:"updated_at"`
}

// CreatePost creates a new post by the logged-in user
func (h *Handler) CreatePost(w http.ResponseWriter, r *http.Request) {
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

	var req CreatePostRequest

	decoder := json.NewDecoder(r.Body)
	err := decoder.Decode(&req)
	if err != nil {
		fmt.Println("Error decoding request:", err)
		util.SendError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	fmt.Printf("Creating post for userID: %v, area: %s, type: %s\n", userIDInt, req.Area, req.Type)

	// Validate required fields
	if req.Type == "" || req.PostType == "" || req.Area == "" || req.Description == "" {
		util.SendError(w, http.StatusBadRequest, "Type, post_type, area, and description are required")
		return
	}

	// Validate enum values
	validTypes := map[string]bool{"family": true, "bachelor": true}
	validPostTypes := map[string]bool{"offer": true, "requirement": true}
	if !validTypes[req.Type] || !validPostTypes[req.PostType] {
		util.SendError(w, http.StatusBadRequest, "Invalid type or post_type value")
		return
	}

	// Create post in database
	query := `
		INSERT INTO posts (user_id, type, post_type, area, description, images, rooms, rent, budget, rent_share, floor, bathrooms, balconies, has_lift, utility_cost, available_from, shared_facilities, status)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 'active')
		RETURNING id, user_id, type, post_type, area, description, images, rooms, rent, budget, rent_share, floor, bathrooms, balconies, has_lift, utility_cost, available_from, shared_facilities, status, views_count, created_at, updated_at
	`

	var post PostResponse
	imageArray := pq.Array(req.Images)
	if len(req.Images) == 0 {
		imageArray = pq.Array([]string{})
	}

	err = db.Get(&post, query,
		userIDInt,
		req.Type,
		req.PostType,
		req.Area,
		req.Description,
		imageArray,
		nullableInt(req.Rooms),
		nullableInt(req.Rent),
		nullableInt(req.Budget),
		nullableInt(req.RentShare),
		nullableInt(req.Floor),
		nullableInt(req.Bathrooms),
		nullableInt(req.Balconies),
		req.HasLift,
		nullableInt(req.UtilityCost),
		nullableString(req.AvailableFrom),
		nullableString(req.SharedFacilities),
	)

	if err != nil {
		fmt.Println("Error creating post:", err)
		fmt.Printf("Error details: %v\n", err)
		util.SendError(w, http.StatusInternalServerError, "Failed to create post: "+err.Error())
		return
	}

	fmt.Printf("Post created successfully for userID: %v, postID: %v\n", userIDInt, post.ID)

	// Convert sql.Null types and array to regular values for JSON response
	images := []string{}
	if len(post.Images) > 0 {
		images = post.Images
	}

	response := map[string]interface{}{
		"message": "Post created successfully",
		"post": map[string]interface{}{
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
		},
	}

	util.SendData(w, http.StatusCreated, response)
}

// Helper functions to handle nullable integers and strings
func nullableInt(val int) interface{} {
	if val == 0 {
		return nil
	}
	return val
}

func nullableString(val string) interface{} {
	if strings.TrimSpace(val) == "" {
		return nil
	}
	return val
}

func nullInt64ToPtr(val sql.NullInt64) interface{} {
	if !val.Valid {
		return nil
	}
	return val.Int64
}

func nullStringToPtr(val sql.NullString) interface{} {
	if !val.Valid {
		return nil
	}
	return val.String
}

// convertPostToResponse converts a PostResponse struct to a clean map for JSON
func convertPostToResponse(post PostResponse) map[string]interface{} {
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
