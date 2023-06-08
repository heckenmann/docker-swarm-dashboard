package main

import (
	"context"
	"encoding/json"
	"github.com/docker/docker/api/types"
	"net/http"
	"sort"
)

type NodesHandlerSimpleNode struct {
	ID                string
	Hostname          string
	Leader            bool
	Role              string
	State             string
	Availability      string
	Reachability      string
	StatusAddr        string
	ManagerStatusAddr string
	Message           string
}

func nodesHandler(w http.ResponseWriter, _ *http.Request) {
	cli := getCli()
	nodes, _ := cli.NodeList(context.Background(), types.NodeListOptions{})

	resultList := make([]NodesHandlerSimpleNode, 0)

	// Find all Nodes
	for _, node := range nodes {
		simpleNode := NodesHandlerSimpleNode{
			ID:           node.ID,
			Hostname:     node.Description.Hostname,
			Role:         string(node.Spec.Role),
			State:        string(node.Status.State),
			Availability: string(node.Spec.Availability),
			StatusAddr:   node.Status.Addr,
			Message:      node.Status.Message,
		}
		if node.ManagerStatus != nil {
			simpleNode.Leader = node.ManagerStatus.Leader
			simpleNode.Reachability = string(node.ManagerStatus.Reachability)
			simpleNode.ManagerStatusAddr = node.ManagerStatus.Addr
		}
		resultList = append(resultList, simpleNode)
	}

	// Sort Stacks
	sort.SliceStable(resultList, func(i, j int) bool {
		return resultList[i].Hostname < resultList[j].Hostname
	})

	var resultJson, _ = json.Marshal(resultList)
	w.Write(resultJson)
}
