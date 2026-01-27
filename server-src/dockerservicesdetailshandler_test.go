package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	swarmtypes "github.com/docker/docker/api/types/swarm"
)

// TestDockerServicesDetailsHandler_Success verifies the details handler
// returns the matching service object when present.
func TestDockerServicesDetailsHandler_Success(t *testing.T) {
	services := []swarmtypes.Service{{ID: "s1", Spec: swarmtypes.ServiceSpec{Annotations: swarmtypes.Annotations{Name: "svc1"}}}}
	bServices, _ := json.Marshal(services)

	// Create a task for service s1 running on node n1
	tasks := []swarmtypes.Task{{ID: "t1", ServiceID: "s1", NodeID: "n1"}}
	bTasks, _ := json.Marshal(tasks)

	// Create a node n1 with hostname node1
	nodes := []swarmtypes.Node{{ID: "n1", Description: swarmtypes.NodeDescription{Hostname: "node1"}}}
	bNodes, _ := json.Marshal(nodes)

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/v1.35/services":
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write(bServices)
			return
		case "/v1.35/tasks":
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write(bTasks)
			return
		case "/v1.35/nodes":
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write(bNodes)
			return
		default:
			http.NotFound(w, r)
			return
		}
	}))
	defer server.Close()

	defer ResetCli()
	SetCli(makeClientForServer(t, server.URL))

	req := httptest.NewRequest(http.MethodGet, "/docker/services/s1", nil)
	req = muxSetVars(req, map[string]string{"id": "s1"})
	w := httptest.NewRecorder()
	dockerServicesDetailsHandler(w, req)
	resp := w.Result()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200 got %d", resp.StatusCode)
	}
	var out map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	svcObj, ok := out["service"].(map[string]interface{})
	if !ok {
		t.Fatalf("expected service object, got %v", out["service"])
	}
	if id, ok := svcObj["ID"].(string); !ok || id != "s1" {
		t.Fatalf("expected ID s1, got %v", svcObj["ID"])
	}

	// verify tasks array contains Node object with ID and hostname
	tasksArr, ok := out["tasks"].([]interface{})
	if !ok || len(tasksArr) == 0 {
		t.Fatalf("expected tasks array, got %v", out["tasks"])
	}
	firstTask, ok := tasksArr[0].(map[string]interface{})
	if !ok {
		t.Fatalf("expected task object, got %v", tasksArr[0])
	}
	nodeObj, ok := firstTask["Node"].(map[string]interface{})
	if !ok {
		t.Fatalf("expected Node object attached to task, got %v", firstTask["Node"])
	}
	if nid, ok := nodeObj["ID"].(string); !ok || nid != "n1" {
		t.Fatalf("expected Node ID n1, got %v", nodeObj["ID"])
	}
	// Node Description.Hostname is nested; ensure it exists
	if desc, ok := nodeObj["Description"].(map[string]interface{}); !ok {
		t.Fatalf("expected Node Description object, got %v", nodeObj["Description"])
	} else {
		if hn, ok := desc["Hostname"].(string); !ok || hn != "node1" {
			t.Fatalf("expected Node Description.Hostname node1, got %v", desc["Hostname"])
		}
	}
}
