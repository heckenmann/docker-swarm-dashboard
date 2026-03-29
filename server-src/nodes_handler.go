package main

import (
	"context"
	"encoding/json"
	"net/http"
	"sort"

	"github.com/docker/docker/api/types/swarm"
)

// NodesHandlerSimpleNode represents a simplified node structure for the nodes handler response.
type NodesHandlerSimpleNode struct {
	// ID is the unique identifier of the node
	ID string
	// Hostname is the hostname of the node
	Hostname string
	// Leader indicates if the node is a leader manager node
	Leader bool
	// Role is the role of the node (manager or worker)
	Role string
	// State is the current state of the node
	State string
	// Availability is the availability of the node (active, pause, drain)
	Availability string
	// Reachability is the reachability status of manager nodes
	Reachability string
	// StatusAddr is the address of the node
	StatusAddr string
	// ManagerStatusAddr is the address of the manager status endpoint
	ManagerStatusAddr string
	// Message contains any status message associated with the node
	Message string
}

func nodesHandler(w http.ResponseWriter, _ *http.Request) {
	cli := getCli()
	nodes, _ := cli.NodeList(context.Background(), swarm.NodeListOptions{})

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
	_, _ = w.Write(resultJson)
}
