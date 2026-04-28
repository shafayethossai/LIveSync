package cmd

import (
	"fmt"
	"os"

	"livesync-backend/config"
	"livesync-backend/infra/db"
	"livesync-backend/repo"
	"livesync-backend/rest"
	adminHandler "livesync-backend/rest/handlers/admin"
	messageHandler "livesync-backend/rest/handlers/message"
	postHandler "livesync-backend/rest/handlers/post"
	userHandler "livesync-backend/rest/handlers/user"
	"livesync-backend/rest/middlewares"
	"livesync-backend/rest/socket"
)

func Serve() {
	cnf := config.GetConfig()

	dbCon, err := db.NewConnection(cnf.ConnectionString)
	if err != nil {
		fmt.Println("Database Connection Error:", err)
		os.Exit(1)
	}

	err = db.MigrateDB(dbCon, "./migrations")
	if err != nil {
		fmt.Println("Migration Error:", err)
		os.Exit(1)
	}
	fmt.Println("✅ Database connected and migrated successfully")

	// middlewares and repositories
	middleware := middlewares.NewMiddleware(cnf)
	userRepo := repo.NewUserRepo(dbCon)
	adminRepo := repo.NewAdminRepo(dbCon)
	postRepo := repo.NewPostRepo(dbCon)
	messageRepo := repo.NewMessageRepo(dbCon)
	socketManager := socket.GetManager()
	socketHandler := socket.NewHandler(cnf, socketManager)

	// handlers
	userHandler := userHandler.NewHandler(cnf, userRepo, middleware, dbCon)
	adminHandler := adminHandler.NewHandler(cnf, adminRepo, userRepo, postRepo, middleware, dbCon)
	postHandler := postHandler.NewHandler(cnf, postRepo, middleware)
	messageHandler := messageHandler.NewHandler(cnf, messageRepo, middleware, socketManager)

	server := rest.NewServer(
		cnf,
		userHandler,
		adminHandler,
		postHandler,
		messageHandler,
		socketHandler,
	)
	server.Start()
}
