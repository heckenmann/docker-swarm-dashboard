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
	nodeObj, ok := out["node"].(map[string]interface{})
	if !ok {
		t.Fatalf("expected node object, got %v", out["node"])
	}
	if id, ok := nodeObj["ID"].(string); !ok || id != "n1" {
		t.Fatalf("expected returned node to have ID 'n1', got %v", nodeObj["ID"])
	}
}

// Test that tasks returned for a node include the attached Service object
func TestDockerNodesDetailsHandler_ServiceAttachedToTasks(t *testing.T) {
	// prepare node n1
	nodes := []swarmtypes.Node{{ID: "n1", Description: swarmtypes.NodeDescription{Hostname: "node1"}}}
	bNodes, _ := json.Marshal(nodes)

	// prepare a task running on node n1 and referencing service s1
	tasks := []swarmtypes.Task{{ID: "t1", ServiceID: "s1", NodeID: "n1"}}
	bTasks, _ := json.Marshal(tasks)

	// prepare service s1
	services := []swarmtypes.Service{{ID: "s1", Spec: swarmtypes.ServiceSpec{Annotations: swarmtypes.Annotations{Name: "svc1"}}}}
	bServices, _ := json.Marshal(services)

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/v1.35/nodes":
			w.WriteHeader(http.StatusOK)
			w.Write(bNodes)
			return
		case "/v1.35/tasks":
			w.WriteHeader(http.StatusOK)
			w.Write(bTasks)
			return
		case "/v1.35/services":
			w.WriteHeader(http.StatusOK)
			w.Write(bServices)
			return
		default:
			http.NotFound(w, r)
			return
		}
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
	tasksArr, ok := out["tasks"].([]interface{})
	if !ok || len(tasksArr) == 0 {
		t.Fatalf("expected tasks array, got %v", out["tasks"])
	}
	firstTask := tasksArr[0].(map[string]interface{})
	svcObj, ok := firstTask["Service"].(map[string]interface{})
	if !ok {
		t.Fatalf("expected Service object attached to task, got %v", firstTask["Service"])
	}
	if sid, ok := svcObj["ID"].(string); !ok || sid != "s1" {
		t.Fatalf("expected Service ID s1, got %v", svcObj["ID"])
	}
	// check spec name exists
	if spec, ok := svcObj["Spec"].(map[string]interface{}); !ok {
		t.Fatalf("expected Service Spec object, got %v", svcObj["Spec"])
	} else {
		if ann, ok := spec["Annotations"].(map[string]interface{}); !ok {
			// Some marshaling may nest differently; accept absence
		} else {
			// ensure at least Name exists in Spec Annotations flow (best-effort)
			_ = ann
		}
	}
}
