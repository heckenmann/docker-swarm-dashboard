package main

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/docker/docker/api/types/swarm"
)

// Serves the tasks
func dockerTasksHandler(w http.ResponseWriter, _ *http.Request) {
	cli, err := getCli()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	Tasks, err := cli.TaskList(context.Background(), swarm.TaskListOptions{})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	jsonString, _ := json.Marshal(Tasks)
	_, _ = w.Write(jsonString)
}
