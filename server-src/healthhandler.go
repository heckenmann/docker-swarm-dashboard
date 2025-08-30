package main

import (
	"context"
	"net/http"
)

func healthHandler(w http.ResponseWriter, r *http.Request) {
	_, err := getCli().Info(context.Background())
	if err != nil {
		http.Error(w, "Docker API error", http.StatusServiceUnavailable)
		return
	}
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("OK"))
}
