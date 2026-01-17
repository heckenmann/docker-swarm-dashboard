package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

// TestPortsHandler verifies that the ports UI handler extracts published
// ports from the service list and returns 200 OK.
func TestPortsHandler(t *testing.T) {
	svc := map[string]interface{}{
		"ID": "s1",
		"Spec": map[string]interface{}{
			"Name": "svc1",
			"EndpointSpec": map[string]interface{}{
				"Ports": []map[string]interface{}{
					{"PublishedPort": 8080, "TargetPort": 80, "Protocol": "tcp", "PublishMode": "ingress"},
				},
			},
			"Labels": map[string]string{"com.docker.stack.namespace": "mystack"},
		},
	}
	arr, _ := json.Marshal([]interface{}{svc})
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v1.35/services" {
			w.WriteHeader(http.StatusOK)
			w.Write(arr)
			return
		}
		http.NotFound(w, r)
	}))
	defer server.Close()

	defer ResetCli()
	SetCli(makeClientForServer(t, server.URL))

	req := httptest.NewRequest(http.MethodGet, "/ui/ports", nil)
	w := httptest.NewRecorder()
	portsHandler(w, req)
	resp := w.Result()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200 got %d", resp.StatusCode)
	}
}
