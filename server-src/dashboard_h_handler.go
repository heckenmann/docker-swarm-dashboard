package main

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/docker/docker/api/types/swarm"
)

type DashboardH struct {
	Services []SimpleService
	Nodes    []NodeLine
}

type NodeLine struct {
	ID            string
	Name          string
	Hostname      string
	Role          string
	StatusMessage string
	StatusState   string
	Leader        bool
	Availability  string
	IP            string
	Tasks         map[string][]swarm.Task
}

type SimpleService struct {
	ID    string
	Name  string
	Stack string
}

// Serves the data model for the horizontal dashboard.
func dashboardHHandler(w http.ResponseWriter, r *http.Request) {
	result, err := queryDashboardH(r.Context())
	if err != nil {
		http.Error(w, "Failed to load dashboard: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(result); err != nil {
		log.Printf("dashboardHHandler: encoding response failed: %v", err)
	}
}
