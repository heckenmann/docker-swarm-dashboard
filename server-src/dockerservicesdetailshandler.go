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

// Serves single service
func dockerServicesDetailsHandler(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	paramServiceId := params["id"]
	cli := getCli()
	servicesFilter := filters.NewArgs()
	servicesFilter.Add("id", paramServiceId)
	Services, err := cli.ServiceList(context.Background(), types.ServiceListOptions{Filters: servicesFilter})
	if err != nil {
		panic(err)
	}
	if len(Services) == 1 {
		// Get tasks for this service
		tasksFilter := filters.NewArgs()
		tasksFilter.Add("service", paramServiceId)
		Tasks, err := cli.TaskList(context.Background(), types.TaskListOptions{Filters: tasksFilter})
		if err != nil {
			// If task list fails in the mock environment, return service without tasks
			Tasks = nil
		}
		// Sort tasks by UpdatedAt descending if present
		if Tasks != nil {
			sort.Slice(Tasks, func(i, j int) bool {
				return Tasks[i].UpdatedAt.After(Tasks[j].UpdatedAt)
			})
		}

		// Attach Node object to each task when possible to match mock shape
		enriched := make([]map[string]interface{}, 0, len(Tasks))
		for _, t := range Tasks {
			// convert task to a generic map first
			var tm map[string]interface{}
			b, _ := json.Marshal(t)
			json.Unmarshal(b, &tm)
			// try to fetch node object for this task
			nodesFilter := filters.NewArgs()
			nodesFilter.Add("id", t.NodeID)
			nodeList, _ := cli.NodeList(context.Background(), types.NodeListOptions{Filters: nodesFilter})
			if len(nodeList) > 0 {
				// attach full node object
				tm["Node"] = nodeList[0]
			} else {
				tm["Node"] = nil
			}
			enriched = append(enriched, tm)
		}

		// Return the same shape as the mock server: { service, tasks }
		resp := map[string]interface{}{
			"service": Services[0],
			"tasks":   enriched,
		}
		jsonString, _ := json.Marshal(resp)
		w.Write(jsonString)
	} else {
		w.Write([]byte("{}"))
	}
}
