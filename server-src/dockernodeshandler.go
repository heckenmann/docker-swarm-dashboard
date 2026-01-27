package main

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/docker/docker/api/types/swarm"
)

// Serves the nodes
func dockerNodesHandler(w http.ResponseWriter, _ *http.Request) {
	cli := getCli()
	Nodes, err := cli.NodeList(context.Background(), swarm.NodeListOptions{})
	if err != nil {
		panic(err)
	}
	jsonString, _ := json.Marshal(Nodes)
	_, _ = w.Write(jsonString)
}
