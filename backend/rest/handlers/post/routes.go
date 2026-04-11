package post

import (
	"net/http"

	"livesync-backend/rest/middlewares"
)

func (h *Handler) RegisterRoutes(mux *http.ServeMux, manager *middlewares.Manager) {
	// Public routes
	mux.Handle(
		"GET /api/posts",
		manager.With(
			http.HandlerFunc(h.GetAllPosts),
		),
	)

	mux.Handle(
		"GET /api/posts/{id}",
		manager.With(
			http.HandlerFunc(h.GetPostByID),
		),
	)

	// Protected routes - Authentication required
	mux.Handle(
		"POST /api/posts",
		manager.With(
			http.HandlerFunc(h.CreatePost),
			h.middlewares.AuthenticateJWT,
		),
	)

	mux.Handle(
		"PUT /api/posts/{id}",
		manager.With(
			http.HandlerFunc(h.UpdatePost),
			h.middlewares.AuthenticateJWT,
		),
	)

	mux.Handle(
		"DELETE /api/posts/{id}",
		manager.With(
			http.HandlerFunc(h.DeletePost),
			h.middlewares.AuthenticateJWT,
		),
	)

	mux.Handle(
		"GET /api/user/my-posts",
		manager.With(
			http.HandlerFunc(h.GetUserPosts),
			h.middlewares.AuthenticateJWT,
		),
	)
}
