package main

import (
	"encoding/json"
	"log"
	"net/http"
	"sort"
	"time"

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

func timelineHandler(w http.ResponseWriter, r *http.Request) {
	cli, err := getCli()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	ctx := r.Context()

	// Fetch all tasks and services once to avoid N+1
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

	// Create service lookup map
	svcMap := make(map[string]swarm.Service)
	for _, s := range services {
		svcMap[s.ID] = s
	}

	// timestamp for still running tasks
	var nowTimestamp = time.Now()
	resultList := make([]TimelineHandlerSimpleTask, 0, len(tasks))

	for _, task := range tasks {
		simpleTask := TimelineHandlerSimpleTask{
			ID:               task.ID,
			CreatedTimestamp: task.CreatedAt,
			State:            string(task.Status.State),
			DesiredState:     string(task.DesiredState),
			Slot:             task.Slot,
			ServiceID:        task.ServiceID,
		}

		// If container is stopped, set StoppedTimestamp
		if task.Status.State != swarm.TaskStateRunning || task.Status.ContainerStatus.PID == 0 {
			simpleTask.StoppedTimestamp = task.Status.Timestamp
		} else {
			// Else now
			simpleTask.StoppedTimestamp = nowTimestamp
		}

		// Find Service for Task from map
		if svc, ok := svcMap[task.ServiceID]; ok {
			simpleTask.ServiceName = svc.Spec.Name
			simpleTask.Stack = svc.Spec.Labels["com.docker.stack.namespace"]
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

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(resultList); err != nil {
		log.Printf("timelineHandler: encoding response failed: %v", err)
	}
}
