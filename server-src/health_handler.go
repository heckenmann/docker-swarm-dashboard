package main

import (
	"context"
	"log"
	"net/http"
)

func healthHandler(w http.ResponseWriter, r *http.Request) {
	_, err := getCli().Info(context.Background())
	if err != nil {
		// Log the error for observability and return 503 so orchestrators know dependency is unavailable
		log.Printf("healthHandler: docker Info error: %v", err)
		http.Error(w, "Docker API error", http.StatusServiceUnavailable)
		return
	}
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte("OK"))
}
