package repo

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"
)

type Post struct {
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
	CreatedAt        time.Time      `json:"created_at" db:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at" db:"updated_at"`
}

type AdminPost struct {
	Post
	UserName  string `json:"user_name" db:"user_name"`
	UserEmail string `json:"user_email" db:"user_email"`
}

type PostUpdateFields struct {
	Type             *string
	PostType         *string
	Area             *string
	Description      *string
	Images           *[]string
	Rooms            *int
	Rent             *int
	Budget           *int
	RentShare        *int
	Floor            *int
	Bathrooms        *int
	Balconies        *int
	HasLift          *bool
	UtilityCost      *int
	AvailableFrom    *string
	SharedFacilities *string
}

type PostRepo interface {
	Create(ctx context.Context, post Post) (*Post, error)
	GetByID(ctx context.Context, id int) (*Post, error)
	GetAllActive(ctx context.Context, limit, offset int) ([]Post, int, error)
	GetByUserID(ctx context.Context, userID, limit, offset int) ([]Post, int, error)
	GetOwnerID(ctx context.Context, postID int) (int, error)
	UpdateByIDAndOwner(ctx context.Context, postID, ownerID int, fields PostUpdateFields) (*Post, error)
	DeleteByIDAndOwner(ctx context.Context, postID, ownerID int) error
	IncrementViews(ctx context.Context, postID int) error
	GetAdminPostByID(ctx context.Context, postID int) (*AdminPost, error)
	ListAdminPosts(ctx context.Context, status string, limit, offset int) ([]AdminPost, int, error)
	SetStatus(ctx context.Context, postID int, status string) (*Post, error)
	DeleteByID(ctx context.Context, postID int) error
}

type postRepo struct {
	db *sqlx.DB
}

var (
	ErrPostNotFound = errors.New("post not found")
)

func NewPostRepo(db *sqlx.DB) PostRepo {
	return &postRepo{db: db}
}

func (r *postRepo) Create(ctx context.Context, post Post) (*Post, error) {
	if len(post.Images) == 0 {
		post.Images = pq.StringArray{}
	}

	query := `
		INSERT INTO posts (
			user_id, type, post_type, area, description, images, rooms, rent, budget, rent_share,
			floor, bathrooms, balconies, has_lift, utility_cost, available_from, shared_facilities, status
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
			$11, $12, $13, $14, $15, $16, $17, 'active'
		)
		RETURNING id, user_id, type, post_type, area, description, images, rooms, rent, budget, rent_share,
			floor, bathrooms, balconies, has_lift, utility_cost, available_from, shared_facilities, status, views_count, created_at, updated_at
	`

	var created Post
	err := r.db.QueryRowxContext(ctx, query,
		post.UserID,
		post.Type,
		post.PostType,
		post.Area,
		post.Description,
		post.Images,
		post.Rooms,
		post.Rent,
		post.Budget,
		post.RentShare,
		post.Floor,
		post.Bathrooms,
		post.Balconies,
		post.HasLift,
		post.UtilityCost,
		post.AvailableFrom,
		post.SharedFacilities,
	).StructScan(&created)
	if err != nil {
		return nil, err
	}

	return &created, nil
}

func (r *postRepo) GetByID(ctx context.Context, id int) (*Post, error) {
	var post Post
	query := `
		SELECT id, user_id, type, post_type, area, description, images, rooms, rent, budget,
			rent_share, floor, bathrooms, balconies, has_lift, utility_cost, available_from,
			shared_facilities, status, views_count, created_at, updated_at
		FROM posts
		WHERE id = $1
	`

	err := r.db.GetContext(ctx, &post, query, id)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrPostNotFound
		}
		return nil, err
	}

	return &post, nil
}

func (r *postRepo) GetAllActive(ctx context.Context, limit, offset int) ([]Post, int, error) {
	type postWithCount struct {
		Post
		TotalCount int `db:"total_count"`
	}

	query := `
		SELECT id, user_id, type, post_type, area, description, images, rooms, rent, budget,
			rent_share, floor, bathrooms, balconies, has_lift, utility_cost, available_from,
			shared_facilities, status, views_count, created_at, updated_at,
			COUNT(*) OVER() AS total_count
		FROM posts
		WHERE status = 'active'
		ORDER BY created_at DESC
		LIMIT $1 OFFSET $2
	`

	var rows []postWithCount
	err := r.db.SelectContext(ctx, &rows, query, limit, offset)
	if err != nil {
		return nil, 0, err
	}

	posts := make([]Post, len(rows))
	count := 0
	for i, row := range rows {
		posts[i] = row.Post
		if i == 0 {
			count = row.TotalCount
		}
	}

	return posts, count, nil
}

func (r *postRepo) GetByUserID(ctx context.Context, userID, limit, offset int) ([]Post, int, error) {
	type postWithCount struct {
		Post
		TotalCount int `db:"total_count"`
	}

	query := `
		SELECT id, user_id, type, post_type, area, description, images, rooms, rent, budget,
			rent_share, floor, bathrooms, balconies, has_lift, utility_cost, available_from,
			shared_facilities, status, views_count, created_at, updated_at,
			COUNT(*) OVER() AS total_count
		FROM posts
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`

	var rows []postWithCount
	err := r.db.SelectContext(ctx, &rows, query, userID, limit, offset)
	if err != nil {
		return nil, 0, err
	}

	posts := make([]Post, len(rows))
	count := 0
	for i, row := range rows {
		posts[i] = row.Post
		if i == 0 {
			count = row.TotalCount
		}
	}

	return posts, count, nil
}

func (r *postRepo) GetOwnerID(ctx context.Context, postID int) (int, error) {
	var ownerID int
	query := `SELECT user_id FROM posts WHERE id = $1`
	err := r.db.GetContext(ctx, &ownerID, query, postID)
	if err != nil {
		if err == sql.ErrNoRows {
			return 0, ErrPostNotFound
		}
		return 0, err
	}
	return ownerID, nil
}

func (r *postRepo) UpdateByIDAndOwner(ctx context.Context, postID, ownerID int, fields PostUpdateFields) (*Post, error) {
	assignments := []string{}
	args := []interface{}{}
	param := 1

	if fields.Type != nil {
		assignments = append(assignments, fmt.Sprintf("type = $%d", param))
		args = append(args, *fields.Type)
		param++
	}
	if fields.PostType != nil {
		assignments = append(assignments, fmt.Sprintf("post_type = $%d", param))
		args = append(args, *fields.PostType)
		param++
	}
	if fields.Area != nil {
		assignments = append(assignments, fmt.Sprintf("area = $%d", param))
		args = append(args, *fields.Area)
		param++
	}
	if fields.Description != nil {
		assignments = append(assignments, fmt.Sprintf("description = $%d", param))
		args = append(args, *fields.Description)
		param++
	}
	if fields.Images != nil {
		assignments = append(assignments, fmt.Sprintf("images = $%d", param))
		args = append(args, pq.Array(*fields.Images))
		param++
	}
	if fields.Rooms != nil {
		assignments = append(assignments, fmt.Sprintf("rooms = $%d", param))
		args = append(args, sql.NullInt64{Int64: int64(*fields.Rooms), Valid: true})
		param++
	}
	if fields.Rent != nil {
		assignments = append(assignments, fmt.Sprintf("rent = $%d", param))
		args = append(args, sql.NullInt64{Int64: int64(*fields.Rent), Valid: true})
		param++
	}
	if fields.Budget != nil {
		assignments = append(assignments, fmt.Sprintf("budget = $%d", param))
		args = append(args, sql.NullInt64{Int64: int64(*fields.Budget), Valid: true})
		param++
	}
	if fields.RentShare != nil {
		assignments = append(assignments, fmt.Sprintf("rent_share = $%d", param))
		args = append(args, sql.NullInt64{Int64: int64(*fields.RentShare), Valid: true})
		param++
	}
	if fields.Floor != nil {
		assignments = append(assignments, fmt.Sprintf("floor = $%d", param))
		args = append(args, sql.NullInt64{Int64: int64(*fields.Floor), Valid: true})
		param++
	}
	if fields.Bathrooms != nil {
		assignments = append(assignments, fmt.Sprintf("bathrooms = $%d", param))
		args = append(args, sql.NullInt64{Int64: int64(*fields.Bathrooms), Valid: true})
		param++
	}
	if fields.Balconies != nil {
		assignments = append(assignments, fmt.Sprintf("balconies = $%d", param))
		args = append(args, sql.NullInt64{Int64: int64(*fields.Balconies), Valid: true})
		param++
	}
	if fields.HasLift != nil {
		assignments = append(assignments, fmt.Sprintf("has_lift = $%d", param))
		args = append(args, *fields.HasLift)
		param++
	}
	if fields.UtilityCost != nil {
		assignments = append(assignments, fmt.Sprintf("utility_cost = $%d", param))
		args = append(args, sql.NullInt64{Int64: int64(*fields.UtilityCost), Valid: true})
		param++
	}
	if fields.AvailableFrom != nil {
		assignments = append(assignments, fmt.Sprintf("available_from = $%d", param))
		args = append(args, sql.NullString{String: *fields.AvailableFrom, Valid: strings.TrimSpace(*fields.AvailableFrom) != ""})
		param++
	}
	if fields.SharedFacilities != nil {
		assignments = append(assignments, fmt.Sprintf("shared_facilities = $%d", param))
		args = append(args, sql.NullString{String: *fields.SharedFacilities, Valid: strings.TrimSpace(*fields.SharedFacilities) != ""})
		param++
	}

	if len(assignments) == 0 {
		return nil, errors.New("no fields to update")
	}

	assignments = append(assignments, fmt.Sprintf("updated_at = CURRENT_TIMESTAMP"))
	query := fmt.Sprintf(`UPDATE posts SET %s WHERE id = $%d AND user_id = $%d RETURNING id, user_id, type, post_type, area, description, images, rooms, rent, budget, rent_share, floor, bathrooms, balconies, has_lift, utility_cost, available_from, shared_facilities, status, views_count, created_at, updated_at`, strings.Join(assignments, ", "), param, param+1)
	args = append(args, postID, ownerID)

	var updated Post
	err := r.db.GetContext(ctx, &updated, query, args...)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrPostNotFound
		}
		return nil, err
	}

	return &updated, nil
}

func (r *postRepo) DeleteByIDAndOwner(ctx context.Context, postID, ownerID int) error {
	query := `DELETE FROM posts WHERE id = $1 AND user_id = $2`
	res, err := r.db.ExecContext(ctx, query, postID, ownerID)
	if err != nil {
		return err
	}
	rows, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return ErrPostNotFound
	}
	return nil
}

func (r *postRepo) IncrementViews(ctx context.Context, postID int) error {
	query := `UPDATE posts SET views_count = views_count + 1 WHERE id = $1`
	_, err := r.db.ExecContext(ctx, query, postID)
	return err
}

func (r *postRepo) GetAdminPostByID(ctx context.Context, postID int) (*AdminPost, error) {
	var post AdminPost
	query := `
		SELECT p.id, p.user_id, p.type, p.post_type, p.area, p.description, p.images, p.rooms,
			p.rent, p.budget, p.status, p.views_count, p.created_at,
			u.name AS user_name, u.email AS user_email
		FROM posts p
		JOIN users u ON p.user_id = u.id
		WHERE p.id = $1
	`

	err := r.db.GetContext(ctx, &post, query, postID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrPostNotFound
		}
		return nil, err
	}

	return &post, nil
}

func (r *postRepo) ListAdminPosts(ctx context.Context, status string, limit, offset int) ([]AdminPost, int, error) {
	type adminPostWithCount struct {
		AdminPost
		TotalCount int `db:"total_count"`
	}

	query := `
		SELECT p.id, p.user_id, p.type, p.post_type, p.area, p.description, p.images, p.rooms,
			p.rent, p.budget, p.status, p.views_count, p.created_at,
			u.name AS user_name, u.email AS user_email,
			COUNT(*) OVER() AS total_count
		FROM posts p
		JOIN users u ON p.user_id = u.id
	`

	args := []interface{}{}
	if status != "" {
		query += ` WHERE p.status = $1`
		args = append(args, status)
		query += ` ORDER BY p.created_at DESC LIMIT $2 OFFSET $3`
		args = append(args, limit, offset)
	} else {
		query += ` ORDER BY p.created_at DESC LIMIT $1 OFFSET $2`
		args = append(args, limit, offset)
	}

	var rows []adminPostWithCount
	err := r.db.SelectContext(ctx, &rows, query, args...)
	if err != nil {
		return nil, 0, err
	}

	posts := make([]AdminPost, len(rows))
	count := 0
	for i, row := range rows {
		posts[i] = row.AdminPost
		if i == 0 {
			count = row.TotalCount
		}
	}

	return posts, count, nil
}

func (r *postRepo) SetStatus(ctx context.Context, postID int, status string) (*Post, error) {
	query := `
		UPDATE posts
		SET status = $1
		WHERE id = $2
		RETURNING id, user_id, type, post_type, area, description, images, rooms, rent, budget,
			rent_share, floor, bathrooms, balconies, has_lift, utility_cost, available_from,
			shared_facilities, status, views_count, created_at, updated_at
	`

	var post Post
	err := r.db.GetContext(ctx, &post, query, status, postID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrPostNotFound
		}
		return nil, err
	}

	return &post, nil
}

func (r *postRepo) DeleteByID(ctx context.Context, postID int) error {
	query := `DELETE FROM posts WHERE id = $1`
	res, err := r.db.ExecContext(ctx, query, postID)
	if err != nil {
		return err
	}
	rows, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return ErrPostNotFound
	}
	return nil
}
