package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	swarmtypes "github.com/docker/docker/api/types/swarm"
)

// TestTasksHandler verifies tasksHandler enriches tasks with service and node info.
func TestTasksHandler(t *testing.T) {
	created := time.Now().Format(time.RFC3339)
	// a simple task
	tasks := []map[string]interface{}{{
		"ID":        "t1",
		"ServiceID": "s1",
		"NodeID":    "n1",
		"Status":    map[string]interface{}{"Timestamp": created, "State": "running", "ContainerStatus": map[string]interface{}{"PID": 1}},
		"CreatedAt": created,
	}}
	bTasks, _ := json.Marshal(tasks)

	services := []swarmtypes.Service{{ID: "s1", Spec: swarmtypes.ServiceSpec{Annotations: swarmtypes.Annotations{Name: "svc1", Labels: map[string]string{"com.docker.stack.namespace": "mystack"}}}}}
	bServices, _ := json.Marshal(services)

	nodes := []swarmtypes.Node{{ID: "n1", Description: swarmtypes.NodeDescription{Hostname: "node1"}}}
	bNodes, _ := json.Marshal(nodes)

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/v1.35/tasks":
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write(bTasks)
			return
		case "/v1.35/services":
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write(bServices)
			return
		case "/v1.35/nodes":
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write(bNodes)
			return
		default:
			http.NotFound(w, r)
		}
	}))
	defer server.Close()

	defer ResetCli()
	SetCli(makeClientForServer(t, server.URL))

	req := httptest.NewRequest(http.MethodGet, "/ui/tasks", nil)
	w := httptest.NewRecorder()
	tasksHandler(w, req)
	resp := w.Result()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200 got %d", resp.StatusCode)
	}
	var out []map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if len(out) == 0 {
		t.Fatalf("expected tasks in response")
	}
	if sn, ok := out[0]["ServiceName"].(string); !ok || sn != "svc1" {
		t.Fatalf("expected ServiceName svc1, got %v", out[0]["ServiceName"])
	}
	if nn, ok := out[0]["NodeName"].(string); !ok || nn != "node1" {
		t.Fatalf("expected NodeName node1, got %v", out[0]["NodeName"])
	}
}
