package main

import (
	"encoding/json"
	"log"
	"net/http"
)

type PortsHandlerSimplePort struct {
	PublishedPort uint32
	TargetPort    uint32
	Protocol      string
	PublishMode   string
	ServiceName   string
	ServiceID     string
	Stack         string
}

func portsHandler(w http.ResponseWriter, r *http.Request) {
	result, err := queryPublishedPorts(r.Context())
	if err != nil {
		http.Error(w, "Failed to list services: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(result); err != nil {
		log.Printf("portsHandler: encoding response failed: %v", err)
	}
}
