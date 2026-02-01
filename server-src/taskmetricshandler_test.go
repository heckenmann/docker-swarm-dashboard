package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gorilla/mux"
)

func TestTaskMetricsHandler_TaskNotFound(t *testing.T) {
	// Mock Docker API server that returns 404 for task inspection
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v1.35/tasks/nonexistent" {
			w.WriteHeader(http.StatusNotFound)
			w.Write([]byte(`{"message":"task not found"}`))
			return
		}
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{}`))
	}))
	defer server.Close()

	SetCli(makeClientForServer(t, server.URL))
	defer ResetCli()

	req := httptest.NewRequest("GET", "/docker/tasks/nonexistent/metrics", nil)
	req = mux.SetURLVars(req, map[string]string{"id": "nonexistent"})
	w := httptest.NewRecorder()

	taskMetricsHandler(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}

	var response taskMetricsResponse
	json.NewDecoder(w.Body).Decode(&response)

	if response.Available {
		t.Error("Expected available to be false for non-existent task")
	}
	if response.Error == nil {
		t.Error("Expected error message for non-existent task")
	}
}

func TestTaskMetricsHandler_TaskNotRunning(t *testing.T) {
	// Mock Docker API server that returns a non-running task
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v1.35/tasks/task123" {
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{
				"ID": "task123",
				"ServiceID": "service123",
				"NodeID": "node123",
				"Status": {"State": "shutdown"}
			}`))
			return
		}
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{}`))
	}))
	defer server.Close()

	SetCli(makeClientForServer(t, server.URL))
	defer ResetCli()

	req := httptest.NewRequest("GET", "/docker/tasks/task123/metrics", nil)
	req = mux.SetURLVars(req, map[string]string{"id": "task123"})
	w := httptest.NewRecorder()

	taskMetricsHandler(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}

	var response taskMetricsResponse
	json.NewDecoder(w.Body).Decode(&response)

	if response.Available {
		t.Error("Expected available to be false for non-running task")
	}
	if response.Message == nil {
		t.Error("Expected message for non-running task")
	}
}

func TestTaskMetricsHandler_CAdvisorNotFound(t *testing.T) {
	// Mock Docker API server with running task but no cAdvisor service
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v1.35/tasks/task123" {
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{
				"ID": "task123",
				"ServiceID": "service123",
				"NodeID": "node123",
				"Status": {"State": "running"}
			}`))
			return
		}
		if r.URL.Path == "/v1.35/services" {
			// Return empty services list - no cAdvisor
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`[]`))
			return
		}
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{}`))
	}))
	defer server.Close()

	SetCli(makeClientForServer(t, server.URL))
	defer ResetCli()

	req := httptest.NewRequest("GET", "/docker/tasks/task123/metrics", nil)
	req = mux.SetURLVars(req, map[string]string{"id": "task123"})
	w := httptest.NewRecorder()

	taskMetricsHandler(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}

	var response taskMetricsResponse
	json.NewDecoder(w.Body).Decode(&response)

	if response.Available {
		t.Error("Expected available to be false when cAdvisor not found")
	}
	if response.Message == nil {
		t.Error("Expected message about cAdvisor not found")
	}
}
