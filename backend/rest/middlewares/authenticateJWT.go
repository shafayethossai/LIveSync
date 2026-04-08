package middlewares

import (
	"context"
	"net/http"
	"strings"

	"livesync-backend/util"
)

func (m *Middleware) AuthenticateJWT(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			util.SendError(w, http.StatusUnauthorized, "Unauthorized: No token provided")
			return
		}

		headerParts := strings.Split(authHeader, " ")
		if len(headerParts) != 2 || headerParts[0] != "Bearer" {
			util.SendError(w, http.StatusUnauthorized, "Unauthorized: Invalid token format")
			return
		}

		claims, err := util.VerifyJWT(m.cnf.SecretKey, headerParts[1])
		if err != nil {
			util.SendError(w, http.StatusUnauthorized, "Unauthorized: Invalid or expired token")
			return
		}

		// Add user info to context
		ctx := context.WithValue(r.Context(), "userID", claims.ID)
		ctx = context.WithValue(ctx, "userRole", claims.Role)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
