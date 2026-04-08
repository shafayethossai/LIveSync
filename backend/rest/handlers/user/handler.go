package user

import (
	"livesync-backend/config"
	"livesync-backend/repo"
	"livesync-backend/rest/middlewares"
)

type Handler struct {
	cnf         *config.Config
	userRepo    repo.UserRepo
	middlewares *middlewares.Middleware
}

func NewHandler(cnf *config.Config, userRepo repo.UserRepo, mw *middlewares.Middleware) *Handler {
	return &Handler{
		cnf:         cnf,
		userRepo:    userRepo,
		middlewares: mw,
	}
}
