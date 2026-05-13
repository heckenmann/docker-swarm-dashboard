package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	swarmtypes "github.com/docker/docker/api/types/swarm"
	dockclient "github.com/docker/docker/client"
)

func TestDockerServicesHandler_Returns500OnServiceListError(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v1.35/services" {
			w.WriteHeader(http.StatusInternalServerError)
			_, _ = w.Write([]byte(`{"message":"service list error"}`))
			return
		}
		http.NotFound(w, r)
	}))
	defer server.Close()

	defer ResetCli()
	SetCli(makeClientForServer(t, server.URL))

	req := httptest.NewRequest(http.MethodGet, "/docker/services", nil)
	w := httptest.NewRecorder()
	dockerServicesHandler(w, req)
	resp := w.Result()
	if resp.StatusCode != http.StatusInternalServerError {
		t.Fatalf("expected 500 got %d", resp.StatusCode)
	}
}

// TestDockerServicesHandler verifies that the services handler returns 200 OK
// when the Docker API returns a list of services.
func TestDockerServicesHandler(t *testing.T) {
	services := []swarmtypes.Service{{ID: "s1", Spec: swarmtypes.ServiceSpec{Annotations: swarmtypes.Annotations{Name: "svc1"}}}}
	b, _ := json.Marshal(services)

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v1.35/services" || r.URL.Path == "/v1.35/services/" {
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write(b)
			return
		}
		http.NotFound(w, r)
	}))
	defer server.Close()

	defer ResetCli()
	SetCli(makeClientForServer(t, server.URL))

	req := httptest.NewRequest(http.MethodGet, "/docker/services", nil)
	w := httptest.NewRecorder()
	dockerServicesHandler(w, req)
	resp := w.Result()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200 got %d", resp.StatusCode)
	}
}

// TestDockerServicesHandler_Returns500OnError verifies that the services handler
// returns a 500 Internal Server Error when the Docker API returns an error.
func TestDockerServicesHandler_Returns500OnError(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v1.35/services" {
			http.Error(w, "internal", http.StatusInternalServerError)
			return
		}
		http.NotFound(w, r)
	}))
	defer server.Close()

	defer ResetCli()
	c, err := dockclient.NewClientWithOpts(dockclient.WithHost(server.URL), dockclient.WithVersion("1.35"))
	if err != nil {
		t.Fatalf("create client: %v", err)
	}
	SetCli(c)

	req := httptest.NewRequest(http.MethodGet, "/docker/services", nil)
	w := httptest.NewRecorder()
	dockerServicesHandler(w, req)
	resp := w.Result()
	if resp.StatusCode != http.StatusInternalServerError {
		t.Fatalf("expected 500 got %d", resp.StatusCode)
	}
}
