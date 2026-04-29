package middleware

import (
	"context"
	"log"
	"net/http"
	"strings"
	"university-erp-backend/internal/utils"
)

type contextKey string

const ClaimsKey contextKey = "claims"

func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			utils.ErrorResponse(w, http.StatusUnauthorized, "Missing or invalid authorization header")
			return
		}

		tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
		claims, err := utils.ValidateToken(tokenStr)
		if err != nil {
			utils.ErrorResponse(w, http.StatusUnauthorized, "Invalid or expired token")
			return
		}

		ctx := context.WithValue(r.Context(), ClaimsKey, claims)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func RoleMiddleware(roles ...string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims, ok := r.Context().Value(ClaimsKey).(*utils.Claims)
			if !ok {
				utils.ErrorResponse(w, http.StatusUnauthorized, "Unauthorized")
				return
			}
			log.Printf("[RoleMiddleware] Path: %s | User Role: '%s' | Required: %v", r.URL.Path, claims.Role, roles)
			for _, role := range roles {
				if claims.Role == role {
					next.ServeHTTP(w, r)
					return
				}
			}
			log.Printf("[RoleMiddleware] Access DENIED for role '%s' on path %s", claims.Role, r.URL.Path)
			utils.ErrorResponse(w, http.StatusForbidden, "Access denied: insufficient permissions")
		})
	}
}

func GetClaims(r *http.Request) *utils.Claims {
	claims, _ := r.Context().Value(ClaimsKey).(*utils.Claims)
	return claims
}
