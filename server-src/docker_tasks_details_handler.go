package main

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/docker/docker/api/types/filters"
	"github.com/docker/docker/api/types/swarm"
	"github.com/gorilla/mux"
)

// Serves single node
func dockerTasksDetailsHandler(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	paramTaskId := params["id"]
	cli := getCli()
	tasksFilter := filters.NewArgs()
	tasksFilter.Add("id", paramTaskId)
	Services, err := cli.TaskList(context.Background(), swarm.TaskListOptions{Filters: tasksFilter})
	if err != nil {
		panic(err)
	}
	if len(Services) == 1 {
		jsonString, _ := json.Marshal(Services[0])
		_, _ = w.Write(jsonString)
	} else {
		_, _ = w.Write([]byte("{}"))
	}
}
