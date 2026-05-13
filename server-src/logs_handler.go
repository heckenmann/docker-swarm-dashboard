package main

import (
	"encoding/json"
	"log"
	"net/http"
	"sort"

	"github.com/docker/docker/api/types/swarm"
)

type LogsHandlerSimpleService struct {
	ID   string
	Name string
}

func logsServicesHandler(w http.ResponseWriter, r *http.Request) {
	cli, err := getCli()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	services, err := cli.ServiceList(r.Context(), swarm.ServiceListOptions{})
	if err != nil {
		http.Error(w, "Failed to list services: "+err.Error(), http.StatusInternalServerError)
		return
	}

	resultList := make([]LogsHandlerSimpleService, 0, len(services))

	for _, service := range services {
		simpleTask := LogsHandlerSimpleService{
			ID:   service.ID,
			Name: service.Spec.Name,
		}
		resultList = append(resultList, simpleTask)
	}

	// Sort
	sort.SliceStable(resultList, func(i, j int) bool {
		return resultList[i].Name < resultList[j].Name
	})

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(resultList); err != nil {
		log.Printf("logsServicesHandler: encoding response failed: %v", err)
	}
}
