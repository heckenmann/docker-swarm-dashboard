package main

import (
	"context"
	"encoding/json"
	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/filters"
	"github.com/docker/docker/api/types/swarm"
	"net/http"
	"sort"
)

type DashboardV struct {
	Nodes    []SimpleNode
	Services []ServiceLine
}

type SimpleNode struct {
	ID       string
	Hostname string
	IP       string
}

type ServiceLine struct {
	ID          string
	Name        string
	Stack       string
	Replication string
	Tasks       map[string][]swarm.Task
}

// Serves datamodel for vertical dashboard.
func dashboardVHandler(w http.ResponseWriter, _ *http.Request) {
	result := DashboardV{}
	cli := getCli()
	nodes, _ := cli.NodeList(context.Background(), types.NodeListOptions{})
	services, _ := cli.ServiceList(context.Background(), types.ServiceListOptions{})

	// Table Header
	for _, node := range nodes {
		result.Nodes = append(result.Nodes, SimpleNode{
			ID:       node.ID,
			Hostname: node.Description.Hostname,
			IP:       node.Status.Addr})
	}

	for _, service := range services {
		newServiceLine := ServiceLine{}
		newServiceLine.ID = service.ID
		newServiceLine.Name = service.Spec.Name
		newServiceLine.Stack = service.Spec.Labels["com.docker.stack.namespace"]
		newServiceLine.Replication = extractReplicationFromService(service)
		newServiceLine.Tasks = make(map[string][]swarm.Task)
		tasksFilters := filters.NewArgs()

		tasksFilters.Add("service", service.ID)
		tasksForCurrentService, _ := cli.TaskList(context.Background(), types.TaskListOptions{Filters: tasksFilters})
		sort.SliceStable(tasksForCurrentService, func(i, j int) bool {
			return tasksForCurrentService[i].CreatedAt.After(tasksForCurrentService[j].CreatedAt)
		},
		)

		for _, task := range tasksForCurrentService {
			newServiceLine.Tasks[task.NodeID] = append(newServiceLine.Tasks[task.NodeID], task)
		}
		result.Services = append(result.Services, newServiceLine)
	}

	// Sort Nodes
	sort.SliceStable(result.Nodes, func(i, j int) bool {
		return result.Nodes[i].Hostname < result.Nodes[j].Hostname
	})

	// Sort Services
	sort.SliceStable(result.Services, func(i, j int) bool {
		return result.Services[i].Name < result.Services[j].Name
	})

	var resultJson, _ = json.Marshal(result)
	_ = w.Write(resultJson)
}
