package main

import (
	"encoding/json"
	"log"
	"net/http"
	"sort"

	"github.com/docker/docker/api/types/swarm"
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
func dashboardVHandler(w http.ResponseWriter, r *http.Request) {
	result := DashboardV{}
	cli, err := getCli()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	ctx := r.Context()

	nodes, err := cli.NodeList(ctx, swarm.NodeListOptions{})
	if err != nil {
		http.Error(w, "Failed to list nodes: "+err.Error(), http.StatusInternalServerError)
		return
	}

	services, err := cli.ServiceList(ctx, swarm.ServiceListOptions{})
	if err != nil {
		http.Error(w, "Failed to list services: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Fetch all tasks once to avoid N+1
	allTasks, err := cli.TaskList(ctx, swarm.TaskListOptions{})
	if err != nil {
		http.Error(w, "Failed to list tasks: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Group tasks by service and node
	serviceNodeTasks := make(map[string]map[string][]swarm.Task)
	for _, t := range allTasks {
		if serviceNodeTasks[t.ServiceID] == nil {
			serviceNodeTasks[t.ServiceID] = make(map[string][]swarm.Task)
		}
		serviceNodeTasks[t.ServiceID][t.NodeID] = append(serviceNodeTasks[t.ServiceID][t.NodeID], t)
	}

	// Table Header
	for _, node := range nodes {
		result.Nodes = append(result.Nodes, SimpleNode{
			ID:       node.ID,
			Hostname: node.Description.Hostname,
			IP:       node.Status.Addr})
	}

	for _, service := range services {
		newServiceLine := ServiceLine{
			ID:          service.ID,
			Name:        service.Spec.Name,
			Stack:       service.Spec.Labels["com.docker.stack.namespace"],
			Replication: extractReplicationFromService(service),
			Tasks:       make(map[string][]swarm.Task),
		}

		// Get grouped tasks for this service
		nodeMap := serviceNodeTasks[service.ID]
		for nodeID, tasks := range nodeMap {
			// Sort tasks by CreatedAt descending
			sort.SliceStable(tasks, func(i, j int) bool {
				return tasks[i].CreatedAt.After(tasks[j].CreatedAt)
			})
			newServiceLine.Tasks[nodeID] = tasks
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

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(result); err != nil {
		log.Printf("dashboardVHandler: encoding response failed: %v", err)
	}
}
