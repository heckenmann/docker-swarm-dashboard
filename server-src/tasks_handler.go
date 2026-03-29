package main

import (
	"context"
	"encoding/json"
	"net/http"
	"sort"
	"time"

	"github.com/docker/docker/api/types/filters"
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

func tasksHandler(w http.ResponseWriter, _ *http.Request) {
	cli := getCli()
	tasks, _ := cli.TaskList(context.Background(), swarm.TaskListOptions{})

	resultList := make([]TasksHandlerSimpleTask, 0)

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
		// Find Service for Task
		servicesFilter := filters.NewArgs()
		servicesFilter.Add("id", task.ServiceID)
		services, _ := cli.ServiceList(context.Background(), swarm.ServiceListOptions{Filters: servicesFilter})
		if len(services) > 0 {
			simpleTask.ServiceName = services[0].Spec.Name
			simpleTask.Stack = services[0].Spec.Labels["com.docker.stack.namespace"]
		}
		// Find Node for Task
		nodesFilter := filters.NewArgs()
		nodesFilter.Add("id", task.NodeID)
		node, _ := cli.NodeList(context.Background(), swarm.NodeListOptions{Filters: nodesFilter})
		if len(node) > 0 {
			simpleTask.NodeName = node[0].Description.Hostname
		}

		resultList = append(resultList, simpleTask)
	}

	// Sort
	sort.SliceStable(resultList, func(i, j int) bool {
		return resultList[i].Timestamp.After(resultList[j].Timestamp)
	})

	var resultJson, _ = json.Marshal(resultList)
	_, _ = w.Write(resultJson)
}
