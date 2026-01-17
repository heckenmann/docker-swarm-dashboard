package main

import (
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	swarmtypes "github.com/docker/docker/api/types/swarm"
)

// TestDockerNodesDetailsHandler_NoMatch verifies the nodes details handler
// returns an empty object when the Docker API returns no node matching id.
func TestDockerNodesDetailsHandler_NoMatch(t *testing.T) {
	// return empty list
	b, _ := json.Marshal([]swarmtypes.Node{})
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

	req := httptest.NewRequest(http.MethodGet, "/docker/nodes/doesnotexist", nil)
	// set mux vars so handler can read id
	req = muxSetVars(req, map[string]string{"id": "doesnotexist"})
	w := httptest.NewRecorder()
	dockerNodesDetailsHandler(w, req)
	resp := w.Result()
	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200 got %d", resp.StatusCode)
	}
	if string(body) != "{}" {
		t.Fatalf("expected empty object, got %s", string(body))
	}
}

// TestDockerNodesDetailsHandler_Success verifies the nodes details handler
// returns the node JSON when the Docker API contains the requested id.
func TestDockerNodesDetailsHandler_Success(t *testing.T) {
	nodes := []swarmtypes.Node{{ID: "n1", Description: swarmtypes.NodeDescription{Hostname: "node1"}, Status: swarmtypes.NodeStatus{Addr: "10.0.0.1"}}}
	bNodes, _ := json.Marshal(nodes)
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v1.35/nodes" {
			w.WriteHeader(http.StatusOK)
			w.Write(bNodes)
			return
		}
		http.NotFound(w, r)
	}))
	defer server.Close()

	defer ResetCli()
	SetCli(makeClientForServer(t, server.URL))

	req := httptest.NewRequest(http.MethodGet, "/docker/nodes/n1", nil)
	req = muxSetVars(req, map[string]string{"id": "n1"})
	w := httptest.NewRecorder()
	dockerNodesDetailsHandler(w, req)
	resp := w.Result()
	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200 got %d", resp.StatusCode)
	}
	var out map[string]interface{}
	if err := json.Unmarshal(body, &out); err != nil {
		t.Fatalf("response not valid json: %v", err)
	}
	if id, ok := out["ID"].(string); !ok || id != "n1" {
		t.Fatalf("expected returned node to have ID 'n1', got %v", out["ID"])
	}
}
