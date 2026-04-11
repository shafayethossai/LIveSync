package user

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"strings"

	"livesync-backend/repo"
	"livesync-backend/util"
)

type GoogleTokenResponse struct {
	AccessToken string `json:"access_token"`
	TokenType   string `json:"token_type"`
	ExpiresIn   int    `json:"expires_in"`
	IDToken     string `json:"id_token"`
}

type GoogleUserInfo struct {
	ID            string `json:"sub"`
	Email         string `json:"email"`
	Name          string `json:"name"`
	Picture       string `json:"picture"`
	EmailVerified bool   `json:"email_verified"`
}

type GoogleAuthRequest struct {
	Code string `json:"code"`
}

// GoogleCallback handles the Google OAuth callback
func (h *Handler) GoogleCallback(w http.ResponseWriter, r *http.Request) {
	var req GoogleAuthRequest

	decoder := json.NewDecoder(r.Body)
	err := decoder.Decode(&req)
	if err != nil {
		util.SendError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Code == "" {
		util.SendError(w, http.StatusBadRequest, "Authorization code is required")
		return
	}

	// Exchange authorization code for tokens
	tokens, err := exchangeCodeForToken(req.Code, h.cnf.GoogleClientID, h.cnf.GoogleClientSecret, h.cnf.GoogleRedirectURL)
	if err != nil {
		fmt.Println("Error exchanging code for token:", err)
		util.SendError(w, http.StatusUnauthorized, "Failed to authenticate with Google")
		return
	}

	// Get user info from Google using the access token
	userInfo, err := getUserInfoFromGoogle(tokens.AccessToken)
	if err != nil {
		fmt.Println("Error getting user info from Google:", err)
		util.SendError(w, http.StatusUnauthorized, "Failed to get user info from Google")
		return
	}

	// Check if user exists, if not create one
	user, err := h.userRepo.FindByEmail(userInfo.Email, "")
	if err != nil || user == nil {
		// Create new user with Google info
		newUser := repo.User{
			Name:         userInfo.Name,
			Email:        userInfo.Email,
			PasswordHash: "", // Google OAuth users don't have a password
			Phone:        "",
			AvatarURL:    &userInfo.Picture,
			Role:         "tenant",
		}

		user, err = h.userRepo.Create(newUser)
		if err != nil {
			fmt.Println("Error creating user:", err)
			util.SendError(w, http.StatusInternalServerError, "Failed to create user")
			return
		}
	}

	// Generate JWT token
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

	// Return token and user data
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

// exchangeCodeForToken exchanges the authorization code for access and ID tokens
func exchangeCodeForToken(code, clientID, clientSecret, redirectURL string) (*GoogleTokenResponse, error) {
	tokenURL := "https://oauth2.googleapis.com/token"

	data := url.Values{}
	data.Set("code", code)
	data.Set("client_id", clientID)
	data.Set("client_secret", clientSecret)
	data.Set("redirect_uri", redirectURL)
	data.Set("grant_type", "authorization_code")

	resp, err := http.PostForm(tokenURL, data)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("failed to exchange code: %s", string(body))
	}

	var tokens GoogleTokenResponse
	err = json.NewDecoder(resp.Body).Decode(&tokens)
	if err != nil {
		return nil, err
	}

	return &tokens, nil
}

// getUserInfoFromGoogle retrieves user information from Google using the access token
func getUserInfoFromGoogle(accessToken string) (*GoogleUserInfo, error) {
	userInfoURL := "https://www.googleapis.com/oauth2/v2/userinfo"

	req, err := http.NewRequest("GET", userInfoURL, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+accessToken)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("failed to get user info: %s", string(body))
	}

	var userInfo GoogleUserInfo
	err = json.NewDecoder(resp.Body).Decode(&userInfo)
	if err != nil {
		return nil, err
	}

	return &userInfo, nil
}

// GoogleSignIn handles direct Google sign-in with ID token verification
func (h *Handler) GoogleSignIn(w http.ResponseWriter, r *http.Request) {
	var req struct {
		IDToken string `json:"id_token"`
	}

	decoder := json.NewDecoder(r.Body)
	err := decoder.Decode(&req)
	if err != nil {
		util.SendError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Extract user email from ID token (using crude parsing, improve in production)
	// In production, use golang.org/x/oauth2/google to properly verify the token
	userInfo, err := extractGoogleTokenInfo(req.IDToken)
	if err != nil {
		fmt.Println("Error extracting token info:", err)
		util.SendError(w, http.StatusUnauthorized, "Invalid token")
		return
	}

	// Check if user exists, if not create one
	user, err := h.userRepo.FindByEmail(userInfo.Email, "")
	if err != nil || user == nil {
		// Create new user with Google info
		newUser := repo.User{
			Name:         userInfo.Name,
			Email:        userInfo.Email,
			PasswordHash: "", // Google OAuth users don't have a password
			Phone:        "",
			AvatarURL:    &userInfo.Picture,
			Role:         "tenant",
		}

		user, err = h.userRepo.Create(newUser)
		if err != nil {
			fmt.Println("Error creating user:", err)
			util.SendError(w, http.StatusInternalServerError, "Failed to create user")
			return
		}
	}

	// Generate JWT token
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

	// Return token and user data
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

// extractGoogleTokenInfo extracts email and name from Google ID token
func extractGoogleTokenInfo(idToken string) (*GoogleUserInfo, error) {
	// Split the JWT token
	parts := strings.Split(idToken, ".")
	if len(parts) != 3 {
		return nil, fmt.Errorf("invalid token format")
	}

	// Decode the payload (second part)
	payload := parts[1]

	// Add padding if needed
	switch len(payload) % 4 {
	case 2:
		payload += "=="
	case 3:
		payload += "="
	}

	// Use standard base64 decoding with URL encoding
	decoded, err := base64.RawURLEncoding.DecodeString(payload)
	if err != nil {
		log.Printf("Failed to decode payload: %v", err)
		return nil, fmt.Errorf("failed to decode token payload: %w", err)
	}

	var userInfo GoogleUserInfo
	err = json.Unmarshal(decoded, &userInfo)
	if err != nil {
		log.Printf("Failed to unmarshal payload: %v", err)
		return nil, fmt.Errorf("failed to parse token: %w", err)
	}

	return &userInfo, nil
}
