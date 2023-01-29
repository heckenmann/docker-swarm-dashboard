package main

import (
	"context"
	"encoding/json"
	"github.com/docker/docker/api/types"
	"net/http"
	"sort"
)

type LogsHandlerSimpleService struct {
	ID   string
	Name string
}

func logsServicesHandler(w http.ResponseWriter, r *http.Request) {
	cli := getCli()
	services, _ := cli.ServiceList(context.Background(), types.ServiceListOptions{})

	resultList := make([]LogsHandlerSimpleService, 0)

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

	var resultJson, _ = json.Marshal(resultList)
	w.Write(resultJson)
}
