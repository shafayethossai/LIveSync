package message

import (
	"livesync-backend/config"
	"livesync-backend/repo"
	"livesync-backend/rest/middlewares"
	"livesync-backend/rest/socket"
)

type Handler struct {
	cnf           *config.Config
	messageRepo   repo.MessageRepo
	middlewares   *middlewares.Middleware
	socketManager *socket.Manager
}

func NewHandler(cnf *config.Config, messageRepo repo.MessageRepo, mw *middlewares.Middleware, socketManager *socket.Manager) *Handler {
	return &Handler{
		cnf:           cnf,
		messageRepo:   messageRepo,
		middlewares:   mw,
		socketManager: socketManager,
	}
}
