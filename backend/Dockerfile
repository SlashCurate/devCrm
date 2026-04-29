# ---------- Build stage ----------
FROM golang:1.24-alpine AS builder

WORKDIR /app

# Install dependencies first (better caching)
COPY go.mod go.sum ./
RUN go mod download

# Copy full source
COPY . .

# Build Go binary (your entry is cmd/main.go)
RUN go build -o server ./cmd

# ---------- Runtime stage ----------
FROM alpine:latest

WORKDIR /app

# Copy compiled binary from builder
COPY --from=builder /app/server .

# Expose backend port
EXPOSE 8080

# Run server
CMD ["./server"]