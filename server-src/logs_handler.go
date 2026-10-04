package main

import (
	"encoding/json"
	"log"
	"net/http"
)

type LogsHandlerSimpleService struct {
	ID   string
	Name string
}

func logsServicesHandler(w http.ResponseWriter, r *http.Request) {
	result, err := queryLogServices(r.Context())
	if err != nil {
		http.Error(w, "Failed to list services: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(result); err != nil {
		log.Printf("logsServicesHandler: encoding response failed: %v", err)
	}
}
