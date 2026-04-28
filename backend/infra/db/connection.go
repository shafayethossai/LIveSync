package db

import (
	"fmt"

	"livesync-backend/config"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"
)

func getConnectionString(cnf *config.DBConfig) string {
	connStr := fmt.Sprintf("user=%s password=%s host=%s port=%d dbname=%s",
		cnf.User,
		cnf.Password,
		cnf.Host,
		cnf.Port,
		cnf.DBName,
	)

	if !cnf.EnableSSLMode {
		connStr += " sslmode=disable"
	}

	return connStr
}

func NewConnection(connectionString string) (*sqlx.DB, error) {
	dbCon, err := sqlx.Connect("pgx", connectionString)
	if err != nil {
		fmt.Println("DB Connection Error:", err)
		return nil, err
	}

	// Configure connection pool for stability and performance
	dbCon.SetMaxOpenConns(25)        // Max concurrent connections
	dbCon.SetMaxIdleConns(5)         // Keep 5 idle connections ready
	dbCon.SetConnMaxLifetime(5 * 60) // 5 minute connection lifetime

	fmt.Println("✅ Successfully connected to PostgreSQL")
	return dbCon, nil
}
