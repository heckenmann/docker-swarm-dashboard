package main

import (
	"context"
	"encoding/json"
	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/filters"
	"net/http"
	"sort"
)

type TasksHandlerSimpleTask struct {
	ID           string
	Timestamp    string
	State        string
	DesiredState string
	ServiceName  string
	ServiceID    string
	NodeName     string
	NodeID       string
	Message      string
	Err          string
}

func tasksHandler(w http.ResponseWriter, _ *http.Request) {
	cli := getCli()
	tasks, _ := cli.TaskList(context.Background(), types.TaskListOptions{})

	resultList := make([]TasksHandlerSimpleTask, 0)

	for _, task := range tasks {
		simpleTask := TasksHandlerSimpleTask{
			ID:           task.ID,
			Timestamp:    task.Status.Timestamp.String(),
			State:        string(task.Status.State),
			DesiredState: string(task.DesiredState),
			//ServiceName:
			ServiceID: task.ServiceID,
			//NodeName:
			NodeID:  task.NodeID,
			Message: task.Status.Message,
			Err:     task.Status.Err,
		}
		// Find Service for Task
		servicesFilter := filters.NewArgs()
		servicesFilter.Add("id", task.ServiceID)
		services, _ := cli.ServiceList(context.Background(), types.ServiceListOptions{Filters: servicesFilter})
		if len(services) > 0 {
			simpleTask.ServiceName = services[0].Spec.Name
		}
		// Find Node for Task
		nodesFilter := filters.NewArgs()
		nodesFilter.Add("id", task.NodeID)
		node, _ := cli.NodeList(context.Background(), types.NodeListOptions{Filters: nodesFilter})
		if len(node) > 0 {
			simpleTask.NodeName = node[0].Description.Hostname
		}

		resultList = append(resultList, simpleTask)
	}

	// Sort
	sort.SliceStable(resultList, func(i, j int) bool {
		return resultList[i].Timestamp > resultList[j].Timestamp
	})

	var resultJson, _ = json.Marshal(resultList)
	w.Write(resultJson)
}
