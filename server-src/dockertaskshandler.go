package main

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/docker/docker/api/types"
)

// Serves the tasks
func dockerTasksHandler(w http.ResponseWriter, r *http.Request) {
	cli := getCli()
	Tasks, err := cli.TaskList(context.Background(), types.TaskListOptions{})
	if err != nil {
		panic(err)
	}
	jsonString, _ := json.Marshal(Tasks)
	w.Write(jsonString)
}
