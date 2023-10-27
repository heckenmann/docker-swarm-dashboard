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

type TimelineHandlerSimpleTask struct {
	ID               string
	CreatedTimestamp string
	StoppedTimestamp string
	State            string
	DesiredState     string
	Slot             int
	ServiceName      string
	ServiceID        string
}

func timelineHandler(w http.ResponseWriter, _ *http.Request) {
	cli := getCli()
	tasks, _ := cli.TaskList(context.Background(), types.TaskListOptions{})

	resultList := make([]TimelineHandlerSimpleTask, 0)

	for _, task := range tasks {
		simpleTask := TimelineHandlerSimpleTask{
			ID:               task.ID,
			CreatedTimestamp: task.CreatedAt.String(),
			State:            string(task.Status.State),
			DesiredState:     string(task.DesiredState),
			Slot:             task.Slot,
			//ServiceName:
			ServiceID: task.ServiceID,
		}

		// If container is stopped, set StoppedTimestamp
		if task.Status.State != swarm.TaskStateRunning || task.Status.ContainerStatus.PID == 0 {
			simpleTask.StoppedTimestamp = task.Status.Timestamp.String()
		}

		// Find Service for Task
		servicesFilter := filters.NewArgs()
		servicesFilter.Add("id", task.ServiceID)
		services, _ := cli.ServiceList(context.Background(), types.ServiceListOptions{Filters: servicesFilter})
		if len(services) > 0 {
			simpleTask.ServiceName = services[0].Spec.Name
		}

		resultList = append(resultList, simpleTask)
	}

	// Sort
	sort.SliceStable(resultList, func(i, j int) bool {
		if resultList[i].ServiceName == resultList[j].ServiceName {
			return resultList[i].Slot < resultList[j].Slot
		} else {
			return resultList[i].ServiceName < resultList[j].ServiceName
		}
	})

	var resultJson, _ = json.Marshal(resultList)
	w.Write(resultJson)
}
