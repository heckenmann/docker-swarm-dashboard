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

func TestTaskMetricsHandler_CAdvisorNotFound(t *testing.T) {
	// Task exists and is running but there is no cAdvisor service
	task := swarm.Task{
		ID:        "t-no-cadvisor",
		ServiceID: "s-none",
		NodeID:    "node-a",
		Status:    swarm.TaskStatus{State: swarm.TaskStateRunning},
	}
	bTask, _ := json.Marshal(task)

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case strings.HasPrefix(r.URL.Path, "/v1.35/tasks/"):
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write(bTask)
			return
		case r.URL.Path == "/v1.35/services":
			// return empty list -> no cAdvisor
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte("[]"))
			return
		default:
			http.NotFound(w, r)
			return
		}
	}))
	defer server.Close()

	defer ResetCli()
	SetCli(makeClientForServer(t, server.URL))

	req := httptest.NewRequest("GET", "/docker/tasks/t-no-cadvisor/metrics", nil)
	req = mux.SetURLVars(req, map[string]string{"id": "t-no-cadvisor"})
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
		t.Fatal("expected available=false when cAdvisor not found")
	}
	if resp.Message == nil || !strings.Contains(*resp.Message, cadvisorLabel) {
		t.Fatalf("expected message mentioning cadvisor label, got %+v", resp)
	}
}

func TestTaskMetricsHandler_ParseMetricsError(t *testing.T) {
	// cAdvisor returns malformed metrics causing parse error
	mockCAdvisor := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/metrics" {
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte("this is not prometheus text"))
			return
		}
		http.NotFound(w, r)
	}))
	defer mockCAdvisor.Close()

	u, err := url.Parse(mockCAdvisor.URL)
	if err != nil {
		t.Fatalf("failed to parse mock server URL: %v", err)
	}
	host, portStr, err := netSplitHostPort(u.Host)
	if err != nil {
		t.Fatalf("failed to split host:port: %v", err)
	}

	task := swarm.Task{
		ID:        "t-parse-err",
		ServiceID: "s-parse",
		NodeID:    "node-1",
		Status:    swarm.TaskStatus{State: swarm.TaskStateRunning},
	}

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
		NodeID:              "node-1",
		Status:              swarm.TaskStatus{State: swarm.TaskStateRunning},
		NetworksAttachments: []swarm.NetworkAttachment{{Addresses: []string{host + "/32"}}},
	}}

	bTask, _ := json.Marshal(task)
	bServices, _ := json.Marshal([]swarm.Service{cadvisorSvc})
	bServiceTask, _ := json.Marshal([]swarm.Service{{
		ID:   "s-parse",
		Spec: swarm.ServiceSpec{Annotations: swarm.Annotations{Name: "s-parse"}},
	}})
	bCAdvisorTasks, _ := json.Marshal(cadvisorTasks)

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case strings.HasPrefix(r.URL.Path, "/v1.35/tasks/"):
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write(bTask)
			return
		case r.URL.Path == "/v1.35/services":
			if strings.Contains(r.URL.RawQuery, "s-parse") {
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

	req := httptest.NewRequest("GET", "/docker/tasks/t-parse-err/metrics", nil)
	req = mux.SetURLVars(req, map[string]string{"id": "t-parse-err"})
	w := httptest.NewRecorder()

	// Override fetch to point to our mock cAdvisor
	// The handler will construct http://host:port/metrics so our mock server's host/port are used via service/task mocks above

	taskMetricsHandler(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", w.Code)
	}
	var resp taskMetricsResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if resp.Available {
		t.Fatal("expected available=false when parse fails")
	}
	if resp.Error == nil && resp.Message == nil {
		t.Fatalf("expected error or message to be set when parse fails, got %+v", resp)
	}
}
