package post

import (
	"livesync-backend/config"
	"livesync-backend/rest/middlewares"
)

type Handler struct {
	cnf         *config.Config
	middlewares *middlewares.Middleware
	db          interface{} // Will store *sqlx.DB for direct queries
}

func NewHandler(cnf *config.Config, mw *middlewares.Middleware, db interface{}) *Handler {
	return &Handler{
		cnf:         cnf,
		middlewares: mw,
		db:          db,
	}
}
