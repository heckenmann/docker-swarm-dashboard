package main

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/docker/docker/api/types/filters"
	"github.com/docker/docker/api/types/swarm"
	"github.com/gorilla/mux"
)

// Serves single task
func dockerTasksDetailsHandler(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	paramTaskId := params["id"]
	cli := getCli()
	tasksFilter := filters.NewArgs()
	tasksFilter.Add("id", paramTaskId)
	Tasks, err := cli.TaskList(context.Background(), swarm.TaskListOptions{Filters: tasksFilter})
	if err != nil {
		panic(err)
	}
	if len(Tasks) == 1 {
		t := Tasks[0]
		// convert task to a generic map first
		var tm map[string]interface{}
		b, _ := json.Marshal(t)
		_ = json.Unmarshal(b, &tm)

		// try to fetch node object for this task
		nodesFilter := filters.NewArgs()
		nodesFilter.Add("id", t.NodeID)
		nodeList, _ := cli.NodeList(context.Background(), swarm.NodeListOptions{Filters: nodesFilter})
		if len(nodeList) > 0 {
			tm["NodeName"] = nodeList[0].Description.Hostname
			if tm["NodeName"] == "" {
				tm["NodeName"] = nodeList[0].ID
			}
		}

		// try to fetch service object for this task
		servicesFilter := filters.NewArgs()
		servicesFilter.Add("id", t.ServiceID)
		serviceList, _ := cli.ServiceList(context.Background(), swarm.ServiceListOptions{Filters: servicesFilter})
		if len(serviceList) > 0 {
			tm["ServiceName"] = serviceList[0].Spec.Name
		}

		jsonString, _ := json.Marshal(tm)
		_, _ = w.Write(jsonString)
	} else {
		_, _ = w.Write([]byte("{}"))
	}
}
