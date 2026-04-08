package admin

import (
	"net/http"

	"livesync-backend/rest/middlewares"
)

func (h *Handler) RegisterRoutes(mux *http.ServeMux, manager *middlewares.Manager) {
	// Public route - No authentication required
	mux.Handle(
		"POST /api/admin/login",
		manager.With(
			http.HandlerFunc(h.Login),
		),
	)

	// Dashboard - Statistics
	mux.Handle(
		"GET /api/admin/stats",
		manager.With(
			http.HandlerFunc(h.GetStats),
			h.middlewares.AuthenticateJWT,
		),
	)

	// User Management
	mux.Handle(
		"GET /api/admin/users",
		manager.With(
			http.HandlerFunc(h.GetAllUsers),
			h.middlewares.AuthenticateJWT,
		),
	)

	mux.Handle(
		"GET /api/admin/users/{userId}",
		manager.With(
			http.HandlerFunc(h.GetUserByID),
			h.middlewares.AuthenticateJWT,
		),
	)

	mux.Handle(
		"PUT /api/admin/users/{userId}/suspend",
		manager.With(
			http.HandlerFunc(h.SuspendUser),
			h.middlewares.AuthenticateJWT,
		),
	)

	mux.Handle(
		"PUT /api/admin/users/{userId}/activate",
		manager.With(
			http.HandlerFunc(h.ActivateUser),
			h.middlewares.AuthenticateJWT,
		),
	)

	// Post Management
	mux.Handle(
		"GET /api/admin/posts",
		manager.With(
			http.HandlerFunc(h.GetAllPosts),
			h.middlewares.AuthenticateJWT,
		),
	)

	mux.Handle(
		"GET /api/admin/posts/{postId}",
		manager.With(
			http.HandlerFunc(h.GetPostByID),
			h.middlewares.AuthenticateJWT,
		),
	)

	mux.Handle(
		"DELETE /api/admin/posts/{postId}",
		manager.With(
			http.HandlerFunc(h.DeletePost),
			h.middlewares.AuthenticateJWT,
		),
	)

	mux.Handle(
		"PUT /api/admin/posts/{postId}/reject",
		manager.With(
			http.HandlerFunc(h.RejectPost),
			h.middlewares.AuthenticateJWT,
		),
	)

	mux.Handle(
		"PUT /api/admin/posts/{postId}/approve",
		manager.With(
			http.HandlerFunc(h.ApprovePost),
			h.middlewares.AuthenticateJWT,
		),
	)
}
