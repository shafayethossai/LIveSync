package socket

import (
	"fmt"
	"net/http"
	"strings"

	"livesync-backend/config"
	"livesync-backend/util"

	"github.com/gorilla/websocket"
)

type Handler struct {
	cnf     *config.Config
	manager *Manager
}

func NewHandler(cnf *config.Config, manager *Manager) *Handler {
	return &Handler{cnf: cnf, manager: manager}
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func (h *Handler) ServeWS(w http.ResponseWriter, r *http.Request) {
	token := r.URL.Query().Get("token")
	if token == "" {
		authHeader := r.Header.Get("Authorization")
		if authHeader != "" {
			parts := strings.Split(authHeader, " ")
			if len(parts) == 2 && parts[0] == "Bearer" {
				token = parts[1]
			}
		}
	}

	if token == "" {
		http.Error(w, "Unauthorized: missing token", http.StatusUnauthorized)
		return
	}

	claims, err := util.VerifyJWT(h.cnf.SecretKey, token)
	if err != nil {
		http.Error(w, "Unauthorized: invalid token", http.StatusUnauthorized)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		fmt.Println("websocket upgrade failed:", err)
		return
	}

	userID := claims.ID
	h.manager.AddConnection(userID, conn)
	h.manager.BroadcastToUser(userID, "connected", map[string]interface{}{"userId": userID})

	defer func() {
		h.manager.RemoveConnection(userID, conn)
		_ = conn.Close()
	}()

	for {
		if _, _, readErr := conn.ReadMessage(); readErr != nil {
			break
		}
	}
}
