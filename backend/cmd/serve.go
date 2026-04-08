package cmd

import (
	"fmt"
	"os"

	"livesync-backend/config"
	"livesync-backend/infra/db"
	"livesync-backend/repo"
	"livesync-backend/rest"
	adminHandler "livesync-backend/rest/handlers/admin"
	userHandler "livesync-backend/rest/handlers/user"
	"livesync-backend/rest/middlewares"
)

func Serve() {
	cnf := config.GetConfig()

	dbCon, err := db.NewConnection(cnf.DB)
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
	mw := middlewares.NewMiddleware(cnf)
	userRepo := repo.NewUserRepo(dbCon)
	adminRepo := repo.NewAdminRepo(dbCon)

	// handlers
	userHandlerInstance := userHandler.NewHandler(cnf, userRepo, mw)
	adminHandlerInstance := adminHandler.NewHandler(cnf, adminRepo, userRepo, mw, dbCon)

	server := rest.NewServer(
		cnf,
		userHandlerInstance,
		adminHandlerInstance,
	)
	server.Start()
}
