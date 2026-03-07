package main

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/docker/docker/api/types/swarm"
)

// Serves the tasks
func dockerTasksHandler(w http.ResponseWriter, _ *http.Request) {
	cli := getCli()
	Tasks, err := cli.TaskList(context.Background(), swarm.TaskListOptions{})
	if err != nil {
		panic(err)
	}
	jsonString, _ := json.Marshal(Tasks)
	_, _ = w.Write(jsonString)
}
