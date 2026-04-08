package user

import (
	"encoding/json"
	"fmt"
	"net/http"

	"livesync-backend/repo"
	"livesync-backend/util"
)

type CreateUserRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
	Phone    string `json:"phone,omitempty"`
	Role     string `json:"role,omitempty"`
}

func (h *Handler) CreateUser(w http.ResponseWriter, r *http.Request) {
	var req CreateUserRequest

	decoder := json.NewDecoder(r.Body)
	err := decoder.Decode(&req)
	if err != nil {
		fmt.Println(err)
		util.SendError(w, http.StatusBadRequest, "Invalid req body")
		return
	}

	// Validate required fields
	if req.Name == "" || req.Email == "" || req.Password == "" {
		util.SendError(w, http.StatusBadRequest, "Name, email, and password are required")
		return
	}

	// Default role to 'tenant'
	role := "tenant"
	if req.Role != "" {
		role = req.Role
	}

	user, err := h.userRepo.Create(repo.User{
		Name:         req.Name,
		Email:        req.Email,
		PasswordHash: req.Password,
		Phone:        req.Phone,
		Role:         role,
	})
	if err != nil {
		fmt.Println(err)
		util.SendError(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}

	util.SendData(w, http.StatusCreated, user)
}
