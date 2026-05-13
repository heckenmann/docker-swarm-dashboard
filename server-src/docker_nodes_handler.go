package main

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/docker/docker/api/types/swarm"
)

// Serves the nodes
func dockerNodesHandler(w http.ResponseWriter, r *http.Request) {
	cli, err := getCli()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	Nodes, err := cli.NodeList(r.Context(), swarm.NodeListOptions{})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(Nodes); err != nil {
		log.Printf("dockerNodesHandler: encoding response failed: %v", err)
	}
}
