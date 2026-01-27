package main

import (
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	swarmtypes "github.com/docker/docker/api/types/swarm"
)

// TestDashboardVHandler verifies the vertical dashboard handler combines
// nodes, services and tasks into the expected UI payload.
func TestDashboardVHandler(t *testing.T) {
	nodes := []swarmtypes.Node{{ID: "n1", Description: swarmtypes.NodeDescription{Hostname: "vnode"}, Status: swarmtypes.NodeStatus{Addr: "10.0.0.2"}}}
	bNodes, _ := json.Marshal(nodes)
	services := []map[string]interface{}{{
		"ID":   "s1",
		"Spec": map[string]interface{}{"Name": "vsvc", "Labels": map[string]string{"com.docker.stack.namespace": "vstack"}},
	}}
	bServices, _ := json.Marshal(services)
	created := time.Now().Format(time.RFC3339)
	tasks := []map[string]interface{}{{
		"ID":        "t1",
		"ServiceID": "s1",
		"NodeID":    "n1",
		"CreatedAt": created,
		"Status":    map[string]interface{}{"Timestamp": created, "State": "running", "ContainerStatus": map[string]interface{}{"PID": 1}},
	}}
	bTasks, _ := json.Marshal(tasks)

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/v1.35/nodes":
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write(bNodes)
			return
		case "/v1.35/services":
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write(bServices)
			return
		case "/v1.35/tasks":
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write(bTasks)
			return
		default:
			http.NotFound(w, r)
		}
	}))
	defer server.Close()

	defer ResetCli()
	SetCli(makeClientForServer(t, server.URL))

	req := httptest.NewRequest(http.MethodGet, "/ui/dashboardv", nil)
	w := httptest.NewRecorder()
	dashboardVHandler(w, req)
	resp := w.Result()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200 got %d", resp.StatusCode)
	}
	body, _ := io.ReadAll(resp.Body)
	var out map[string]interface{}
	if err := json.Unmarshal(body, &out); err != nil {
		t.Fatalf("dashboardv response not valid json: %v", err)
	}
	// check presence
	if _, ok := out["Services"]; !ok {
		t.Fatalf("expected services in dashboardv response")
	}
}
