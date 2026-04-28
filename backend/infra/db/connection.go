package db

import (
	"errors"
	"fmt"
	"sync"

	"livesync-backend/config"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"
)

var (
	dbOnce          sync.Once
	database        *sqlx.DB
	databaseErr     error
	databaseConnStr string
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
	dbOnce.Do(func() {
		database, databaseErr = sqlx.Connect("pgx", connectionString)
		if databaseErr != nil {
			fmt.Println("DB Connection Error:", databaseErr)
			return
		}

		// Configure connection pool for stability and performance
		database.SetMaxOpenConns(25)
		database.SetMaxIdleConns(5)
		database.SetConnMaxLifetime(5 * 60)
		databaseConnStr = connectionString
		fmt.Println("✅ Successfully connected to PostgreSQL")
	})

	if databaseErr != nil {
		return nil, databaseErr
	}
	if database == nil {
		return nil, errors.New("database connection is not initialized")
	}
	return database, nil
}
