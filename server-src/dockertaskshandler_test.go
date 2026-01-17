package main

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

// TestDockerTasksHandler verifies that the docker tasks handler returns 200
// and forwards the tasks list from the Docker API.
func TestDockerTasksHandler(t *testing.T) {
	b := []byte(`[{"ID":"t1"}]`)
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

	req := httptest.NewRequest(http.MethodGet, "/docker/tasks", nil)
	w := httptest.NewRecorder()
	dockerTasksHandler(w, req)
	resp := w.Result()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200 got %d", resp.StatusCode)
	}
}
