package user

import (
	"encoding/json"
	"fmt"
	"net/http"

	"livesync-backend/util"
)

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var req loginRequest

	decoder := json.NewDecoder(r.Body)
	err := decoder.Decode(&req)
	if err != nil {
		util.SendError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	user, err := h.userRepo.FindByEmail(req.Email, req.Password)
	if user == nil || err != nil {
		fmt.Println(err)
		util.SendError(w, http.StatusUnauthorized, "Invalid email or password")
		return
	}

	token, err := util.CreateJWT(h.cnf.SecretKey, util.CustomClaims{
		ID:    user.ID,
		Name:  user.Name,
		Email: user.Email,
		Role:  user.Role,
	})
	if err != nil {
		util.SendError(w, http.StatusInternalServerError, "Failed to generate token")
		return
	}

	// Return both token and user data
	response := map[string]interface{}{
		"token": token,
		"user": map[string]interface{}{
			"id":         user.ID,
			"name":       user.Name,
			"email":      user.Email,
			"phone":      user.Phone,
			"avatar_url": user.AvatarURL,
			"role":       user.Role,
			"created_at": user.CreatedAt,
		},
	}
	util.SendData(w, http.StatusOK, response)

}
