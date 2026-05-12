package main

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/docker/docker/api/types/swarm"
)

// Serves the services
func dockerServicesHandler(w http.ResponseWriter, _ *http.Request) {
	cli, err := getCli()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	Services, err := cli.ServiceList(context.Background(), swarm.ServiceListOptions{})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	jsonString, _ := json.Marshal(Services)
	_, _ = w.Write(jsonString)
}
