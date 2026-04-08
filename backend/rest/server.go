package rest

import (
	"fmt"
	"net/http"
	"os"
	"strconv"

	"livesync-backend/config"
	"livesync-backend/rest/handlers/admin"
	"livesync-backend/rest/handlers/user"
	"livesync-backend/rest/middlewares"
)

type Server struct {
	cnf          *config.Config
	userHandler  *user.Handler
	adminHandler *admin.Handler
}

func NewServer(cnf *config.Config, userHandler *user.Handler, adminHandler *admin.Handler) *Server {
	return &Server{
		cnf:          cnf,
		userHandler:  userHandler,
		adminHandler: adminHandler,
	}
}

func (server *Server) Start() {
	manager := middlewares.NewManager()
	manager.Use(
		middlewares.Preflight,
		middlewares.Cors,
		middlewares.Logger,
	)
	mux := http.NewServeMux()          // Router
	wrappedMux := manager.WrapMux(mux) // Wrap with global middlewares

	// Register routes
	server.userHandler.RegisterRoutes(mux, manager)
	server.adminHandler.RegisterRoutes(mux, manager)

	addr := ":" + strconv.Itoa(server.cnf.HttpPort)
	fmt.Println("🚀 Server is running on", addr)
	err := http.ListenAndServe(addr, wrappedMux)

	if err != nil {
		fmt.Println("❌ Server error:", err)
		os.Exit(1)
	}
}
