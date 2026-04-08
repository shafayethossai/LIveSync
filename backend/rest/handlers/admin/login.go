package admin

import (
	"encoding/json"
	"fmt"
	"net/http"

	"livesync-backend/util"
)

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Token string                 `json:"token"`
	Admin map[string]interface{} `json:"admin"`
}

// Demo credentials - fixed
const (
	DEMO_ADMIN_EMAIL    = "admin@livesync.com"
	DEMO_ADMIN_PASSWORD = "admin123"
)

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest

	decoder := json.NewDecoder(r.Body)
	err := decoder.Decode(&req)
	if err != nil {
		util.SendError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate against demo credentials
	if req.Email != DEMO_ADMIN_EMAIL || req.Password != DEMO_ADMIN_PASSWORD {
		util.SendError(w, http.StatusUnauthorized, "Invalid email or password")
		return
	}

	// Generate JWT token
	token, err := util.CreateJWT(h.cnf.SecretKey, util.CustomClaims{
		ID:    1,
		Name:  "Admin User",
		Email: req.Email,
		Role:  "admin",
	})
	if err != nil {
		fmt.Println("Error generating token:", err)
		util.SendError(w, http.StatusInternalServerError, "Failed to generate token")
		return
	}

	// Return token and admin data
	response := LoginResponse{
		Token: token,
		Admin: map[string]interface{}{
			"id":    1,
			"name":  "Admin User",
			"email": req.Email,
			"role":  "admin",
		},
	}

	util.SendData(w, http.StatusOK, response)
}
