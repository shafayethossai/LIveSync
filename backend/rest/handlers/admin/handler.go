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
	middlewares *middlewares.Middleware
	db          interface{} // Will store *sqlx.DB for direct queries
}

func NewHandler(cnf *config.Config, adminRepo repo.AdminRepo, userRepo repo.UserRepo, mw *middlewares.Middleware, db interface{}) *Handler {
	return &Handler{
		cnf:         cnf,
		adminRepo:   adminRepo,
		userRepo:    userRepo,
		middlewares: mw,
		db:          db,
	}
}
