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
		// Sort tasks by UpdatedAt descending if present
		if Tasks != nil {
			sort.Slice(Tasks, func(i, j int) bool {
				return Tasks[i].UpdatedAt.After(Tasks[j].UpdatedAt)
			})
		}

		// Enrich tasks with Service object when possible to match mock shape
		enriched := make([]map[string]interface{}, 0, len(Tasks))
		for _, t := range Tasks {
			var tm map[string]interface{}
			b, _ := json.Marshal(t)
			_ = json.Unmarshal(b, &tm)
			// try to fetch service object for this task
			servicesFilter := filters.NewArgs()
			servicesFilter.Add("id", t.ServiceID)
			svcList, _ := cli.ServiceList(context.Background(), types.ServiceListOptions{Filters: servicesFilter})
			if len(svcList) > 0 {
				tm["Service"] = svcList[0]
			} else {
				tm["Service"] = nil
			}
			enriched = append(enriched, tm)
		}

		// Return same shape as mock server: { node, tasks }
		resp := map[string]interface{}{
			"node":  Services[0],
			"tasks": enriched,
		}
		jsonString, _ := json.Marshal(resp)
		_, _ = w.Write(jsonString)
	} else {
		_, _ = w.Write([]byte("{}"))
	}
}
