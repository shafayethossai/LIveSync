package config

import (
	"fmt"
	"os"
	"strconv"

	"github.com/lpernett/godotenv"
)

type DBConfig struct {
	Host          string
	Port          int
	DBName        string
	User          string
	Password      string
	EnableSSLMode bool
}

type Config struct {
	Version            string
	ServiceName        string
	HttpPort           int
	SecretKey          string
	DB                 *DBConfig
	GoogleClientID     string
	GoogleClientSecret string
	GoogleRedirectURL  string
	ConnectionString   string
}

var configuration *Config

func loadConfig() {
	// Attempt to load .env file, but don't fail if it doesn't exist
	// In production (Render), environment variables are set directly
	err := godotenv.Load()
	if err != nil {
		// Only log if it's not a "file not found" error
		if _, ok := err.(*os.PathError); !ok {
			fmt.Println("Warning: Error loading .env file:", err)
		} else {
			fmt.Println("Info: .env file not found (OK for production, using environment variables)")
		}
	}

	// Load general config
	version := os.Getenv("VERSION")
	if version == "" {
		fmt.Println("Version is Required")
		os.Exit(1)
	}

	serviceName := os.Getenv("SERVICENAME")
	if serviceName == "" {
		fmt.Println("Service Name is Required")
		os.Exit(1)
	}

	httpPortStr := os.Getenv("HTTPPORT")
	if httpPortStr == "" {
		fmt.Println("HTTP Port is Required")
		os.Exit(1)
	}
	httpPort, err := strconv.Atoi(httpPortStr)
	if err != nil {
		fmt.Println("Failed to convert HTTPPORT to Int", err)
		os.Exit(1)
	}

	secretKey := os.Getenv("SECRETKEY")
	if secretKey == "" {
		fmt.Println("Secret Key is Required")
		os.Exit(1)
	}

	// Load Database config
	db_host := os.Getenv("DB_HOST")
	if db_host == "" {
		fmt.Println("Database Host is Required")
		os.Exit(1)
	}

	db_portStr := os.Getenv("DB_PORT")
	db_port, err := strconv.Atoi(db_portStr)
	if err != nil {
		fmt.Println("Failed to convert DB_PORT to Int", err)
		os.Exit(1)
	}

	db_name := os.Getenv("DB_NAME")
	if db_name == "" {
		fmt.Println("Database Name is Required")
		os.Exit(1)
	}

	db_user := os.Getenv("DB_USER")
	if db_user == "" {
		fmt.Println("Database User is Required")
		os.Exit(1)
	}

	db_password := os.Getenv("DB_PASSWORD")
	if db_password == "" {
		fmt.Println("Database Password is Required")
		os.Exit(1)
	}

	db_enable_ssl_mode_bool := os.Getenv("DB_ENABLE_SSL_MODE")
	db_enable_ssl_mode, err := strconv.ParseBool(db_enable_ssl_mode_bool)
	if err != nil {
		fmt.Println("Failed to convert DB_ENABLE_SSL_MODE to Bool", err)
		os.Exit(1)
	}

	db_config := &DBConfig{
		Host:          db_host,
		Port:          db_port,
		DBName:        db_name,
		User:          db_user,
		Password:      db_password,
		EnableSSLMode: db_enable_ssl_mode,
	}

	// Load Google OAuth config
	googleClientID := os.Getenv("GOOGLE_CLIENT_ID")
	if googleClientID == "" {
		fmt.Println("GOOGLE_CLIENT_ID is Required")
		os.Exit(1)
	}

	googleClientSecret := os.Getenv("GOOGLE_CLIENT_SECRET")
	if googleClientSecret == "" {
		fmt.Println("GOOGLE_CLIENT_SECRET is Required")
		os.Exit(1)
	}

	googleRedirectURL := os.Getenv("GOOGLE_REDIRECT_URL")
	if googleRedirectURL == "" {
		fmt.Println("GOOGLE_REDIRECT_URL is Required")
		os.Exit(1)
	}

	// forr database connection string
	ConnectionString := os.Getenv("DB_STRING")
	if ConnectionString == "" {
		fmt.Println("DB_STRING is Required")
		os.Exit(1)
	}

	configuration = &Config{
		Version:            version,
		ServiceName:        serviceName,
		HttpPort:           httpPort,
		SecretKey:          secretKey,
		DB:                 db_config,
		GoogleClientID:     googleClientID,
		GoogleClientSecret: googleClientSecret,
		GoogleRedirectURL:  googleRedirectURL,
		ConnectionString:   ConnectionString,
	}
}

func GetConfig() *Config {
	if configuration == nil {
		loadConfig()
	}
	return configuration
}
