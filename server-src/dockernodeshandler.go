package main

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/docker/docker/api/types"
)

// Serves the nodes
func dockerNodesHandler(w http.ResponseWriter, r *http.Request) {
	cli := getCli()
	Nodes, err := cli.NodeList(context.Background(), types.NodeListOptions{})
	if err != nil {
		panic(err)
	}
	jsonString, _ := json.Marshal(Nodes)
	w.Write(jsonString)
}
