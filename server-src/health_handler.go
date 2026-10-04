package main

import (
	"context"
	"log"
	"net/http"
)

func queryHealth(ctx context.Context) error {
	cli, err := getCli()
	if err != nil {
		return err
	}
	_, err = cli.Info(ctx)
	return err
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	if err := queryHealth(r.Context()); err != nil {
		log.Printf("healthHandler: Docker API error: %v", err)
		http.Error(w, "Docker API error", http.StatusServiceUnavailable)
		return
	}
	w.WriteHeader(http.StatusOK)
	if _, err := w.Write([]byte("OK")); err != nil {
		log.Printf("healthHandler: writing response failed: %v", err)
	}
}
