package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	swarmtypes "github.com/docker/docker/api/types/swarm"
)

// TestNodesHandler verifies the UI nodes handler returns node hostnames
// from the Docker API.
func TestNodesHandler(t *testing.T) {
	nodes := []swarmtypes.Node{{ID: "n1", Description: swarmtypes.NodeDescription{Hostname: "node1"}, Status: swarmtypes.NodeStatus{Addr: "10.0.0.5"}}}
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

	req := httptest.NewRequest(http.MethodGet, "/ui/nodes", nil)
	w := httptest.NewRecorder()
	nodesHandler(w, req)
	resp := w.Result()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200 got %d", resp.StatusCode)
	}
	var out []map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if len(out) == 0 {
		t.Fatalf("expected at least one node in response")
	}
	if hn, ok := out[0]["Hostname"].(string); !ok || hn != "node1" {
		t.Fatalf("expected Hostname node1, got %v", out[0]["Hostname"])
	}
}

// TestNodesHandler_ManagerStatus verifies that manager status fields are included when present.
func TestNodesHandler_ManagerStatus(t *testing.T) {
	node := struct {
		ID          string `json:"ID"`
		Description struct {
			Hostname string `json:"Hostname"`
		} `json:"Description"`
		Status struct {
			Addr    string `json:"Addr"`
			Message string `json:"Message"`
			State   string `json:"State"`
		} `json:"Status"`
		Spec struct {
			Role         string `json:"Role"`
			Availability string `json:"Availability"`
		} `json:"Spec"`
		ManagerStatus *struct {
			Leader       bool   `json:"Leader"`
			Reachability string `json:"Reachability"`
			Addr         string `json:"Addr"`
		} `json:"ManagerStatus"`
	}{}
	node.ID = "m1"
	node.Description.Hostname = "mgr1"
	node.Status.Addr = "10.0.0.9"
	node.Status.Message = "ok"
	node.Status.State = "ready"
	node.Spec.Role = "manager"
	node.Spec.Availability = "active"
	node.ManagerStatus = &struct {
		Leader       bool   `json:"Leader"`
		Reachability string `json:"Reachability"`
		Addr         string `json:"Addr"`
	}{Leader: true, Reachability: "reach", Addr: "10.0.0.9"}

	b, _ := json.Marshal([]interface{}{node})
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

	req := httptest.NewRequest(http.MethodGet, "/ui/nodes", nil)
	w := httptest.NewRecorder()
	nodesHandler(w, req)
	resp := w.Result()
	var out []map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&out)
	if len(out) == 0 {
		t.Fatalf("expected nodes in response")
	}
	if out[0]["Leader"] != true {
		t.Fatalf("expected Leader true, got %v", out[0]["Leader"])
	}
}
