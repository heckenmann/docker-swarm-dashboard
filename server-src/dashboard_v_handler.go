package main

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/docker/docker/api/types/swarm"
)

type DashboardV struct {
	Nodes    []SimpleNode
	Services []ServiceLine
}

type SimpleNode struct {
	ID       string
	Hostname string
	IP       string
}

type ServiceLine struct {
	ID          string
	Name        string
	Stack       string
	Replication string
	Tasks       map[string][]swarm.Task
}

// Serves the data model for the vertical dashboard.
func dashboardVHandler(w http.ResponseWriter, r *http.Request) {
	result, err := queryDashboardV(r.Context())
	if err != nil {
		http.Error(w, "Failed to load dashboard: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(result); err != nil {
		log.Printf("dashboardVHandler: encoding response failed: %v", err)
	}
}
