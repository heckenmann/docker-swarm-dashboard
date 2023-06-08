package main

import (
	"context"
	"encoding/json"
	"github.com/docker/docker/api/types"
	"net/http"
	"sort"
	"strings"
)

type StackSimpleService struct {
	ID          string
	ServiceName string
	ShortName   string
	Replication string
	Created     string
	Updated     string
}
type StacksHandlerSimpleStack struct {
	Name     string
	Services []StackSimpleService
}

func stacksHandler(w http.ResponseWriter, _ *http.Request) {
	cli := getCli()
	services, _ := cli.ServiceList(context.Background(), types.ServiceListOptions{})

	resultMap := make(map[string]StacksHandlerSimpleStack, 0)

	// Find all Stacks
	for _, service := range services {
		stackname := service.Spec.Labels["com.docker.stack.namespace"]
		if len(stackname) < 1 {
			stackname = "(without stack)"
		}
		currentStack, exists := resultMap[stackname]
		if !exists {
			currentStack = StacksHandlerSimpleStack{Name: stackname}
		}

		simpleService := StackSimpleService{
			ID:          service.ID,
			ServiceName: service.Spec.Name,
			Replication: extractReplicationFromService(service),
			Created:     service.CreatedAt.String(),
			Updated:     service.UpdatedAt.String(),
		}
		if strings.HasPrefix(service.Spec.Name, stackname) {
			simpleService.ShortName = strings.Replace(service.Spec.Name, stackname+"_", "", 1)
		}
		currentStack.Services = append(currentStack.Services, simpleService)
		resultMap[stackname] = currentStack
	}

	resultList := make([]StacksHandlerSimpleStack, 0)
	for _, stack := range resultMap {
		resultList = append(resultList, stack)

		// Sort Services
		sort.SliceStable(stack.Services, func(i, j int) bool {
			return stack.Services[i].ServiceName < stack.Services[j].ServiceName
		})
	}

	// Sort Stacks
	sort.SliceStable(resultList, func(i, j int) bool {
		return resultList[i].Name < resultList[j].Name
	})

	var resultJson, _ = json.Marshal(resultList)
	w.Write(resultJson)
}
