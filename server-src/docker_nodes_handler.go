package main

import (
	"encoding/json"
	"log"
	"net/http"
)

// Serves the nodes.
func dockerNodesHandler(w http.ResponseWriter, r *http.Request) {
	nodes, err := queryNodes(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(nodes); err != nil {
		log.Printf("dockerNodesHandler: encoding response failed: %v", err)
	}
}
