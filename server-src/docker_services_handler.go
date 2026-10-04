package main

import (
	"encoding/json"
	"log"
	"net/http"
)

// Serves the services.
func dockerServicesHandler(w http.ResponseWriter, r *http.Request) {
	services, err := queryServices(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(services); err != nil {
		log.Printf("dockerServicesHandler: encoding response failed: %v", err)
	}
}
