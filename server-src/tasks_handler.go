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

type TasksHandlerSimpleTask struct {
	ID           string
	Timestamp    time.Time
	State        string
	DesiredState string
	ServiceName  string
	ServiceID    string
	NodeName     string
	NodeID       string
	Message      string
	Err          string
	Stack        string
	Slot         int
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
			//ServiceName:
			ServiceID: task.ServiceID,
			//NodeName:
			NodeID:  task.NodeID,
			Message: task.Status.Message,
			Err:     task.Status.Err,
			Slot:    task.Slot,
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
