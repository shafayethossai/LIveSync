package user

import (
	"net/http"

	"livesync-backend/rest/middlewares"
)

func (h *Handler) RegisterRoutes(mux *http.ServeMux, manager *middlewares.Manager) {
	// Protected route
	// mux.Handle("GET /auth/me", manager.With(
	// 	http.HandlerFunc(h.GetUserByJWT),
	// 	h.mw.AuthenticateJWT,
	// ))

	mux.Handle(
		"POST /api/users",
		manager.With(
			http.HandlerFunc(h.CreateUser),
		),
	)

	mux.Handle(
		"POST /api/users/login",
		manager.With(
			http.HandlerFunc(h.Login),
		),
	)

	mux.Handle(
		"GET /api/users/me",
		manager.With(
			http.HandlerFunc(h.GetUserByJWT),
			h.middlewares.AuthenticateJWT,
		),
	)
}
