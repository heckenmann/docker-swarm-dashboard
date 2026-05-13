package main

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/docker/docker/api/types/swarm"
)

// Serves the services
func dockerServicesHandler(w http.ResponseWriter, r *http.Request) {
	cli, err := getCli()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	Services, err := cli.ServiceList(r.Context(), swarm.ServiceListOptions{})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(Services); err != nil {
		log.Printf("dockerServicesHandler: encoding response failed: %v", err)
	}
}
