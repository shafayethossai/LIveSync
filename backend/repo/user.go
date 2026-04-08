package repo

import (
	"database/sql"
	"errors"
	"fmt"

	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"
)

type User struct {
	ID           int    `json:"id" db:"id"`
	Name         string `json:"name" db:"name"`
	Email        string `json:"email" db:"email"`
	PasswordHash string `json:"password_hash" db:"password_hash"`
	Phone        string `json:"phone" db:"phone"`
	Role         string `json:"role" db:"role"`
	CreatedAt    string `json:"created_at" db:"created_at"`
}

type UserRepo interface {
	Create(user User) (*User, error)
	FindByEmail(email string, password string) (*User, error)
	FindByID(id string) (*User, error)
}

type userRepo struct {
	db *sqlx.DB
}

var ErrUserExists = errors.New("user already exists")

func NewUserRepo(db *sqlx.DB) UserRepo {
	return &userRepo{
		db: db,
	}
}

func (r *userRepo) Create(user User) (*User, error) {
	hashedPassword, err := bcrypt.GenerateFromPassword(
		[]byte(user.PasswordHash),
		bcrypt.DefaultCost,
	)
	if err != nil {
		return nil, err
	}
	user.PasswordHash = string(hashedPassword)

	query := `
		INSERT INTO users (
			name, 
			email, 
			password_hash, 
			phone, 
			role
		) VALUES (
			$1, 
			$2, 
			$3, 
			$4, 
			$5
		)
		RETURNING id
	`

	row := r.db.QueryRow(query, user.Name, user.Email, user.PasswordHash, user.Phone, user.Role)

	err = row.Scan(&user.ID)
	if err != nil {
		pqErr, ok := err.(*pq.Error)

		if ok && pqErr.Code == "23505" {
			return nil, ErrUserExists
		}
		return nil, err
	}

	return &user, nil
}

func (r *userRepo) FindByEmail(email string, password string) (*User, error) {
	var user User
	query := `
		SELECT id, name, email, password_hash, phone, role
		FROM users
		WHERE email = $1 LIMIT 1
	`

	err := r.db.Get(&user, query, email)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	err = bcrypt.CompareHashAndPassword(
		[]byte(user.PasswordHash),
		[]byte(password),
	)
	if err != nil {
		fmt.Println(err)
		return nil, nil
	}

	return &user, nil
}

func (r *userRepo) FindByID(id string) (*User, error) {
	var user User
	query := `
		SELECT id, name, email, password_hash, phone, role, created_at
		FROM users
		WHERE id = $1 LIMIT 1
	`

	err := r.db.Get(&user, query, id)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	return &user, nil
}
