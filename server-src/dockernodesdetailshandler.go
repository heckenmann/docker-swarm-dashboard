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
		jsonString, _ := json.Marshal(Services[0])
		w.Write(jsonString)
	} else {
		w.Write([]byte("{}"))
	}
}
