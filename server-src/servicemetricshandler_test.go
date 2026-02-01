package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"strings"
	"testing"

	"github.com/docker/docker/api/types/swarm"
	"github.com/gorilla/mux"
)

// TestServiceMetricsHandler_Success verifies the full handler flow for service metrics
func TestServiceMetricsHandler_Success(t *testing.T) {
	// Start a mock cadvisor HTTP server
	metricsData := `node_time_seconds 1700000000
container_memory_usage_bytes{id="/docker/abc123",container_label_com_docker_swarm_service_name="test-service",container_label_com_docker_swarm_task_id="task1",container_label_com_docker_swarm_task_name="test-service.1"} 104857600
container_memory_working_set_bytes{id="/docker/abc123",container_label_com_docker_swarm_service_name="test-service",container_label_com_docker_swarm_task_id="task1",container_label_com_docker_swarm_task_name="test-service.1"} 94371840
container_spec_memory_limit_bytes{id="/docker/abc123",container_label_com_docker_swarm_service_name="test-service",container_label_com_docker_swarm_task_id="task1",container_label_com_docker_swarm_task_name="test-service.1"} 524288000
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

	// Extract host and port from mock server URL
	u, err := url.Parse(mockCAdvisor.URL)
	if err != nil {
		t.Fatalf("failed to parse mock server URL: %v", err)
	}
	host, portStr, err := netSplitHostPort(u.Host)
	if err != nil {
		t.Fatalf("failed to split host:port: %v", err)
	}

	// Create test service
	testService := swarm.Service{
		ID: "s-test",
		Spec: swarm.ServiceSpec{
			Annotations: swarm.Annotations{
				Name: "test-service",
			},
		},
	}

	// Create cadvisor service
	cadvisorSvc := swarm.Service{
		ID: "s-cadvisor",
		Spec: swarm.ServiceSpec{
			Annotations: swarm.Annotations{
				Name: "cadvisor",
				Labels: map[string]string{
					cadvisorLabel: "true",
				},
			},
		},
		Endpoint: swarm.Endpoint{
			Ports: []swarm.PortConfig{{
				TargetPort: uint32(parsePort(t, portStr)),
			}},
		},
	}

	// Create tasks
	tasks := []swarm.Task{{
		ID:        "t-test",
		ServiceID: "s-test",
		NodeID:    "node-test-1",
		Status:    swarm.TaskStatus{State: swarm.TaskStateRunning},
	}}

	cadvisorTasks := []swarm.Task{{
		ID:        "t-cadvisor",
		ServiceID: "s-cadvisor",
		NodeID:    "node-test-1",
		Status:    swarm.TaskStatus{State: swarm.TaskStateRunning},
		NetworksAttachments: []swarm.NetworkAttachment{{
			Addresses: []string{host + "/32"},
		}},
	}}

	bTestService, _ := json.Marshal([]swarm.Service{testService})
	bServices, _ := json.Marshal([]swarm.Service{testService, cadvisorSvc})
	bTasks, _ := json.Marshal(tasks)
	bCAdvisorTasks, _ := json.Marshal(cadvisorTasks)

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Logf("Mock server received: %s %s", r.URL.Path, r.URL.RawQuery)
		switch {
		case r.URL.Path == "/v1.35/services" && r.URL.RawQuery == "":
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write(bServices)
			return
		case r.URL.Path == "/v1.35/services" && strings.Contains(r.URL.RawQuery, "filters") && strings.Contains(r.URL.RawQuery, "id"):
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write(bTestService)
			return
		case r.URL.Path == "/v1.35/tasks" && strings.Contains(r.URL.RawQuery, "service") && strings.Contains(r.URL.RawQuery, "s-test"):
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write(bTasks)
			return
		case r.URL.Path == "/v1.35/tasks" && strings.Contains(r.URL.RawQuery, "service") && strings.Contains(r.URL.RawQuery, "s-cadvisor"):
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write(bCAdvisorTasks)
			return
		default:
			t.Logf("No match for path=%s query=%s", r.URL.Path, r.URL.RawQuery)
			http.NotFound(w, r)
			return
		}
	}))
	defer server.Close()

	defer ResetCli()
	SetCli(makeClientForServer(t, server.URL))

	// Call the handler
	req := httptest.NewRequest("GET", "/docker/services/s-test/metrics", nil)
	req = mux.SetURLVars(req, map[string]string{"id": "s-test"})
	w := httptest.NewRecorder()
	serviceMetricsHandler(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", w.Code)
	}

	var resp serviceMetricsResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if !resp.Available || resp.Metrics == nil {
		if resp.Error != nil {
			t.Fatalf("expected available metrics, got error: %s", *resp.Error)
		}
		if resp.Message != nil {
			t.Fatalf("expected available metrics, got message: %s", *resp.Message)
		}
		t.Fatalf("expected available metrics, got %+v", resp)
	}
	if resp.Metrics.TotalUsage == 0 {
		t.Fatalf("expected total usage > 0, got %f", resp.Metrics.TotalUsage)
	}
	if len(resp.Metrics.ContainerMetrics) == 0 {
		t.Fatalf("expected container metrics, got none")
	}
}

func TestLoadCAdvisorLabelFromEnv(t *testing.T) {
	// Save original value
	originalLabel := cadvisorLabel
	defer func() { cadvisorLabel = originalLabel }()

	// Test default value
	os.Unsetenv("DSD_CADVISOR_LABEL")
	loadCAdvisorLabelFromEnv()
	if cadvisorLabel != "dsd.cadvisor" {
		t.Errorf("Expected default label 'dsd.cadvisor', got '%s'", cadvisorLabel)
	}

	// Test custom value
	os.Setenv("DSD_CADVISOR_LABEL", "custom.cadvisor")
	defer os.Unsetenv("DSD_CADVISOR_LABEL")
	loadCAdvisorLabelFromEnv()
	if cadvisorLabel != "custom.cadvisor" {
		t.Errorf("Expected custom label 'custom.cadvisor', got '%s'", cadvisorLabel)
	}
}

func TestFindCAdvisorService(t *testing.T) {
	// Create a service with the cadvisor label
	service := swarm.Service{
		ID: "test-cadvisor",
		Spec: swarm.ServiceSpec{
			Annotations: swarm.Annotations{
				Name: "cadvisor",
				Labels: map[string]string{
					"dsd.cadvisor": "true",
				},
			},
		},
	}
	services := []swarm.Service{service}
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

	// Find the service
	found, err := findCAdvisorService(getCli())
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}
	if found == nil {
		t.Fatal("Expected to find cadvisor service, got nil")
	}
	if found.ID != "test-cadvisor" {
		t.Errorf("Expected service ID 'test-cadvisor', got '%s'", found.ID)
	}
}

func TestFindCAdvisorService_NotFound(t *testing.T) {
	// Service without the required label
	service := swarm.Service{
		ID: "other-service",
		Spec: swarm.ServiceSpec{
			Annotations: swarm.Annotations{
				Name: "other",
				Labels: map[string]string{
					"other.label": "value",
				},
			},
		},
	}
	services := []swarm.Service{service}
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

	// Try to find the service
	found, err := findCAdvisorService(getCli())
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}
	if found != nil {
		t.Errorf("Expected not to find service, got %v", found)
	}
}

func TestGetCAdvisorEndpoint(t *testing.T) {
	// Create service with ID so TaskList filtering works
	service := &swarm.Service{
		ID: "s1",
		Spec: swarm.ServiceSpec{
			Annotations: swarm.Annotations{
				Name: "cadvisor",
			},
		},
		Endpoint: swarm.Endpoint{
			Ports: []swarm.PortConfig{
				{
					PublishedPort: 8080,
					TargetPort:    8080,
				},
			},
		},
	}

	// Create a running task for service s1 on node123 with overlay address
	tasks := []swarm.Task{{
		ID:        "t1",
		ServiceID: "s1",
		NodeID:    "node123",
		Status:    swarm.TaskStatus{State: swarm.TaskStateRunning},
		NetworksAttachments: []swarm.NetworkAttachment{{
			Addresses: []string{"10.0.0.2/24"},
		}},
	}}

	bServices, _ := json.Marshal([]swarm.Service{*service})
	bTasks, _ := json.Marshal(tasks)

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/v1.35/services":
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write(bServices)
			return
		case "/v1.35/tasks":
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write(bTasks)
			return
		default:
			http.NotFound(w, r)
			return
		}
	}))
	defer server.Close()

	defer ResetCli()
	SetCli(makeClientForServer(t, server.URL))

	endpoint, err := getCAdvisorEndpoint(getCli(), service, "node123")
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}

	expected := "http://10.0.0.2:8080/metrics"
	if endpoint != expected {
		t.Errorf("Expected endpoint '%s', got '%s'", expected, endpoint)
	}
}

func TestServiceMetricsHandler_ServiceNotFound(t *testing.T) {
	// Empty services list
	services := []swarm.Service{}
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

	// Create request
	req := httptest.NewRequest("GET", "/docker/services/s-test/metrics", nil)
	req = mux.SetURLVars(req, map[string]string{"id": "s-test"})
	w := httptest.NewRecorder()

	// Call handler
	serviceMetricsHandler(w, req)

	// Check response
	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}

	var response serviceMetricsResponse
	err := json.NewDecoder(w.Body).Decode(&response)
	if err != nil {
		t.Fatalf("Failed to decode response: %v", err)
	}

	if response.Available {
		t.Error("Expected available=false when service not found")
	}
	if response.Error == nil {
		t.Error("Expected error to be set when service not found")
	}
}

func TestServiceMetricsHandler_NoServiceID(t *testing.T) {
	defer ResetCli()
	SetCli(makeClientForServer(t, "http://localhost"))

	// Create request without service ID
	req := httptest.NewRequest("GET", "/docker/services//metrics", nil)
	w := httptest.NewRecorder()

	// Call handler
	serviceMetricsHandler(w, req)

	// Check response
	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status 400, got %d", w.Code)
	}
}

func TestFetchMetricsFromCAdvisor(t *testing.T) {
	metricsData := "container_memory_usage_bytes{id=\"/docker/test\"} 104857600"

	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/metrics" {
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte(metricsData))
		} else {
			w.WriteHeader(http.StatusNotFound)
		}
	}))
	defer mockServer.Close()

	metrics, err := fetchMetricsFromCAdvisor(mockServer.URL + "/metrics")
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}

	if metrics != metricsData {
		t.Errorf("Expected metrics '%s', got '%s'", metricsData, metrics)
	}
}

func TestFetchMetricsFromCAdvisor_Error(t *testing.T) {
	_, err := fetchMetricsFromCAdvisor("http://localhost:99999/metrics")
	if err == nil {
		t.Error("Expected error when connecting to invalid endpoint")
	}
}

func TestParseCAdvisorMetrics(t *testing.T) {
	// Sample cAdvisor metrics text
	metricsText := `# HELP container_memory_usage_bytes Current memory usage in bytes
# TYPE container_memory_usage_bytes gauge
container_memory_usage_bytes{id="/docker/abc123",container_label_com_docker_swarm_service_name="test-service",container_label_com_docker_swarm_task_id="task1",container_label_com_docker_swarm_task_name="test-service.1"} 104857600
container_memory_usage_bytes{id="/docker/def456",container_label_com_docker_swarm_service_name="test-service",container_label_com_docker_swarm_task_id="task2",container_label_com_docker_swarm_task_name="test-service.2"} 209715200
# HELP container_memory_working_set_bytes Current working set in bytes
# TYPE container_memory_working_set_bytes gauge
container_memory_working_set_bytes{id="/docker/abc123",container_label_com_docker_swarm_service_name="test-service",container_label_com_docker_swarm_task_id="task1",container_label_com_docker_swarm_task_name="test-service.1"} 94371840
container_memory_working_set_bytes{id="/docker/def456",container_label_com_docker_swarm_service_name="test-service",container_label_com_docker_swarm_task_id="task2",container_label_com_docker_swarm_task_name="test-service.2"} 188743680
# HELP container_spec_memory_limit_bytes Memory limit for the container
# TYPE container_spec_memory_limit_bytes gauge
container_spec_memory_limit_bytes{id="/docker/abc123",container_label_com_docker_swarm_service_name="test-service",container_label_com_docker_swarm_task_id="task1",container_label_com_docker_swarm_task_name="test-service.1"} 524288000
container_spec_memory_limit_bytes{id="/docker/def456",container_label_com_docker_swarm_service_name="test-service",container_label_com_docker_swarm_task_id="task2",container_label_com_docker_swarm_task_name="test-service.2"} 524288000
# HELP container_cpu_usage_seconds_total Cumulative cpu time consumed in seconds.
# TYPE container_cpu_usage_seconds_total counter
container_cpu_usage_seconds_total{id="/docker/abc123",container_label_com_docker_swarm_service_name="test-service",container_label_com_docker_swarm_task_id="task1",container_label_com_docker_swarm_task_name="test-service.1"} 123.45
container_cpu_usage_seconds_total{id="/docker/def456",container_label_com_docker_swarm_service_name="test-service",container_label_com_docker_swarm_task_id="task2",container_label_com_docker_swarm_task_name="test-service.2"} 234.56
# HELP node_time_seconds System time in seconds since epoch (1970).
# TYPE node_time_seconds gauge
node_time_seconds 1706632800.123
`

	parsed, err := parseCAdvisorMetrics(metricsText, "s-test", "test-service")
	if err != nil {
		t.Fatalf("Failed to parse metrics: %v", err)
	}

	// Verify we got metrics for both containers
	if len(parsed.ContainerMetrics) != 2 {
		t.Errorf("Expected 2 container metrics, got %d", len(parsed.ContainerMetrics))
	}

	// Verify total usage (sum of both containers)
	expectedTotal := 104857600.0 + 209715200.0
	if parsed.TotalUsage != expectedTotal {
		t.Errorf("Expected total usage %f, got %f", expectedTotal, parsed.TotalUsage)
	}

	// Verify total limit
	expectedLimit := 524288000.0 + 524288000.0
	if parsed.TotalLimit != expectedLimit {
		t.Errorf("Expected total limit %f, got %f", expectedLimit, parsed.TotalLimit)
	}

	// Verify average usage
	expectedAvg := expectedTotal / 2
	if parsed.AverageUsage != expectedAvg {
		t.Errorf("Expected average usage %f, got %f", expectedAvg, parsed.AverageUsage)
	}

	// Verify server time
	expectedTime := 1706632800.123
	if parsed.ServerTime < expectedTime-0.01 || parsed.ServerTime > expectedTime+0.01 {
		t.Errorf("Expected server time %f, got %f", expectedTime, parsed.ServerTime)
	}

	// Verify CPU metrics are present
	hasCPU := false
	for _, cm := range parsed.ContainerMetrics {
		if cm.CPUUsage > 0 {
			hasCPU = true
			break
		}
	}
	if !hasCPU {
		t.Error("Expected at least one container to have CPU usage > 0")
	}
}

func TestParseCAdvisorMetrics_EmptyInput(t *testing.T) {
	parsed, err := parseCAdvisorMetrics("", "s-test", "test-service")
	if err != nil {
		t.Fatalf("Should handle empty input: %v", err)
	}

	if len(parsed.ContainerMetrics) != 0 {
		t.Error("Expected no container metrics for empty input")
	}
	if parsed.TotalUsage != 0 {
		t.Error("Expected zero total usage for empty input")
	}
}

func TestExtractSwarmLabels(t *testing.T) {
	// This is tested implicitly in TestParseCAdvisorMetrics,
	// but we can add a specific test if needed
	t.Skip("Tested implicitly in TestParseCAdvisorMetrics")
}

// TestServiceMetricsHandler_TaskListError tests error handling when task list fails
func TestServiceMetricsHandler_TaskListError(t *testing.T) {
	testService := swarm.Service{
		ID: "s-test",
		Spec: swarm.ServiceSpec{
			Annotations: swarm.Annotations{
				Name: "test-service",
			},
		},
	}

	cadvisorSvc := swarm.Service{
		ID: "s-cadvisor",
		Spec: swarm.ServiceSpec{
			Annotations: swarm.Annotations{
				Name: "cadvisor",
				Labels: map[string]string{
					cadvisorLabel: "true",
				},
			},
		},
	}

	bServices, _ := json.Marshal([]swarm.Service{testService, cadvisorSvc})

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.URL.Path == "/v1.35/services":
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write(bServices)
		case r.URL.Path == "/v1.35/tasks":
			// Simulate error when fetching tasks
			w.WriteHeader(http.StatusInternalServerError)
			_, _ = w.Write([]byte(`{"message":"task list error"}`))
		default:
			http.NotFound(w, r)
		}
	}))
	defer server.Close()

	defer ResetCli()
	SetCli(makeClientForServer(t, server.URL))

	req := httptest.NewRequest("GET", "/docker/services/s-test/metrics", nil)
	req = mux.SetURLVars(req, map[string]string{"id": "s-test"})
	w := httptest.NewRecorder()

	serviceMetricsHandler(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}

	var response serviceMetricsResponse
	if err := json.NewDecoder(w.Body).Decode(&response); err != nil {
		t.Fatalf("Failed to decode response: %v", err)
	}

	if response.Available {
		t.Error("Expected Available to be false when task list fails")
	}
	if response.Error == nil {
		t.Fatal("Expected Error to be set")
	}
	if !strings.Contains(*response.Error, "Error fetching service tasks") {
		t.Errorf("Expected error message about tasks, got: %s", *response.Error)
	}
}

// TestServiceMetricsHandler_ServiceListError tests error handling when service list fails
func TestServiceMetricsHandler_ServiceListError(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v1.35/services" {
			// Simulate error when fetching services
			w.WriteHeader(http.StatusInternalServerError)
			_, _ = w.Write([]byte(`{"message":"service list error"}`))
			return
		}
		http.NotFound(w, r)
	}))
	defer server.Close()

	defer ResetCli()
	SetCli(makeClientForServer(t, server.URL))

	req := httptest.NewRequest("GET", "/docker/services/s-test/metrics", nil)
	req = mux.SetURLVars(req, map[string]string{"id": "s-test"})
	w := httptest.NewRecorder()

	serviceMetricsHandler(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}

	var response serviceMetricsResponse
	if err := json.NewDecoder(w.Body).Decode(&response); err != nil {
		t.Fatalf("Failed to decode response: %v", err)
	}

	if response.Available {
		t.Error("Expected Available to be false when service list fails")
	}
	if response.Error == nil {
		t.Fatal("Expected Error to be set")
	}
	if !strings.Contains(*response.Error, "Error fetching service") {
		t.Errorf("Expected error message about service, got: %s", *response.Error)
	}
}

// TestServiceMetricsHandler_CAdvisorNotFound tests the case when cadvisor is not deployed
func TestServiceMetricsHandler_CAdvisorNotFound(t *testing.T) {
	testService := swarm.Service{
		ID: "s-test",
		Spec: swarm.ServiceSpec{
			Annotations: swarm.Annotations{
				Name: "test-service",
			},
		},
	}

	// No cadvisor service in the list
	bServices, _ := json.Marshal([]swarm.Service{testService})

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v1.35/services" {
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write(bServices)
			return
		}
		http.NotFound(w, r)
	}))
	defer server.Close()

	defer ResetCli()
	SetCli(makeClientForServer(t, server.URL))

	req := httptest.NewRequest("GET", "/docker/services/s-test/metrics", nil)
	req = mux.SetURLVars(req, map[string]string{"id": "s-test"})
	w := httptest.NewRecorder()

	serviceMetricsHandler(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}

	var response serviceMetricsResponse
	if err := json.NewDecoder(w.Body).Decode(&response); err != nil {
		t.Fatalf("Failed to decode response: %v", err)
	}

	if response.Available {
		t.Error("Expected Available to be false when cadvisor not found")
	}
	if response.Message == nil {
		t.Fatal("Expected Message to be set")
	}
	if !strings.Contains(*response.Message, "cAdvisor service not found") {
		t.Errorf("Expected message about cAdvisor, got: %s", *response.Message)
	}
}

// TestGetCAdvisorEndpoint_NoTasks tests getCAdvisorEndpoint when no tasks are found - should use DNS fallback
func TestGetCAdvisorEndpoint_NoTasks(t *testing.T) {
	cadvisorSvc := &swarm.Service{
		ID: "s-cadvisor",
		Spec: swarm.ServiceSpec{
			Annotations: swarm.Annotations{
				Name: "cadvisor", // Has name, so will use DNS fallback
			},
		},
	}

	// Empty task list
	bTasks, _ := json.Marshal([]swarm.Task{})

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v1.35/tasks" {
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write(bTasks)
			return
		}
		http.NotFound(w, r)
	}))
	defer server.Close()

	defer ResetCli()
	SetCli(makeClientForServer(t, server.URL))

	endpoint, err := getCAdvisorEndpoint(getCli(), cadvisorSvc, "node-1")
	if err != nil {
		t.Errorf("Expected no error with DNS fallback, got: %v", err)
	}
	// Should use DNS fallback
	if !strings.Contains(endpoint, "cadvisor") {
		t.Errorf("Expected endpoint to contain service name, got: %s", endpoint)
	}
}

// TestGetCAdvisorEndpoint_NoTasksNoName tests getCAdvisorEndpoint when no tasks and no service name
func TestGetCAdvisorEndpoint_NoTasksNoName(t *testing.T) {
	cadvisorSvc := &swarm.Service{
		ID: "s-cadvisor",
		Spec: swarm.ServiceSpec{
			Annotations: swarm.Annotations{
				Name: "", // No name, should fail
			},
		},
	}

	// Empty task list
	bTasks, _ := json.Marshal([]swarm.Task{})

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v1.35/tasks" {
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write(bTasks)
			return
		}
		http.NotFound(w, r)
	}))
	defer server.Close()

	defer ResetCli()
	SetCli(makeClientForServer(t, server.URL))

	endpoint, err := getCAdvisorEndpoint(getCli(), cadvisorSvc, "node-1")
	if err == nil {
		t.Error("Expected error when no tasks found and no service name")
	}
	if endpoint != "" {
		t.Error("Expected empty endpoint when no tasks and no name")
	}
}

// TestGetCAdvisorEndpoint_TaskListError tests error handling in getCAdvisorEndpoint
func TestGetCAdvisorEndpoint_TaskListError(t *testing.T) {
	cadvisorSvc := &swarm.Service{
		ID: "s-cadvisor",
		Spec: swarm.ServiceSpec{
			Annotations: swarm.Annotations{
				Name: "cadvisor", // Has name, so will use DNS fallback even on error
			},
		},
	}

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v1.35/tasks" {
			w.WriteHeader(http.StatusInternalServerError)
			_, _ = w.Write([]byte(`{"message":"task list error"}`))
			return
		}
		http.NotFound(w, r)
	}))
	defer server.Close()

	defer ResetCli()
	SetCli(makeClientForServer(t, server.URL))

	endpoint, err := getCAdvisorEndpoint(getCli(), cadvisorSvc, "node-1")
	if err != nil {
		t.Errorf("Expected no error with DNS fallback, got: %v", err)
	}
	// Should use DNS fallback
	if !strings.Contains(endpoint, "cadvisor") {
		t.Errorf("Expected endpoint to contain service name, got: %s", endpoint)
	}
}

// TestGetCAdvisorEndpoint_NoNetworkAttachments tests when task has no network - should use DNS fallback
func TestGetCAdvisorEndpoint_NoNetworkAttachments(t *testing.T) {
	cadvisorSvc := &swarm.Service{
		ID: "s-cadvisor",
		Spec: swarm.ServiceSpec{
			Annotations: swarm.Annotations{
				Name: "cadvisor",
			},
		},
		Endpoint: swarm.Endpoint{
			Ports: []swarm.PortConfig{{
				TargetPort: 8080,
			}},
		},
	}

	// Task without network attachments
	task := swarm.Task{
		ID:                  "t-cadvisor",
		ServiceID:           "s-cadvisor",
		NodeID:              "node-1",
		Status:              swarm.TaskStatus{State: swarm.TaskStateRunning},
		NetworksAttachments: []swarm.NetworkAttachment{}, // Empty
	}
	bTasks, _ := json.Marshal([]swarm.Task{task})

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v1.35/tasks" {
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write(bTasks)
			return
		}
		http.NotFound(w, r)
	}))
	defer server.Close()

	defer ResetCli()
	SetCli(makeClientForServer(t, server.URL))

	endpoint, err := getCAdvisorEndpoint(getCli(), cadvisorSvc, "node-1")
	if err != nil {
		t.Errorf("Expected no error with DNS fallback, got: %v", err)
	}
	// Should use DNS fallback
	if !strings.Contains(endpoint, "cadvisor") {
		t.Errorf("Expected endpoint to contain service name, got: %s", endpoint)
	}
}

// TestFetchMetricsFromCAdvisor_InvalidURL tests error handling for invalid URLs
func TestFetchMetricsFromCAdvisor_InvalidURL(t *testing.T) {
	// Use invalid URL
	url := "http://[::1]:99999" // Invalid port

	data, err := fetchMetricsFromCAdvisor(url)
	if err == nil {
		t.Error("Expected error for invalid URL")
	}
	if data != "" {
		t.Error("Expected empty data on error")
	}
}

// TestParseCAdvisorMetrics_CPUMetric tests CPU metrics parsing
func TestParseCAdvisorMetrics_CPUMetric(t *testing.T) {
	metricsData := `
container_cpu_usage_seconds_total{id="/docker/abc123",container_label_com_docker_swarm_service_name="test-service",container_label_com_docker_swarm_task_name="test-service.1"} 123.5
container_memory_usage_bytes{id="/docker/abc123",container_label_com_docker_swarm_service_name="test-service",container_label_com_docker_swarm_task_name="test-service.1"} 104857600
`

	result, err := parseCAdvisorMetrics(metricsData, "s-test", "test-service")
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}

	if len(result.ContainerMetrics) != 1 {
		t.Fatalf("Expected 1 container, got %d", len(result.ContainerMetrics))
	}

	container := result.ContainerMetrics[0]
	if container.CPUUsage != 123.5 {
		t.Errorf("Expected CPU usage 123.5, got %f", container.CPUUsage)
	}
}

// TestServiceMetricsHandler_NoRunningTasks tests when service has no running tasks
func TestServiceMetricsHandler_NoRunningTasks(t *testing.T) {
	testService := swarm.Service{
		ID: "s-test",
		Spec: swarm.ServiceSpec{
			Annotations: swarm.Annotations{
				Name: "test-service",
			},
		},
	}

	cadvisorSvc := swarm.Service{
		ID: "s-cadvisor",
		Spec: swarm.ServiceSpec{
			Annotations: swarm.Annotations{
				Name: "cadvisor",
				Labels: map[string]string{
					cadvisorLabel: "true",
				},
			},
		},
	}

	// Task that's not running
	tasks := []swarm.Task{{
		ID:        "t-test",
		ServiceID: "s-test",
		NodeID:    "node-test-1",
		Status:    swarm.TaskStatus{State: swarm.TaskStateShutdown},
	}}

	bServices, _ := json.Marshal([]swarm.Service{testService, cadvisorSvc})
	bTasks, _ := json.Marshal(tasks)

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.URL.Path == "/v1.35/services":
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write(bServices)
		case r.URL.Path == "/v1.35/tasks":
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write(bTasks)
		default:
			http.NotFound(w, r)
		}
	}))
	defer server.Close()

	defer ResetCli()
	SetCli(makeClientForServer(t, server.URL))

	req := httptest.NewRequest("GET", "/docker/services/s-test/metrics", nil)
	req = mux.SetURLVars(req, map[string]string{"id": "s-test"})
	w := httptest.NewRecorder()

	serviceMetricsHandler(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}

	var response serviceMetricsResponse
	if err := json.NewDecoder(w.Body).Decode(&response); err != nil {
		t.Fatalf("Failed to decode response: %v", err)
	}

	// Should be Available: true but with an error message about no running tasks
	if !response.Available {
		t.Error("Expected Available to be true")
	}
	if response.Error == nil {
		t.Fatal("Expected Error to be set")
	}
	if !strings.Contains(*response.Error, "No running tasks") {
		t.Errorf("Expected error about no running tasks, got: %s", *response.Error)
	}
}

// TestServiceMetricsHandler_FetchMetricsError tests error when fetching metrics from cadvisor fails
func TestServiceMetricsHandler_FetchMetricsError(t *testing.T) {
	testService := swarm.Service{
		ID: "s-test",
		Spec: swarm.ServiceSpec{
			Annotations: swarm.Annotations{
				Name: "test-service",
			},
		},
	}

	// Create mock HTTP server that returns error for metrics
	metricsServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/metrics" {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		http.NotFound(w, r)
	}))
	defer metricsServer.Close()

	// Extract host and port from metrics server
	u, _ := url.Parse(metricsServer.URL)
	host, portStr, _ := netSplitHostPort(u.Host)

	cadvisorSvc := swarm.Service{
		ID: "s-cadvisor",
		Spec: swarm.ServiceSpec{
			Annotations: swarm.Annotations{
				Name: "cadvisor",
				Labels: map[string]string{
					cadvisorLabel: "true",
				},
			},
		},
		Endpoint: swarm.Endpoint{
			Ports: []swarm.PortConfig{{
				TargetPort: uint32(parsePort(t, portStr)),
			}},
		},
	}

	tasks := []swarm.Task{{
		ID:        "t-test",
		ServiceID: "s-test",
		NodeID:    "node-test-1",
		Status:    swarm.TaskStatus{State: swarm.TaskStateRunning},
	}}

	cadvisorTasks := []swarm.Task{{
		ID:        "t-cadvisor",
		ServiceID: "s-cadvisor",
		NodeID:    "node-test-1",
		Status:    swarm.TaskStatus{State: swarm.TaskStateRunning},
		NetworksAttachments: []swarm.NetworkAttachment{{
			Addresses: []string{host + "/32"},
		}},
	}}

	bServices, _ := json.Marshal([]swarm.Service{testService, cadvisorSvc})
	bTestTasks, _ := json.Marshal(tasks)
	bCAdvisorTasks, _ := json.Marshal(cadvisorTasks)

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.URL.Path == "/v1.35/services":
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write(bServices)
		case r.URL.Path == "/v1.35/tasks" && strings.Contains(r.URL.RawQuery, "s-test"):
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write(bTestTasks)
		case r.URL.Path == "/v1.35/tasks":
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write(bCAdvisorTasks)
		default:
			http.NotFound(w, r)
		}
	}))
	defer server.Close()

	defer ResetCli()
	SetCli(makeClientForServer(t, server.URL))

	req := httptest.NewRequest("GET", "/docker/services/s-test/metrics", nil)
	req = mux.SetURLVars(req, map[string]string{"id": "s-test"})
	w := httptest.NewRecorder()

	serviceMetricsHandler(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}

	var response serviceMetricsResponse
	if err := json.NewDecoder(w.Body).Decode(&response); err != nil {
		t.Fatalf("Failed to decode response: %v", err)
	}

	// Should be Available: true but with error about fetching metrics
	if !response.Available {
		t.Error("Expected Available to be true when metrics fetch fails")
	}
	if response.Error == nil {
		t.Fatal("Expected Error to be set")
	}
	if !strings.Contains(*response.Error, "Error fetching metrics from cadvisor") {
		t.Errorf("Expected error about fetching metrics, got: %s", *response.Error)
	}
}

// TestParseCAdvisorMetrics_MalformedData tests error handling for malformed data
func TestParseCAdvisorMetrics_MalformedData(t *testing.T) {
	// Invalid metric line (missing value)
	metricsData := `container_memory_usage_bytes{id="/docker/abc123"}`

	result, err := parseCAdvisorMetrics(metricsData, "s-test", "test-service")
	if err != nil {
		t.Fatalf("Parser should handle malformed data gracefully, got error: %v", err)
	}

	// Should return empty result
	if len(result.ContainerMetrics) != 0 {
		t.Errorf("Expected no containers for malformed data, got %d", len(result.ContainerMetrics))
	}
}

// TestFindCAdvisorService_ListError tests error handling when service list fails
func TestFindCAdvisorService_ListError(t *testing.T) {
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

	found, err := findCAdvisorService(getCli())
	if err == nil {
		t.Error("Expected error when service list fails")
	}
	if found != nil {
		t.Error("Expected nil service on error")
	}
}

// TestParseCAdvisorMetrics_WorkingSetMetric tests working set metrics parsing
func TestParseCAdvisorMetrics_WorkingSetMetric(t *testing.T) {
	metricsData := `
container_memory_working_set_bytes{id="/docker/xyz789",container_label_com_docker_swarm_service_name="test-service",container_label_com_docker_swarm_task_name="test-service.2"} 52428800
container_memory_usage_bytes{id="/docker/xyz789",container_label_com_docker_swarm_service_name="test-service",container_label_com_docker_swarm_task_name="test-service.2"} 62914560
`

	result, err := parseCAdvisorMetrics(metricsData, "s-test", "test-service")
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}

	if len(result.ContainerMetrics) != 1 {
		t.Fatalf("Expected 1 container, got %d", len(result.ContainerMetrics))
	}

	container := result.ContainerMetrics[0]
	if container.WorkingSet != 52428800 {
		t.Errorf("Expected working set 52428800, got %f", container.WorkingSet)
	}
}

// TestParseCAdvisorMetrics_LimitMetric tests limit metrics parsing
func TestParseCAdvisorMetrics_LimitMetric(t *testing.T) {
	metricsData := `
container_spec_memory_limit_bytes{id="/docker/def456",container_label_com_docker_swarm_service_name="test-service",container_label_com_docker_swarm_task_name="test-service.3"} 536870912
container_memory_usage_bytes{id="/docker/def456",container_label_com_docker_swarm_service_name="test-service",container_label_com_docker_swarm_task_name="test-service.3"} 268435456
`

	result, err := parseCAdvisorMetrics(metricsData, "s-test", "test-service")
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}

	if len(result.ContainerMetrics) != 1 {
		t.Fatalf("Expected 1 container, got %d", len(result.ContainerMetrics))
	}

	container := result.ContainerMetrics[0]
	if container.Limit != 536870912 {
		t.Errorf("Expected limit 536870912, got %f", container.Limit)
	}
}

// TestGetCAdvisorEndpoint_NilService tests error handling when service is nil
func TestGetCAdvisorEndpoint_NilService(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.NotFound(w, r)
	}))
	defer server.Close()

	defer ResetCli()
	SetCli(makeClientForServer(t, server.URL))

	endpoint, err := getCAdvisorEndpoint(getCli(), nil, "node-1")
	if err == nil {
		t.Error("Expected error when service is nil")
	}
	if !strings.Contains(err.Error(), "service is nil") {
		t.Errorf("Expected error about nil service, got: %v", err)
	}
	if endpoint != "" {
		t.Error("Expected empty endpoint when service is nil")
	}
}

// TestGetCAdvisorEndpoint_PublishedPort tests using published port when target port is 0
func TestGetCAdvisorEndpoint_PublishedPort(t *testing.T) {
	cadvisorSvc := &swarm.Service{
		ID: "s-cadvisor",
		Spec: swarm.ServiceSpec{
			Annotations: swarm.Annotations{
				Name: "cadvisor",
			},
		},
		Endpoint: swarm.Endpoint{
			Ports: []swarm.PortConfig{{
				TargetPort:    0,    // Target port is 0
				PublishedPort: 9090, // Should use this
			}},
		},
	}

	// Empty task list - will use DNS fallback
	bTasks, _ := json.Marshal([]swarm.Task{})

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v1.35/tasks" {
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write(bTasks)
			return
		}
		http.NotFound(w, r)
	}))
	defer server.Close()

	defer ResetCli()
	SetCli(makeClientForServer(t, server.URL))

	endpoint, err := getCAdvisorEndpoint(getCli(), cadvisorSvc, "node-1")
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}
	// Should use published port 9090
	if !strings.Contains(endpoint, ":9090") {
		t.Errorf("Expected endpoint to use port 9090, got: %s", endpoint)
	}
}

// TestGetCAdvisorEndpoint_NoServiceID tests fallback when service ID is empty
func TestGetCAdvisorEndpoint_NoServiceID(t *testing.T) {
	cadvisorSvc := &swarm.Service{
		ID: "", // Empty ID
		Spec: swarm.ServiceSpec{
			Annotations: swarm.Annotations{
				Name: "cadvisor-service",
			},
		},
		Endpoint: swarm.Endpoint{
			Ports: []swarm.PortConfig{{
				TargetPort: 8080,
			}},
		},
	}

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.NotFound(w, r)
	}))
	defer server.Close()

	defer ResetCli()
	SetCli(makeClientForServer(t, server.URL))

	endpoint, err := getCAdvisorEndpoint(getCli(), cadvisorSvc, "node-1")
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}
	// Should use DNS name fallback
	if !strings.Contains(endpoint, "cadvisor-service") {
		t.Errorf("Expected endpoint to contain service name, got: %s", endpoint)
	}
}

// TestParseCAdvisorMetrics_MultipleContainers tests parsing multiple containers
func TestParseCAdvisorMetrics_MultipleContainers(t *testing.T) {
	metricsData := `
container_memory_usage_bytes{id="/docker/abc123",container_label_com_docker_swarm_service_name="test-service",container_label_com_docker_swarm_task_name="test-service.1"} 104857600
container_memory_usage_bytes{id="/docker/def456",container_label_com_docker_swarm_service_name="test-service",container_label_com_docker_swarm_task_name="test-service.2"} 209715200
container_spec_memory_limit_bytes{id="/docker/abc123",container_label_com_docker_swarm_service_name="test-service",container_label_com_docker_swarm_task_name="test-service.1"} 524288000
container_spec_memory_limit_bytes{id="/docker/def456",container_label_com_docker_swarm_service_name="test-service",container_label_com_docker_swarm_task_name="test-service.2"} 524288000
`

	result, err := parseCAdvisorMetrics(metricsData, "s-test", "test-service")
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}

	if len(result.ContainerMetrics) != 2 {
		t.Fatalf("Expected 2 containers, got %d", len(result.ContainerMetrics))
	}

	// Check total usage is sum of both containers
	expectedTotal := float64(104857600 + 209715200)
	if result.TotalUsage != expectedTotal {
		t.Errorf("Expected total usage %f, got %f", expectedTotal, result.TotalUsage)
	}
}

// TestParseCAdvisorMetrics_ServerTime tests parsing server time
func TestParseCAdvisorMetrics_ServerTime(t *testing.T) {
	metricsData := `
node_time_seconds 1700000000
container_memory_usage_bytes{id="/docker/abc123",container_label_com_docker_swarm_service_name="test-service",container_label_com_docker_swarm_task_name="test-service.1"} 104857600
`

	result, err := parseCAdvisorMetrics(metricsData, "s-test", "test-service")
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}

	if len(result.ContainerMetrics) != 1 {
		t.Fatalf("Expected 1 container, got %d", len(result.ContainerMetrics))
	}

	container := result.ContainerMetrics[0]
	if container.ServerTime == 0 {
		t.Error("Expected server time to be set")
	}
}

// TestParseCAdvisorMetrics_InvalidMetricsText tests invalid prometheus format
func TestParseCAdvisorMetrics_InvalidMetricsText(t *testing.T) {
	// Completely invalid prometheus format that will cause parsing error
	metricsData := "this is not valid prometheus format {{{{"

	result, err := parseCAdvisorMetrics(metricsData, "s-test", "test-service")
	if err != nil {
		t.Fatalf("Parser should handle invalid format gracefully, got error: %v", err)
	}
	// Should return empty result when format is invalid
	if result == nil {
		t.Fatal("Expected non-nil result")
	}
	if len(result.ContainerMetrics) != 0 {
		t.Errorf("Expected no containers for invalid format, got %d", len(result.ContainerMetrics))
	}
}

// TestParseCAdvisorMetrics_FilterByServiceID tests filtering by service ID in container ID
func TestParseCAdvisorMetrics_FilterByServiceID(t *testing.T) {
	// Metrics with service ID in container ID path
	metricsData := `
container_memory_usage_bytes{id="/docker/s-test-abc123"} 104857600
container_spec_memory_limit_bytes{id="/docker/s-test-abc123"} 524288000
`

	result, err := parseCAdvisorMetrics(metricsData, "s-test", "other-service")
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}

	// Should find the container because service ID is in the container ID
	if len(result.ContainerMetrics) != 1 {
		t.Fatalf("Expected 1 container (filtered by service ID), got %d", len(result.ContainerMetrics))
	}
}

// TestGetCAdvisorEndpoint_AddressWithCIDR tests address parsing with CIDR notation
func TestGetCAdvisorEndpoint_AddressWithCIDR(t *testing.T) {
	u, _ := url.Parse("http://127.0.0.1:9999")
	host, portStr, _ := netSplitHostPort(u.Host)

	cadvisorSvc := &swarm.Service{
		ID: "s-cadvisor",
		Spec: swarm.ServiceSpec{
			Annotations: swarm.Annotations{
				Name: "cadvisor",
			},
		},
		Endpoint: swarm.Endpoint{
			Ports: []swarm.PortConfig{{
				TargetPort: uint32(parsePort(t, portStr)),
			}},
		},
	}

	// Task with network address in CIDR notation
	task := swarm.Task{
		ID:        "t-cadvisor",
		ServiceID: "s-cadvisor",
		NodeID:    "node-1",
		Status:    swarm.TaskStatus{State: swarm.TaskStateRunning},
		NetworksAttachments: []swarm.NetworkAttachment{{
			Addresses: []string{host + "/24"}, // CIDR notation
		}},
	}
	bTasks, _ := json.Marshal([]swarm.Task{task})

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v1.35/tasks" {
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write(bTasks)
			return
		}
		http.NotFound(w, r)
	}))
	defer server.Close()

	defer ResetCli()
	SetCli(makeClientForServer(t, server.URL))

	endpoint, err := getCAdvisorEndpoint(getCli(), cadvisorSvc, "node-1")
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}
	// Should strip CIDR and use the IP
	if !strings.Contains(endpoint, host) {
		t.Errorf("Expected endpoint to contain host %s, got: %s", host, endpoint)
	}
}

// TestParseCAdvisorMetrics_CPUPercentCalculation tests CPU percent calculation
func TestParseCAdvisorMetrics_CPUPercentCalculation(t *testing.T) {
	metricsData := `
container_cpu_usage_seconds_total{id="/docker/abc123",container_label_com_docker_swarm_service_name="test-service",container_label_com_docker_swarm_task_name="test-service.1"} 100
container_memory_usage_bytes{id="/docker/abc123",container_label_com_docker_swarm_service_name="test-service",container_label_com_docker_swarm_task_name="test-service.1"} 104857600
container_spec_cpu_quota{id="/docker/abc123",container_label_com_docker_swarm_service_name="test-service",container_label_com_docker_swarm_task_name="test-service.1"} 50000
container_spec_cpu_period{id="/docker/abc123",container_label_com_docker_swarm_service_name="test-service",container_label_com_docker_swarm_task_name="test-service.1"} 100000
`

	result, err := parseCAdvisorMetrics(metricsData, "s-test", "test-service")
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}

	if len(result.ContainerMetrics) != 1 {
		t.Fatalf("Expected 1 container, got %d", len(result.ContainerMetrics))
	}

	container := result.ContainerMetrics[0]
	// CPU percent should be calculated from quota/period
	if container.CPUPercent == 0 {
		t.Error("Expected CPU percent to be calculated")
	}
}

// TestGetCAdvisorEndpoint_NonRunningTask tests skipping non-running tasks
func TestGetCAdvisorEndpoint_NonRunningTask(t *testing.T) {
	cadvisorSvc := &swarm.Service{
		ID: "s-cadvisor",
		Spec: swarm.ServiceSpec{
			Annotations: swarm.Annotations{
				Name: "cadvisor",
			},
		},
		Endpoint: swarm.Endpoint{
			Ports: []swarm.PortConfig{{
				TargetPort: 8080,
			}},
		},
	}

	// Task that is not running
	task := swarm.Task{
		ID:        "t-cadvisor",
		ServiceID: "s-cadvisor",
		NodeID:    "node-1",
		Status:    swarm.TaskStatus{State: swarm.TaskStateFailed},
		NetworksAttachments: []swarm.NetworkAttachment{{
			Addresses: []string{"10.0.0.5/24"},
		}},
	}
	bTasks, _ := json.Marshal([]swarm.Task{task})

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v1.35/tasks" {
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write(bTasks)
			return
		}
		http.NotFound(w, r)
	}))
	defer server.Close()

	defer ResetCli()
	SetCli(makeClientForServer(t, server.URL))

	endpoint, err := getCAdvisorEndpoint(getCli(), cadvisorSvc, "node-1")
	if err != nil {
		t.Fatalf("Unexpected error (should use DNS fallback): %v", err)
	}
	// Should use DNS fallback when no running tasks
	if !strings.Contains(endpoint, "cadvisor") {
		t.Errorf("Expected DNS fallback endpoint, got: %s", endpoint)
	}
}

// TestParseCAdvisorMetrics_EmptyContainerIDSkipped tests that empty container IDs are skipped
func TestParseCAdvisorMetrics_EmptyContainerIDSkipped(t *testing.T) {
	// Metric with empty container ID (pod-level aggregate)
	metricsData := `
container_memory_usage_bytes{id="",container_label_com_docker_swarm_service_name="test-service"} 104857600
container_memory_usage_bytes{id="/docker/abc123",container_label_com_docker_swarm_service_name="test-service",container_label_com_docker_swarm_task_name="test-service.1"} 52428800
`

	result, err := parseCAdvisorMetrics(metricsData, "s-test", "test-service")
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}

	// Should skip empty container ID and only count the real container
	if len(result.ContainerMetrics) != 1 {
		t.Fatalf("Expected 1 container (empty IDs skipped), got %d", len(result.ContainerMetrics))
	}

	if result.ContainerMetrics[0].ContainerID != "/docker/abc123" {
		t.Errorf("Expected real container, got: %s", result.ContainerMetrics[0].ContainerID)
	}
}

// TestParseCAdvisorMetrics_UsagePercentCalculation tests usage percent calculation
func TestParseCAdvisorMetrics_UsagePercentCalculation(t *testing.T) {
	metricsData := `
container_memory_usage_bytes{id="/docker/abc123",container_label_com_docker_swarm_service_name="test-service",container_label_com_docker_swarm_task_name="test-service.1"} 262144000
container_spec_memory_limit_bytes{id="/docker/abc123",container_label_com_docker_swarm_service_name="test-service",container_label_com_docker_swarm_task_name="test-service.1"} 524288000
`

	result, err := parseCAdvisorMetrics(metricsData, "s-test", "test-service")
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}

	if len(result.ContainerMetrics) != 1 {
		t.Fatalf("Expected 1 container, got %d", len(result.ContainerMetrics))
	}

	container := result.ContainerMetrics[0]
	// Should calculate usage percent as (usage/limit)*100 = (262144000/524288000)*100 = 50%
	expectedPercent := 50.0
	if container.UsagePercent < expectedPercent-0.1 || container.UsagePercent > expectedPercent+0.1 {
		t.Errorf("Expected usage percent around %.1f%%, got %.2f%%", expectedPercent, container.UsagePercent)
	}
}

// TestParseCAdvisorMetrics_CPUQuotaOnly tests CPU quota without period
func TestParseCAdvisorMetrics_CPUQuotaOnly(t *testing.T) {
	metricsData := `
container_cpu_usage_seconds_total{id="/docker/abc123",container_label_com_docker_swarm_service_name="test-service",container_label_com_docker_swarm_task_name="test-service.1"} 100
container_memory_usage_bytes{id="/docker/abc123",container_label_com_docker_swarm_service_name="test-service",container_label_com_docker_swarm_task_name="test-service.1"} 104857600
container_spec_cpu_quota{id="/docker/abc123",container_label_com_docker_swarm_service_name="test-service",container_label_com_docker_swarm_task_name="test-service.1"} 50000
`

	result, err := parseCAdvisorMetrics(metricsData, "s-test", "test-service")
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}

	if len(result.ContainerMetrics) != 1 {
		t.Fatalf("Expected 1 container, got %d", len(result.ContainerMetrics))
	}

	container := result.ContainerMetrics[0]
	// CPU percent should not be calculated without period
	if container.CPUPercent != 0 {
		t.Error("Expected CPU percent to be 0 when period is missing")
	}
}

// TestParseCAdvisorMetrics_CPUPeriodOnly tests CPU period without quota
func TestParseCAdvisorMetrics_CPUPeriodOnly(t *testing.T) {
	metricsData := `
container_cpu_usage_seconds_total{id="/docker/abc123",container_label_com_docker_swarm_service_name="test-service",container_label_com_docker_swarm_task_name="test-service.1"} 100
container_memory_usage_bytes{id="/docker/abc123",container_label_com_docker_swarm_service_name="test-service",container_label_com_docker_swarm_task_name="test-service.1"} 104857600
container_spec_cpu_period{id="/docker/abc123",container_label_com_docker_swarm_service_name="test-service",container_label_com_docker_swarm_task_name="test-service.1"} 100000
`

	result, err := parseCAdvisorMetrics(metricsData, "s-test", "test-service")
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}

	if len(result.ContainerMetrics) != 1 {
		t.Fatalf("Expected 1 container, got %d", len(result.ContainerMetrics))
	}

	container := result.ContainerMetrics[0]
	// CPU percent should not be calculated without quota
	if container.CPUPercent != 0 {
		t.Error("Expected CPU percent to be 0 when quota is missing")
	}
}

// TestParseCAdvisorMetrics_CPUZeroPeriod tests handling of zero period
func TestParseCAdvisorMetrics_CPUZeroPeriod(t *testing.T) {
	metricsData := `
container_cpu_usage_seconds_total{id="/docker/abc123",container_label_com_docker_swarm_service_name="test-service",container_label_com_docker_swarm_task_name="test-service.1"} 100
container_memory_usage_bytes{id="/docker/abc123",container_label_com_docker_swarm_service_name="test-service",container_label_com_docker_swarm_task_name="test-service.1"} 104857600
container_spec_cpu_quota{id="/docker/abc123",container_label_com_docker_swarm_service_name="test-service",container_label_com_docker_swarm_task_name="test-service.1"} 50000
container_spec_cpu_period{id="/docker/abc123",container_label_com_docker_swarm_service_name="test-service",container_label_com_docker_swarm_task_name="test-service.1"} 0
`

	result, err := parseCAdvisorMetrics(metricsData, "s-test", "test-service")
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}

	if len(result.ContainerMetrics) != 1 {
		t.Fatalf("Expected 1 container, got %d", len(result.ContainerMetrics))
	}

	container := result.ContainerMetrics[0]
	// CPU percent should not be calculated when period is 0 (avoid division by zero)
	if container.CPUPercent != 0 {
		t.Error("Expected CPU percent to be 0 when period is 0")
	}
}

// TestParseCAdvisorMetrics_CPUQuotaPeriodFiltering tests filtering by service name in CPU metrics
func TestParseCAdvisorMetrics_CPUQuotaPeriodFiltering(t *testing.T) {
	metricsData := `
container_cpu_usage_seconds_total{id="/docker/abc123",container_label_com_docker_swarm_service_name="test-service",container_label_com_docker_swarm_task_name="test-service.1"} 100
container_memory_usage_bytes{id="/docker/abc123",container_label_com_docker_swarm_service_name="test-service",container_label_com_docker_swarm_task_name="test-service.1"} 104857600
container_spec_cpu_quota{id="/docker/abc123",container_label_com_docker_swarm_service_name="test-service",container_label_com_docker_swarm_task_name="test-service.1"} 50000
container_spec_cpu_period{id="/docker/abc123",container_label_com_docker_swarm_service_name="test-service",container_label_com_docker_swarm_task_name="test-service.1"} 100000
container_spec_cpu_quota{id="/docker/other123",container_label_com_docker_swarm_service_name="other-service",container_label_com_docker_swarm_task_name="other-service.1"} 80000
container_spec_cpu_period{id="/docker/other123",container_label_com_docker_swarm_service_name="other-service",container_label_com_docker_swarm_task_name="other-service.1"} 100000
`

	result, err := parseCAdvisorMetrics(metricsData, "s-test", "test-service")
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}

	// Should only have one container (filtered by service name)
	if len(result.ContainerMetrics) != 1 {
		t.Fatalf("Expected 1 container, got %d", len(result.ContainerMetrics))
	}

	container := result.ContainerMetrics[0]
	// Verify it's the correct container
	if !strings.Contains(container.ContainerID, "abc123") {
		t.Errorf("Expected container abc123, got %s", container.ContainerID)
	}
	// CPU percent should be calculated
	expectedPercent := 50.0 // (50000/100000) * 100
	if container.CPUPercent < expectedPercent-0.1 || container.CPUPercent > expectedPercent+0.1 {
		t.Errorf("Expected CPU percent around %.1f%%, got %.2f%%", expectedPercent, container.CPUPercent)
	}
}

// TestParseCAdvisorMetrics_EmptyContainerIDInCPUMetrics tests skipping empty container IDs in CPU metrics
func TestParseCAdvisorMetrics_EmptyContainerIDInCPUMetrics(t *testing.T) {
	metricsData := `
container_cpu_usage_seconds_total{id="/docker/abc123",container_label_com_docker_swarm_service_name="test-service",container_label_com_docker_swarm_task_name="test-service.1"} 100
container_memory_usage_bytes{id="/docker/abc123",container_label_com_docker_swarm_service_name="test-service",container_label_com_docker_swarm_task_name="test-service.1"} 104857600
container_spec_cpu_quota{id="",container_label_com_docker_swarm_service_name="test-service",container_label_com_docker_swarm_task_name="test-service.1"} 50000
container_spec_cpu_period{id="",container_label_com_docker_swarm_service_name="test-service",container_label_com_docker_swarm_task_name="test-service.1"} 100000
container_spec_cpu_quota{id="/docker/abc123",container_label_com_docker_swarm_service_name="test-service",container_label_com_docker_swarm_task_name="test-service.1"} 70000
container_spec_cpu_period{id="/docker/abc123",container_label_com_docker_swarm_service_name="test-service",container_label_com_docker_swarm_task_name="test-service.1"} 100000
`

	result, err := parseCAdvisorMetrics(metricsData, "s-test", "test-service")
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}

	if len(result.ContainerMetrics) != 1 {
		t.Fatalf("Expected 1 container, got %d", len(result.ContainerMetrics))
	}

	container := result.ContainerMetrics[0]
	// CPU percent should be calculated from the non-empty container ID metrics
	expectedPercent := 70.0 // (70000/100000) * 100
	if container.CPUPercent < expectedPercent-0.1 || container.CPUPercent > expectedPercent+0.1 {
		t.Errorf("Expected CPU percent around %.1f%%, got %.2f%%", expectedPercent, container.CPUPercent)
	}
}
