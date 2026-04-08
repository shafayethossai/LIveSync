package repo

import (
	"database/sql"
	"errors"
	"fmt"

	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"
)

type Admin struct {
	ID           int     `json:"id" db:"id"`
	Name         string  `json:"name" db:"name"`
	Email        string  `json:"email" db:"email"`
	PasswordHash string  `json:"password_hash" db:"password_hash"`
	Role         string  `json:"role" db:"role"`
	CreatedAt    string  `json:"created_at" db:"created_at"`
	LastLogin    *string `json:"last_login" db:"last_login"`
}

type AdminRepo interface {
	Create(admin Admin) (*Admin, error)
	FindByEmail(email string, password string) (*Admin, error)
	FindByID(id string) (*Admin, error)
	UpdateLastLogin(id string) error
}

type adminRepo struct {
	db *sqlx.DB
}

var ErrAdminExists = errors.New("admin already exists")

func NewAdminRepo(db *sqlx.DB) AdminRepo {
	return &adminRepo{
		db: db,
	}
}

func (r *adminRepo) Create(admin Admin) (*Admin, error) {
	hashedPassword, err := bcrypt.GenerateFromPassword(
		[]byte(admin.PasswordHash),
		bcrypt.DefaultCost,
	)
	if err != nil {
		return nil, err
	}
	admin.PasswordHash = string(hashedPassword)

	query := `
		INSERT INTO admin_users (
			name, 
			email, 
			password_hash, 
			role
		) VALUES (
			$1, 
			$2, 
			$3, 
			$4
		)
		RETURNING id, created_at
	`

	row := r.db.QueryRow(query, admin.Name, admin.Email, admin.PasswordHash, admin.Role)

	err = row.Scan(&admin.ID, &admin.CreatedAt)
	if err != nil {
		pqErr, ok := err.(*pq.Error)

		if ok && pqErr.Code == "23505" {
			return nil, ErrAdminExists
		}
		return nil, err
	}

	return &admin, nil
}

func (r *adminRepo) FindByEmail(email string, password string) (*Admin, error) {
	var admin Admin
	query := `
		SELECT id, name, email, password_hash, role, created_at, last_login
		FROM admin_users
		WHERE email = $1 LIMIT 1
	`

	err := r.db.Get(&admin, query, email)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	err = bcrypt.CompareHashAndPassword(
		[]byte(admin.PasswordHash),
		[]byte(password),
	)
	if err != nil {
		fmt.Println(err)
		return nil, nil
	}

	return &admin, nil
}

func (r *adminRepo) FindByID(id string) (*Admin, error) {
	var admin Admin
	query := `
		SELECT id, name, email, password_hash, role, created_at, last_login
		FROM admin_users
		WHERE id = $1 LIMIT 1
	`

	err := r.db.Get(&admin, query, id)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	return &admin, nil
}

func (r *adminRepo) UpdateLastLogin(id string) error {
	query := `
		UPDATE admin_users 
		SET last_login = CURRENT_TIMESTAMP 
		WHERE id = $1
	`

	_, err := r.db.Exec(query, id)
	return err
}
