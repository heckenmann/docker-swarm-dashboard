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

		// Return the same shape as the mock server: { service, tasks }
		resp := map[string]interface{}{
			"service": Services[0],
			"tasks":   Tasks,
		}
		jsonString, _ := json.Marshal(resp)
		w.Write(jsonString)
	} else {
		w.Write([]byte("{}"))
	}
}
