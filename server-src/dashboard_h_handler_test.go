package main

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	dockclient "github.com/docker/docker/client"
)

func TestDashboardHHandler_GetCliError(t *testing.T) {
	oldGetCli := getCli
	getCli = func() (*dockclient.Client, error) {
		return nil, errors.New("mock getCli error")
	}
	defer func() { getCli = oldGetCli }()

	req := httptest.NewRequest(http.MethodGet, "/ui/dashboardh", nil)
	w := httptest.NewRecorder()
	dashboardHHandler(w, req)
	resp := w.Result()
	if resp.StatusCode != http.StatusInternalServerError {
		t.Fatalf("expected 500 got %d", resp.StatusCode)
	}
}

func TestDashboardHHandler_ServiceListError(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v1.35/services" {
			w.WriteHeader(http.StatusInternalServerError)
			_, _ = w.Write([]byte(`{"message":"service list error"}`))
			return
		}
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`[]`))
	}))
	defer server.Close()

	defer ResetCli()
	SetCli(makeClientForServer(t, server.URL))

	req := httptest.NewRequest(http.MethodGet, "/ui/dashboardh", nil)
	w := httptest.NewRecorder()
	dashboardHHandler(w, req)
	resp := w.Result()
	if resp.StatusCode != http.StatusInternalServerError {
		t.Fatalf("expected 500 got %d", resp.StatusCode)
	}
}

func TestDashboardHHandler_NodeListError(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/v1.35/services":
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte(`[]`))
		case "/v1.35/nodes":
			w.WriteHeader(http.StatusInternalServerError)
			_, _ = w.Write([]byte(`{"message":"node list error"}`))
		default:
			http.NotFound(w, r)
		}
	}))
	defer server.Close()

	defer ResetCli()
	SetCli(makeClientForServer(t, server.URL))

	req := httptest.NewRequest(http.MethodGet, "/ui/dashboardh", nil)
	w := httptest.NewRecorder()
	dashboardHHandler(w, req)
	resp := w.Result()
	if resp.StatusCode != http.StatusInternalServerError {
		t.Fatalf("expected 500 got %d", resp.StatusCode)
	}
}

func TestDashboardHHandler_TaskListError(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/v1.35/nodes":
			nodes := []map[string]interface{}{{"ID": "n1", "Description": map[string]interface{}{"Hostname": "node1"}}}
			_ = json.NewEncoder(w).Encode(nodes)
		case "/v1.35/services":
			_ = json.NewEncoder(w).Encode([]interface{}{})
		case "/v1.35/tasks":
			w.WriteHeader(http.StatusInternalServerError)
			_, _ = w.Write([]byte(`{"message":"task list error"}`))
		}
	}))
	defer server.Close()

	defer ResetCli()
	SetCli(makeClientForServer(t, server.URL))

	req := httptest.NewRequest(http.MethodGet, "/ui/dashboardh", nil)
	w := httptest.NewRecorder()
	dashboardHHandler(w, req)
	resp := w.Result()
	if resp.StatusCode != http.StatusInternalServerError {
		t.Fatalf("expected 500 got %d", resp.StatusCode)
	}
}

func TestDashboardHHandler_Success(t *testing.T) {
	nodes := []map[string]interface{}{
		{"ID": "n1", "Spec": map[string]interface{}{"Role": "manager", "Availability": "active"}, "Description": map[string]interface{}{"Hostname": "node1"}, "Status": map[string]interface{}{"Addr": "10.0.0.1", "State": "ready", "Message": "ready"}},
	}
	services := []map[string]interface{}{
		{"ID": "s1", "Spec": map[string]interface{}{"Name": "svc1", "Labels": map[string]string{"com.docker.stack.namespace": "stack1"}}},
	}
	bNodes, _ := json.Marshal(nodes)
	bServices, _ := json.Marshal(services)

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/v1.35/nodes":
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write(bNodes)
		case "/v1.35/services":
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write(bServices)
		case "/v1.35/tasks":
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte(`[]`))
		default:
			http.NotFound(w, r)
		}
	}))
	defer server.Close()

	defer ResetCli()
	SetCli(makeClientForServer(t, server.URL))

	req := httptest.NewRequest(http.MethodGet, "/ui/dashboardh", nil)
	w := httptest.NewRecorder()
	dashboardHHandler(w, req)
	resp := w.Result()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200 got %d", resp.StatusCode)
	}
}
