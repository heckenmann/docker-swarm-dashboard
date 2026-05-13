package main

import (
	"encoding/json"
	"log"
	"net/http"
	"sort"
	"time"

	"github.com/docker/docker/api/types/swarm"
)

// TasksHandlerSimpleTask represents a simplified task structure for the tasks handler response.
type TasksHandlerSimpleTask struct {
	// ID is the unique identifier of the task
	ID string
	// Timestamp is the timestamp of the task status
	Timestamp time.Time
	// State is the current state of the task
	State string
	// DesiredState is the desired state of the task
	DesiredState string
	// ServiceName is the name of the service the task belongs to
	ServiceName string
	// ServiceID is the unique identifier of the service the task belongs to
	ServiceID string
	// NodeName is the hostname of the node where the task is running
	NodeName string
	// NodeID is the unique identifier of the node where the task is running
	NodeID string
	// Message contains any status message associated with the task
	Message string
	// Err contains any error message associated with the task
	Err string
	// Stack is the name of the stack the service belongs to (if any)
	Stack string
	// Slot is the slot number of the task (for replicated services)
	Slot int
}

func tasksHandler(w http.ResponseWriter, r *http.Request) {
	cli, err := getCli()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	ctx := r.Context()

	// Fetch everything once to avoid N+1 queries
	tasks, err := cli.TaskList(ctx, swarm.TaskListOptions{})
	if err != nil {
		http.Error(w, "Failed to list tasks: "+err.Error(), http.StatusInternalServerError)
		return
	}

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

	// Create lookup maps
	svcMap := make(map[string]swarm.Service)
	for _, s := range services {
		svcMap[s.ID] = s
	}

	nodeMap := make(map[string]swarm.Node)
	for _, n := range nodes {
		nodeMap[n.ID] = n
	}

	resultList := make([]TasksHandlerSimpleTask, 0, len(tasks))

	for _, task := range tasks {
		simpleTask := TasksHandlerSimpleTask{
			ID:           task.ID,
			Timestamp:    task.Status.Timestamp,
			State:        string(task.Status.State),
			DesiredState: string(task.DesiredState),
			ServiceID:    task.ServiceID,
			NodeID:       task.NodeID,
			Message:      task.Status.Message,
			Err:          task.Status.Err,
			Slot:         task.Slot,
		}

		if svc, ok := svcMap[task.ServiceID]; ok {
			simpleTask.ServiceName = svc.Spec.Name
			simpleTask.Stack = svc.Spec.Labels["com.docker.stack.namespace"]
		}

		if node, ok := nodeMap[task.NodeID]; ok {
			simpleTask.NodeName = node.Description.Hostname
		}

		resultList = append(resultList, simpleTask)
	}

	// Sort
	sort.SliceStable(resultList, func(i, j int) bool {
		return resultList[i].Timestamp.After(resultList[j].Timestamp)
	})

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(resultList); err != nil {
		log.Printf("tasksHandler: encoding response failed: %v", err)
	}
}
