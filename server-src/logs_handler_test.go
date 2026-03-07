package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

// TestLogsServicesHandler verifies that the logs services handler returns
// a 200 OK and forwards the list of services from the Docker API.
func TestLogsServicesHandler(t *testing.T) {
	svc := map[string]interface{}{"ID": "s1", "Spec": map[string]interface{}{"Name": "svc1"}}
	arr, _ := json.Marshal([]interface{}{svc})
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v1.35/services" {
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write(arr)
			return
		}
		http.NotFound(w, r)
	}))
	defer server.Close()

	defer ResetCli()
	SetCli(makeClientForServer(t, server.URL))

	req := httptest.NewRequest(http.MethodGet, "/ui/logs/services", nil)
	w := httptest.NewRecorder()
	logsServicesHandler(w, req)
	resp := w.Result()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200 got %d", resp.StatusCode)
	}
}
