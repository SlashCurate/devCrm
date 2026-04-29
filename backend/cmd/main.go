package main

import (
	"log"
	"net/http"
	"os"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"

	"university-erp-backend/internal/db"
	"university-erp-backend/internal/routes"
)

func main() {
	// Load .env
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: .env file not found, using system env")
	}

	// Connect DB (schema, tables, and data are managed by cmd/seed/main.go)
	if err := db.Connect(); err != nil {
		log.Fatalf("❌ Failed to connect to DB: %v", err)
	}

	// Note: Run 'go run cmd/seed/main.go' first to create schema, tables, and seed data

	// Setup Router
	r := mux.NewRouter()
	routes.SetupRoutes(r)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("🚀 University ERP Backend running on :%s", port)
	log.Println("📚 API Base: http://localhost:" + port + "/api/v1")
	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatalf("❌ Server failed: %v", err)
	}
}
