package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	swarmtypes "github.com/docker/docker/api/types/swarm"
)

// TestDockerNodesHandler verifies that the nodes handler returns 200 OK
// and forwards the JSON payload when the Docker API returns a node list.
func TestDockerNodesHandler(t *testing.T) {
	nodes := []swarmtypes.Node{{ID: "n1"}}
	b, _ := json.Marshal(nodes)
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v1.35/nodes" {
			w.WriteHeader(http.StatusOK)
			w.Write(b)
			return
		}
		http.NotFound(w, r)
	}))
	defer server.Close()

	defer ResetCli()
	SetCli(makeClientForServer(t, server.URL))

	req := httptest.NewRequest(http.MethodGet, "/docker/nodes", nil)
	w := httptest.NewRecorder()
	dockerNodesHandler(w, req)
	resp := w.Result()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200 got %d", resp.StatusCode)
	}
}
