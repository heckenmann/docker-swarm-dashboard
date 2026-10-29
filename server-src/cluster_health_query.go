package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/docker/docker/api/types/swarm"
)

type clusterHealthWarning struct {
	Code    string   `json:"code"`
	Message string   `json:"message"`
	NodeIDs []string `json:"nodeIds"`
}

// clusterHealthNode contains only inventory fields needed by the health view.
type clusterHealthNode struct {
	ID            string `json:"id"`
	Hostname      string `json:"hostname"`
	EngineVersion string `json:"engineVersion"`
	OS            string `json:"os"`
	Architecture  string `json:"architecture"`
	Availability  string `json:"availability"`
}

type clusterHealth struct {
	Available         bool                   `json:"available"`
	ObservedAt        *time.Time             `json:"observedAt"`
	State             string                 `json:"state"`
	Managers          int                    `json:"managers"`
	Reachable         int                    `json:"reachable"`
	Unreachable       int                    `json:"unreachable"`
	Unknown           int                    `json:"unknown"`
	Majority          int                    `json:"majority"`
	RemainingFailures *int                   `json:"remainingFailures"`
	LeaderIDs         []string               `json:"leaderIds"`
	Warnings          []clusterHealthWarning `json:"warnings"`
	Message           string                 `json:"message,omitempty"`
	Nodes             []clusterHealthNode    `json:"nodes"`
}

// assessClusterHealth describes manager observations, not an independent Raft probe.
func assessClusterHealth(nodes []swarm.Node, observedAt time.Time) clusterHealth {
	result := clusterHealth{Available: true, ObservedAt: &observedAt, State: "observed", LeaderIDs: []string{}, Warnings: []clusterHealthWarning{}}
	result.Nodes = make([]clusterHealthNode, 0, len(nodes))
	managerIDs := []string{}
	unreachableIDs := []string{}
	unknownIDs := []string{}
	for _, node := range nodes {
		result.Nodes = append(result.Nodes, clusterHealthNode{
			ID:            node.ID,
			Hostname:      node.Description.Hostname,
			EngineVersion: node.Description.Engine.EngineVersion,
			OS:            node.Description.Platform.OS,
			Architecture:  node.Description.Platform.Architecture,
			Availability:  string(node.Spec.Availability),
		})
		if node.Spec.Role != swarm.NodeRoleManager {
			continue
		}
		result.Managers++
		managerIDs = append(managerIDs, node.ID)
		if node.ManagerStatus == nil {
			result.Unknown++
			unknownIDs = append(unknownIDs, node.ID)
			continue
		}
		if node.ManagerStatus.Leader {
			result.LeaderIDs = append(result.LeaderIDs, node.ID)
		}
		switch node.ManagerStatus.Reachability {
		case swarm.ReachabilityReachable:
			result.Reachable++
		case swarm.ReachabilityUnreachable:
			result.Unreachable++
			unreachableIDs = append(unreachableIDs, node.ID)
		default:
			result.Unknown++
			unknownIDs = append(unknownIDs, node.ID)
		}
	}
	result.Majority = result.Managers/2 + 1
	warn := func(code, message string, ids []string) {
		result.Warnings = append(result.Warnings, clusterHealthWarning{code, message, ids})
	}
	if result.Managers == 0 {
		warn("no_managers", "No configured managers were observed.", managerIDs)
	}
	if result.Managers == 1 {
		warn("single_manager", "A single manager provides no manager failure tolerance.", managerIDs)
	}
	if result.Managers > 0 && result.Managers%2 == 0 {
		warn("even_managers", "An even manager count requires a larger majority without improving failure tolerance over the preceding odd count.", managerIDs)
	}
	if result.Unreachable > 0 {
		warn("unreachable_managers", "Some managers are reported unreachable by Docker.", unreachableIDs)
	}
	if result.Unknown > 0 {
		warn("unknown_reachability", "Manager reachability is incomplete; the failure reserve is unknown.", unknownIDs)
	}
	if len(result.LeaderIDs) == 0 {
		warn("missing_leader", "No leader was reported in this observation.", managerIDs)
	}
	if len(result.LeaderIDs) > 1 {
		warn("multiple_leaders", "Multiple leaders were reported; the observation is inconsistent.", result.LeaderIDs)
	}
	if result.Reachable < result.Majority {
		warn("insufficient_reachable", "Fewer managers are observed reachable than the required majority. Cluster administration may be unavailable.", managerIDs)
	}
	if result.Managers > 0 && result.Unknown == 0 && len(result.LeaderIDs) == 1 {
		reserve := result.Reachable - result.Majority
		if reserve < 0 {
			reserve = 0
		}
		result.RemainingFailures = &reserve
	}
	if len(result.Warnings) > 0 {
		result.State = "warning"
	}
	return result
}

func queryClusterHealth(ctx context.Context) clusterHealth {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	nodes, err := queryNodes(ctx)
	if err != nil {
		return clusterHealth{State: "unavailable", Message: "Docker node information is unavailable.", LeaderIDs: []string{}, Warnings: []clusterHealthWarning{}, Nodes: []clusterHealthNode{}}
	}
	return assessClusterHealth(nodes, time.Now().UTC())
}

func clusterHealthHandler(w http.ResponseWriter, r *http.Request) {
	result := queryClusterHealth(r.Context())
	w.Header().Set("Content-Type", "application/json")
	if !result.Available {
		w.WriteHeader(http.StatusServiceUnavailable)
	}
	if err := json.NewEncoder(w).Encode(result); err != nil {
		log.Printf("clusterHealthHandler: encoding response failed: %v", err)
	}
}
