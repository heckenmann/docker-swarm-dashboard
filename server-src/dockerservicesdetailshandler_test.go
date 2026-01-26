package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	swarmtypes "github.com/docker/docker/api/types/swarm"
)

// TestDockerServicesDetailsHandler_Success verifies the details handler
// returns the matching service object when present.
func TestDockerServicesDetailsHandler_Success(t *testing.T) {
	services := []swarmtypes.Service{{ID: "s1", Spec: swarmtypes.ServiceSpec{Annotations: swarmtypes.Annotations{Name: "svc1"}}}}
	b, _ := json.Marshal(services)
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v1.35/services" {
			w.WriteHeader(http.StatusOK)
			w.Write(b)
			return
		}
		http.NotFound(w, r)
	}))
	defer server.Close()

	defer ResetCli()
	SetCli(makeClientForServer(t, server.URL))

	req := httptest.NewRequest(http.MethodGet, "/docker/services/s1", nil)
	req = muxSetVars(req, map[string]string{"id": "s1"})
	w := httptest.NewRecorder()
	dockerServicesDetailsHandler(w, req)
	resp := w.Result()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200 got %d", resp.StatusCode)
	}
	var out map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&out)
	svcObj, ok := out["service"].(map[string]interface{})
	if !ok {
		t.Fatalf("expected service object, got %v", out["service"])
	}
	if id, ok := svcObj["ID"].(string); !ok || id != "s1" {
		t.Fatalf("expected ID s1, got %v", svcObj["ID"])
	}
}
