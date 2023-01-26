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

func nodesHandler(w http.ResponseWriter, r *http.Request) {
	cli := getCli()
	nodes, _ := cli.NodeList(context.Background(), types.NodeListOptions{})

	resultList := make([]NodesHandlerSimpleNode, 0)

	// Find all Nodes
	for _, node := range nodes {
		simpleNode := NodesHandlerSimpleNode{
			ID:                node.ID,
			Hostname:          node.Description.Hostname,
			Leader:            node.ManagerStatus.Leader,
			Role:              string(node.Spec.Role),
			State:             string(node.Status.State),
			Availability:      string(node.Spec.Availability),
			Reachability:      string(node.ManagerStatus.Reachability),
			StatusAddr:        node.Status.Addr,
			ManagerStatusAddr: node.ManagerStatus.Addr,
			Message:           node.Status.Message,
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
