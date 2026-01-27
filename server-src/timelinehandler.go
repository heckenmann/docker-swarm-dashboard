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

type TimelineHandlerSimpleTask struct {
	ID               string
	CreatedTimestamp time.Time
	StoppedTimestamp time.Time
	State            string
	DesiredState     string
	Slot             int
	ServiceName      string
	ServiceID        string
	Stack            string
}

func timelineHandler(w http.ResponseWriter, _ *http.Request) {
	cli := getCli()
	// timestamp for still running tasks
	var nowTimestamp = time.Now()
	tasks, _ := cli.TaskList(context.Background(), swarm.TaskListOptions{})

	resultList := make([]TimelineHandlerSimpleTask, 0)

	for _, task := range tasks {
		simpleTask := TimelineHandlerSimpleTask{
			ID:               task.ID,
			CreatedTimestamp: task.CreatedAt,
			State:            string(task.Status.State),
			DesiredState:     string(task.DesiredState),
			Slot:             task.Slot,
			//ServiceName:
			ServiceID: task.ServiceID,
		}

		// If container is stopped, set StoppedTimestamp
		if task.Status.State != swarm.TaskStateRunning || task.Status.ContainerStatus.PID == 0 {
			simpleTask.StoppedTimestamp = task.Status.Timestamp
		} else {
			// Else now
			simpleTask.StoppedTimestamp = nowTimestamp
		}

		// Find Service for Task
		servicesFilter := filters.NewArgs()
		servicesFilter.Add("id", task.ServiceID)
		services, _ := cli.ServiceList(context.Background(), swarm.ServiceListOptions{Filters: servicesFilter})
		if len(services) > 0 {
			simpleTask.ServiceName = services[0].Spec.Name
			simpleTask.Stack = services[0].Spec.Labels["com.docker.stack.namespace"]
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
	_, _ = w.Write(resultJson)
}
