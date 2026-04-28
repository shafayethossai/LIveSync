package post

import (
	"livesync-backend/config"
	"livesync-backend/repo"
	"livesync-backend/rest/middlewares"
)

type Handler struct {
	cnf         *config.Config
	middlewares *middlewares.Middleware
	postRepo    repo.PostRepo
}

func NewHandler(cnf *config.Config, postRepo repo.PostRepo, mw *middlewares.Middleware) *Handler {
	return &Handler{
		cnf:         cnf,
		middlewares: mw,
		postRepo:    postRepo,
	}
}
