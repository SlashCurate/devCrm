package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"university-erp-backend/internal/config"
	"university-erp-backend/internal/platform/auth"
	"university-erp-backend/internal/platform/database"
	"university-erp-backend/internal/platform/eventbus"
	"university-erp-backend/internal/platform/middleware"
	"university-erp-backend/internal/platform/outbox"

	authmod "university-erp-backend/internal/modules/auth"
	studentmod "university-erp-backend/internal/modules/student"

	"github.com/gorilla/mux"
)

func main() {
	log.Println("🚀 Starting University ERP Backend Engine...")

	// 1. Load Configuration
	cfg := config.Load()

	// 2. Connect Database (AutoMigrates schemas)
	db := database.Connect(cfg)

	// 3. Setup Platform Components
	jwtMgr := auth.NewJWTManager(cfg)
	bus := eventbus.New()
	outboxWriter := outbox.NewWriter(db)
	outboxWorker := outbox.NewWorker(db, bus, cfg.OutboxPollInterval, cfg.OutboxBatchSize)

	// Start Outbox Worker (Background Process)
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	outboxWorker.Start(ctx)

	// 4. Initialize Modules (Repositories & Services)

	// Auth Module
	authRepo := authmod.NewRepository(db)
	authSvc := authmod.NewService(authRepo, jwtMgr, bus, outboxWriter, db)
	authHandler := authmod.NewHandler(authSvc)

	// Student Module
	studentRepo := studentmod.NewRepository(db)
	studentSvc := studentmod.NewService(studentRepo, bus, outboxWriter, db)
	studentHandler := studentmod.NewHandler(studentSvc)

	// 5. Setup HTTP Router & Middleware
	r := mux.NewRouter()
	
	// Global Middleware
	r.Use(middleware.RequestLogger)
	r.Use(middleware.CORS([]string{"*"}))
	// Example: Only log audits for data mutations
	r.Use(middleware.AuditLog(db))

	// Auth Middleware
	authMW := middleware.Authenticate(jwtMgr)

	// 6. Register Routes
	authHandler.RegisterRoutes(r, authMW)
	studentHandler.RegisterRoutes(r, authMW)

	// Health Check
	r.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status": "ok", "service": "university-erp-core"}`))
	}).Methods("GET")

	// 7. Start Server
	srv := &http.Server{
		Addr:         ":" + cfg.ServerPort,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		log.Printf("🌐 Server listening on port %s in %s mode", cfg.ServerPort, cfg.AppEnv)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("❌ Listen error: %s\n", err)
		}
	}()

	// Graceful Shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("🛑 Shutting down server...")

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer shutdownCancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Fatalf("❌ Server forced to shutdown: %v", err)
	}

	log.Println("✅ Server exiting")
}
