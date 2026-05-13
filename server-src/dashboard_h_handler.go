package main

import (
	"encoding/json"
	"log"
	"net/http"
	"sort"

	"github.com/docker/docker/api/types/swarm"
)

type DashboardH struct {
	Services []SimpleService
	Nodes    []NodeLine
}

type NodeLine struct {
	ID            string
	Name          string
	Hostname      string
	Role          string
	StatusMessage string
	StatusState   string
	Leader        bool
	Availability  string
	IP            string
	Tasks         map[string][]swarm.Task
}

type SimpleService struct {
	ID    string
	Name  string
	Stack string
}

// Serves datamodel for horizontal dashboard.
func dashboardHHandler(w http.ResponseWriter, r *http.Request) {
	result := DashboardH{}
	cli, err := getCli()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	ctx := r.Context()

	services, err := cli.ServiceList(ctx, swarm.ServiceListOptions{})
	if err != nil {
		http.Error(w, "Failed to list services: "+err.Error(), http.StatusInternalServerError)
		return
	}

	nodes, err := cli.NodeList(ctx, swarm.NodeListOptions{})
	if err != nil {
		http.Error(w, "Failed to list nodes: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Fetch all tasks once to avoid N+1
	allTasks, err := cli.TaskList(ctx, swarm.TaskListOptions{})
	if err != nil {
		http.Error(w, "Failed to list tasks: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Group tasks by node
	nodeTasks := make(map[string][]swarm.Task)
	for _, t := range allTasks {
		nodeTasks[t.NodeID] = append(nodeTasks[t.NodeID], t)
	}

	for _, service := range services {
		result.Services = append(result.Services, SimpleService{
			ID:    service.ID,
			Name:  service.Spec.Name,
			Stack: service.Spec.Labels["com.docker.stack.namespace"],
		})
	}

	for _, node := range nodes {
		newNodeLine := NodeLine{
			ID:            node.ID,
			Name:          node.Spec.Name,
			Hostname:      node.Description.Hostname,
			Role:          string(node.Spec.Role),
			StatusMessage: node.Status.Message,
			StatusState:   string(node.Status.State),
			Leader:        node.ManagerStatus != nil && node.ManagerStatus.Leader,
			Availability:  string(node.Spec.Availability),
			IP:            node.Status.Addr,
			Tasks:         make(map[string][]swarm.Task),
		}

		tasksForCurrentNode := nodeTasks[node.ID]
		// Sort tasks by CreatedAt descending
		sort.SliceStable(tasksForCurrentNode, func(i, j int) bool {
			return tasksForCurrentNode[i].CreatedAt.After(tasksForCurrentNode[j].CreatedAt)
		})

		for _, task := range tasksForCurrentNode {
			newNodeLine.Tasks[task.ServiceID] = append(newNodeLine.Tasks[task.ServiceID], task)
		}
		result.Nodes = append(result.Nodes, newNodeLine)
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
		log.Printf("dashboardHHandler: encoding response failed: %v", err)
	}
}
