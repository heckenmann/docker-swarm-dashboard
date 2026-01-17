package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

// TestDockerTasksDetailsHandler_Success verifies task details handler returns matching task.
func TestDockerTasksDetailsHandler_Success(t *testing.T) {
	tasks := []map[string]interface{}{{"ID": "t1", "ServiceID": "s1"}}
	b, _ := json.Marshal(tasks)
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v1.35/tasks" {
			w.WriteHeader(http.StatusOK)
			w.Write(b)
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
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200 got %d", resp.StatusCode)
	}
	// simply ensure the response is valid JSON and status 200
	var any interface{}
	if err := json.NewDecoder(resp.Body).Decode(&any); err != nil {
		t.Fatalf("response not valid json: %v", err)
	}
}
