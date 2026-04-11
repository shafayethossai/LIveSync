package user

import (
	"net/http"

	"livesync-backend/rest/middlewares"
)

func (h *Handler) RegisterRoutes(mux *http.ServeMux, manager *middlewares.Manager) {
	// Public routes - No authentication required
	mux.Handle(
		"POST /api/users",
		manager.With(
			http.HandlerFunc(h.CreateUser),
		),
	)

	// OTP-based signup flow
	mux.Handle(
		"POST /api/auth/signup/request-otp",
		manager.With(
			http.HandlerFunc(h.RequestOTP),
		),
	)

	mux.Handle(
		"POST /api/auth/signup/verify-otp",
		manager.With(
			http.HandlerFunc(h.VerifyOTP),
		),
	)

	mux.Handle(
		"POST /api/auth/signup/resend-otp",
		manager.With(
			http.HandlerFunc(h.ResendOTP),
		),
	)

	mux.Handle(
		"POST /api/users/login",
		manager.With(
			http.HandlerFunc(h.Login),
		),
	)

	// Google OAuth routes
	mux.Handle(
		"POST /api/auth/google/callback",
		manager.With(
			http.HandlerFunc(h.GoogleCallback),
		),
	)

	mux.Handle(
		"POST /api/auth/google/signin",
		manager.With(
			http.HandlerFunc(h.GoogleSignIn),
		),
	)

	// Protected routes - Authentication required
	mux.Handle(
		"GET /api/users/me",
		manager.With(
			http.HandlerFunc(h.GetUserByJWT),
			h.middlewares.AuthenticateJWT,
		),
	)

	mux.Handle(
		"GET /api/user/profile",
		manager.With(
			http.HandlerFunc(h.GetProfile),
			h.middlewares.AuthenticateJWT,
		),
	)

	mux.Handle(
		"PUT /api/user/profile",
		manager.With(
			http.HandlerFunc(h.UpdateProfile),
			h.middlewares.AuthenticateJWT,
		),
	)
}
