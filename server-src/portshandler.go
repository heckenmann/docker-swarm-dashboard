package main

import (
	"context"
	"encoding/json"
	"net/http"
	"sort"

	"github.com/docker/docker/api/types"
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

func portsHandler(w http.ResponseWriter, _ *http.Request) {
	cli := getCli()
	services, _ := cli.ServiceList(context.Background(), types.ServiceListOptions{})

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

	var resultJson, _ = json.Marshal(resultList)
	_, _ = w.Write(resultJson)
}
