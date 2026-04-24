package message

import (
	"net/http"

	"livesync-backend/rest/middlewares"
)

func (h *Handler) RegisterRoutes(mux *http.ServeMux, manager *middlewares.Manager) {
	mux.Handle(
		"GET /api/messages/conversations",
		manager.With(
			http.HandlerFunc(h.GetConversations),
			h.middlewares.AuthenticateJWT,
		),
	)

	mux.Handle(
		"POST /api/messages",
		manager.With(
			http.HandlerFunc(h.SendMessage),
			h.middlewares.AuthenticateJWT,
		),
	)

	mux.Handle(
		"GET /api/messages/history",
		manager.With(
			http.HandlerFunc(h.GetConversationHistory),
			h.middlewares.AuthenticateJWT,
		),
	)

	mux.Handle(
		"PUT /api/messages/mark-as-read",
		manager.With(
			http.HandlerFunc(h.MarkAsRead),
			h.middlewares.AuthenticateJWT,
		),
	)

	mux.Handle(
		"GET /api/messages/unread-count",
		manager.With(
			http.HandlerFunc(h.GetUnreadCount),
			h.middlewares.AuthenticateJWT,
		),
	)
}
