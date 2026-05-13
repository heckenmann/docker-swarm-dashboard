package main

import (
	"encoding/json"
	"log"
	"net/http"
	"sort"

	"github.com/docker/docker/api/types/swarm"
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

	resultList := make([]PortsHandlerSimplePort, 0)

	for _, service := range services {
		if len(service.Spec.EndpointSpec.Ports) > 0 {
			for _, port := range service.Spec.EndpointSpec.Ports {
				simplePort := PortsHandlerSimplePort{
					PublishedPort: port.PublishedPort,
					TargetPort:    port.TargetPort,
					Protocol:      string(port.Protocol),
					PublishMode:   string(port.PublishMode),
					ServiceName:   service.Spec.Name,
					ServiceID:     service.ID,
					Stack:         service.Spec.Labels["com.docker.stack.namespace"],
				}
				resultList = append(resultList, simplePort)
			}
		}
	}

	// Sort
	sort.SliceStable(resultList, func(i, j int) bool {
		return resultList[i].PublishedPort < resultList[j].PublishedPort
	})

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(resultList); err != nil {
		log.Printf("portsHandler: encoding response failed: %v", err)
	}
}
