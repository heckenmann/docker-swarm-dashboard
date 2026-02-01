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
