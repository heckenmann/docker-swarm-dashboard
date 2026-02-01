package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"

	"github.com/docker/docker/api/types/swarm"
	"github.com/gorilla/mux"
)

// Focused tests for taskmetricshandler
func TestTaskMetricsHandler_InspectError(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasPrefix(r.URL.Path, "/v1.35/tasks/") {
			w.WriteHeader(http.StatusInternalServerError)
			_, _ = w.Write([]byte(`{"message":"inspect error"}`))
			return
		}
		http.NotFound(w, r)
	}))
	defer server.Close()

	defer ResetCli()
	SetCli(makeClientForServer(t, server.URL))

	req := httptest.NewRequest("GET", "/docker/tasks/t-missing/metrics", nil)
	req = mux.SetURLVars(req, map[string]string{"id": "t-missing"})
	w := httptest.NewRecorder()

	taskMetricsHandler(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", w.Code)
	}
	var resp taskMetricsResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if resp.Available {
		t.Fatal("expected available=false when inspect fails")
	}
	if resp.Error == nil {
		t.Fatal("expected error to be set when inspect fails")
	}
}

func TestTaskMetricsHandler_NotRunning(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasPrefix(r.URL.Path, "/v1.35/tasks/") {
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte(`{"ID":"task1","Status":{"State":"shutdown"}}`))
			return
		}
		http.NotFound(w, r)
	}))
	defer server.Close()

	defer ResetCli()
	SetCli(makeClientForServer(t, server.URL))

	req := httptest.NewRequest("GET", "/docker/tasks/task1/metrics", nil)
	req = mux.SetURLVars(req, map[string]string{"id": "task1"})
	w := httptest.NewRecorder()

	taskMetricsHandler(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", w.Code)
	}
	var resp taskMetricsResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if resp.Available {
		t.Fatal("expected available=false for non-running task")
	}
	if resp.Message == nil {
		t.Fatal("expected message for non-running task")
	}
}

func TestTaskMetricsHandler_Success(t *testing.T) {
	metricsData := `container_memory_usage_bytes{id="/docker/abc123",container_label_com_docker_swarm_task_id="t-test",container_label_com_docker_swarm_service_name="s-test"} 104857600
container_memory_working_set_bytes{id="/docker/abc123",container_label_com_docker_swarm_task_id="t-test",container_label_com_docker_swarm_service_name="s-test"} 94371840
container_spec_memory_limit_bytes{id="/docker/abc123",container_label_com_docker_swarm_task_id="t-test",container_label_com_docker_swarm_service_name="s-test"} 524288000
`

	mockCAdvisor := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/metrics" {
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte(metricsData))
			return
		}
		http.NotFound(w, r)
	}))
	defer mockCAdvisor.Close()

	// Quick sanity check will be performed after setting up the task

	u, err := url.Parse(mockCAdvisor.URL)
	if err != nil {
		t.Fatalf("failed to parse mock server URL: %v", err)
	}
	host, portStr, err := netSplitHostPort(u.Host)
	if err != nil {
		t.Fatalf("failed to split host:port: %v", err)
	}

	task := swarm.Task{
		ID:        "t-test",
		ServiceID: "s-test",
		NodeID:    "node-test-1",
		Status:    swarm.TaskStatus{State: swarm.TaskStateRunning},
	}

	// Sanity: parser behavior is covered by servicemetricshandler_test.go

	cadvisorSvc := swarm.Service{
		ID: "s-cadvisor",
		Spec: swarm.ServiceSpec{
			Annotations: swarm.Annotations{
				Name:   "cadvisor",
				Labels: map[string]string{cadvisorLabel: "true"},
			},
		},
		Endpoint: swarm.Endpoint{Ports: []swarm.PortConfig{{TargetPort: uint32(parsePort(t, portStr))}}},
	}

	cadvisorTasks := []swarm.Task{{
		ID:                  "t-cadvisor",
		ServiceID:           "s-cadvisor",
		NodeID:              "node-test-1",
		Status:              swarm.TaskStatus{State: swarm.TaskStateRunning},
		NetworksAttachments: []swarm.NetworkAttachment{{Addresses: []string{host + "/32"}}},
	}}

	bTask, _ := json.Marshal(task)
	bServices, _ := json.Marshal([]swarm.Service{cadvisorSvc})
	bServiceTask, _ := json.Marshal([]swarm.Service{{
		ID:   "s-test",
		Spec: swarm.ServiceSpec{Annotations: swarm.Annotations{Name: "s-test"}},
	}})
	bCAdvisorTasks, _ := json.Marshal(cadvisorTasks)

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case strings.HasPrefix(r.URL.Path, "/v1.35/tasks/"):
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write(bTask)
			return
		case r.URL.Path == "/v1.35/services":
			// If a specific service id is requested, return that service
			if strings.Contains(r.URL.RawQuery, "s-test") {
				w.WriteHeader(http.StatusOK)
				_, _ = w.Write(bServiceTask)
				return
			}
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write(bServices)
			return
		case r.URL.Path == "/v1.35/tasks" && strings.Contains(r.URL.RawQuery, "service") && strings.Contains(r.URL.RawQuery, "s-cadvisor"):
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write(bCAdvisorTasks)
			return
		default:
			http.NotFound(w, r)
			return
		}
	}))
	defer server.Close()

	defer ResetCli()
	SetCli(makeClientForServer(t, server.URL))

	req := httptest.NewRequest("GET", "/docker/tasks/t-test/metrics", nil)
	req = mux.SetURLVars(req, map[string]string{"id": "t-test"})
	w := httptest.NewRecorder()

	taskMetricsHandler(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", w.Code)
	}
	var resp taskMetricsResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if !resp.Available || resp.Metrics == nil {
		if resp.Error != nil {
			t.Fatalf("expected available metrics, got error=%v, resp=%+v", *resp.Error, resp)
		}
		if resp.Message != nil {
			t.Fatalf("expected available metrics, got message=%v, resp=%+v", *resp.Message, resp)
		}
		t.Fatalf("expected available metrics, got %+v", resp)
	}
}
