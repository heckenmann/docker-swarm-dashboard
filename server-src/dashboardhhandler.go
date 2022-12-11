package main

import (
	"context"
	"encoding/json"
	"github.com/docker/docker/api/types/swarm"
	"net/http"
	"sort"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/filters"
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
	ID   string
	Name string
}

// Serves datamodel for horizontal dashboard.
func dashboardHHandler(w http.ResponseWriter, r *http.Request) {
	result := DashboardH{}
	cli := getCli()
	services, _ := cli.ServiceList(context.Background(), types.ServiceListOptions{})
	//tasks, _ := cli.TaskList(context.Background(), types.TaskListOptions{})
	nodes, _ := cli.NodeList(context.Background(), types.NodeListOptions{})

	// Table Header
	//result.Headlines = append(result.Headlines, "Services", "Role", "State", "Availability", "IP")
	for _, service := range services {
		result.Services = append(result.Services, SimpleService{ID: service.ID, Name: service.Spec.Name})
	}

	for _, node := range nodes {
		newNodeLine := NodeLine{}
		newNodeLine.ID = node.ID
		newNodeLine.Name = node.Spec.Name
		newNodeLine.Hostname = node.Description.Hostname
		newNodeLine.Role = string(node.Spec.Role)
		newNodeLine.StatusMessage = node.Status.Message
		newNodeLine.StatusState = string(node.Status.State)
		newNodeLine.Leader = node.ManagerStatus.Leader
		newNodeLine.Availability = string(node.Spec.Availability)
		newNodeLine.IP = node.Status.Addr
		newNodeLine.Tasks = make(map[string][]swarm.Task)
		tasksFilters := filters.NewArgs()
		tasksFilters.Add("node", node.ID)
		tasksForCurrentNode, _ := cli.TaskList(context.Background(), types.TaskListOptions{Filters: tasksFilters})
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

	var resultJson, _ = json.Marshal(result)
	w.Write(resultJson)
}
