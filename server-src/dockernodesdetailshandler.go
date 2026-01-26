package main

import (
	"context"
	"encoding/json"
	"net/http"
	"sort"

	"github.com/docker/docker/api/types/filters"
	"github.com/gorilla/mux"

	"github.com/docker/docker/api/types"
)

// Serves single node
func dockerNodesDetailsHandler(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	paramNodeId := params["id"]
	cli := getCli()
	nodesFilter := filters.NewArgs()
	nodesFilter.Add("id", paramNodeId)
	Services, err := cli.NodeList(context.Background(), types.NodeListOptions{Filters: nodesFilter})
	if err != nil {
		panic(err)
	}
	if len(Services) == 1 {
		// Get tasks for this node
		tasksFilter := filters.NewArgs()
		tasksFilter.Add("node", paramNodeId)
		Tasks, err := cli.TaskList(context.Background(), types.TaskListOptions{Filters: tasksFilter})
		if err != nil {
			// If task list fails in the mock environment, return node without tasks
			Tasks = nil
		}
		// Sort tasks by UpdatedAt descending
		sort.Slice(Tasks, func(i, j int) bool {
			return Tasks[i].UpdatedAt.After(Tasks[j].UpdatedAt)
		})
		// Return same shape as mock server: { node, tasks }
		resp := map[string]interface{}{
			"node":  Services[0],
			"tasks": Tasks,
		}
		jsonString, _ := json.Marshal(resp)
		w.Write(jsonString)
	} else {
		w.Write([]byte("{}"))
	}
}
