package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestDockerTasksDetailsHandler_TaskListError(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v1.35/tasks" {
			w.WriteHeader(http.StatusInternalServerError)
			_, _ = w.Write([]byte(`{"message":"task list error"}`))
			return
		}
		http.NotFound(w, r)
	}))
	defer server.Close()

	defer ResetCli()
	SetCli(makeClientForServer(t, server.URL))

	req := httptest.NewRequest(http.MethodGet, "/docker/tasks/t1", nil)
	req = muxSetVars(req, map[string]string{"id": "t1"})
	w := httptest.NewRecorder()
	dockerTasksDetailsHandler(w, req)
	resp := w.Result()
	if resp.StatusCode != http.StatusInternalServerError {
		t.Fatalf("expected 500 got %d", resp.StatusCode)
	}
}

// TestDockerTasksDetailsHandler_Success verifies task details handler returns matching task.
func TestDockerTasksDetailsHandler_Success(t *testing.T) {
	tasks := []map[string]interface{}{{"ID": "t1", "ServiceID": "s1", "NodeID": "n1"}}
	nodes := []map[string]interface{}{{"ID": "n1", "Description": map[string]interface{}{"Hostname": "node1"}}}
	services := []map[string]interface{}{{"ID": "s1", "Spec": map[string]interface{}{"Name": "svc1"}}}
	bTasks, _ := json.Marshal(tasks)
	bNodes, _ := json.Marshal(nodes)
	bServices, _ := json.Marshal(services)
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/v1.35/tasks":
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write(bTasks)
		case "/v1.35/nodes":
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write(bNodes)
		case "/v1.35/services":
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write(bServices)
		default:
			http.NotFound(w, r)
		}
	}))
	defer server.Close()

	defer ResetCli()
	SetCli(makeClientForServer(t, server.URL))

	req := httptest.NewRequest(http.MethodGet, "/docker/tasks/t1", nil)
	req = muxSetVars(req, map[string]string{"id": "t1"})
	w := httptest.NewRecorder()
	dockerTasksDetailsHandler(w, req)
	resp := w.Result()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200 got %d", resp.StatusCode)
	}
	var any interface{}
	if err := json.NewDecoder(resp.Body).Decode(&any); err != nil {
		t.Fatalf("response not valid json: %v", err)
	}
}
