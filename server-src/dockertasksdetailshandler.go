package main

import (
	"context"
	"encoding/json"
	"github.com/docker/docker/api/types/filters"
	"github.com/gorilla/mux"
	"net/http"

	"github.com/docker/docker/api/types"
)

// Serves single node
func dockerTasksDetailsHandler(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	paramTaskId := params["id"]
	cli := getCli()
	tasksFilter := filters.NewArgs()
	tasksFilter.Add("id", paramTaskId)
	Services, err := cli.TaskList(context.Background(), types.TaskListOptions{Filters: tasksFilter})
	if err != nil {
		panic(err)
	}
	if len(Services) == 1 {
		jsonString, _ := json.Marshal(Services[0])
		w.Write(jsonString)
	} else {
		w.Write([]byte("{}"))
	}
}
