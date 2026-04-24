package rest

import (
	"fmt"
	"net/http"
	"os"
	"strconv"

	"livesync-backend/config"
	"livesync-backend/rest/handlers/admin"
	"livesync-backend/rest/handlers/post"
	"livesync-backend/rest/handlers/user"
	"livesync-backend/rest/middlewares"
)

type Server struct {
	cnf          *config.Config
	userHandler  *user.Handler
	adminHandler *admin.Handler
	postHandler  *post.Handler
}

func NewServer(cnf *config.Config, userHandler *user.Handler, adminHandler *admin.Handler, postHandler *post.Handler) *Server {
	return &Server{
		cnf:          cnf,
		userHandler:  userHandler,
		adminHandler: adminHandler,
		postHandler:  postHandler,
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
	server.postHandler.RegisterRoutes(mux, manager)

	addr := ":" + strconv.Itoa(server.cnf.HttpPort)
	fmt.Println("🚀 Server is running on", addr)

	// Create HTTP server with increased body size limit (1MB)
	// Security and stability: prevent very large headers from consuming resources.
	httpServer := &http.Server{
		Addr:           addr,
		Handler:        wrappedMux,
		MaxHeaderBytes: 1 << 20, // 1MB
	}

	err := httpServer.ListenAndServe()

	if err != nil {
		fmt.Println("❌ Server error:", err)
		os.Exit(1)
	}
}
