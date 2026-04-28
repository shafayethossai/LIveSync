package admin

import (
	"livesync-backend/config"
	"livesync-backend/repo"
	"livesync-backend/rest/middlewares"
)

type Handler struct {
	cnf         *config.Config
	adminRepo   repo.AdminRepo
	userRepo    repo.UserRepo
	postRepo    repo.PostRepo
	middlewares *middlewares.Middleware
	db          interface{}
}

func NewHandler(cnf *config.Config, adminRepo repo.AdminRepo, userRepo repo.UserRepo, postRepo repo.PostRepo, mw *middlewares.Middleware, db interface{}) *Handler {
	return &Handler{
		cnf:         cnf,
		adminRepo:   adminRepo,
		userRepo:    userRepo,
		postRepo:    postRepo,
		middlewares: mw,
		db:          db,
	}
}
