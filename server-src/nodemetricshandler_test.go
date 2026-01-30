package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"

	"github.com/docker/docker/api/types/swarm"
	dockclient "github.com/docker/docker/client"
	"github.com/gorilla/mux"
)

func TestLoadNodeExporterLabelFromEnv(t *testing.T) {
	// Save original value
	originalLabel := nodeExporterLabel
	defer func() { nodeExporterLabel = originalLabel }()

	// Test default value
	os.Unsetenv("DSD_NODE_EXPORTER_LABEL")
	loadNodeExporterLabelFromEnv()
	if nodeExporterLabel != "dsd.node-exporter" {
		t.Errorf("Expected default label 'dsd.node-exporter', got '%s'", nodeExporterLabel)
	}

	// Test custom value
	os.Setenv("DSD_NODE_EXPORTER_LABEL", "custom.label")
	defer os.Unsetenv("DSD_NODE_EXPORTER_LABEL")
	loadNodeExporterLabelFromEnv()
	if nodeExporterLabel != "custom.label" {
		t.Errorf("Expected custom label 'custom.label', got '%s'", nodeExporterLabel)
	}
}

func TestFindNodeExporterService(t *testing.T) {
	// Create a service with the node-exporter label
	service := swarm.Service{
		ID: "test-node-exporter",
		Spec: swarm.ServiceSpec{
			Annotations: swarm.Annotations{
				Name: "node-exporter",
				Labels: map[string]string{
					"dsd.node-exporter": "true",
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
	found, err := findNodeExporterService(getCli())
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}
	if found == nil {
		t.Fatal("Expected to find node-exporter service, got nil")
	}
	if found.ID != "test-node-exporter" {
		t.Errorf("Expected service ID 'test-node-exporter', got '%s'", found.ID)
	}
}

func TestFindNodeExporterService_NotFound(t *testing.T) {
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
	found, err := findNodeExporterService(getCli())
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}
	if found != nil {
		t.Errorf("Expected not to find service, got %v", found)
	}
}

func TestGetNodeExporterEndpoint(t *testing.T) {
	service := &swarm.Service{
		Spec: swarm.ServiceSpec{
			Annotations: swarm.Annotations{
				Name: "node-exporter",
			},
		},
		Endpoint: swarm.Endpoint{
			Ports: []swarm.PortConfig{
				{
					PublishedPort: 9100,
					TargetPort:    9100,
				},
			},
		},
	}

	endpoint, err := getNodeExporterEndpoint(service, "node123")
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}

	expected := "http://node-exporter:9100/metrics"
	if endpoint != expected {
		t.Errorf("Expected endpoint '%s', got '%s'", expected, endpoint)
	}
}

func TestGetNodeExporterEndpoint_DefaultPort(t *testing.T) {
	service := &swarm.Service{
		Spec: swarm.ServiceSpec{
			Annotations: swarm.Annotations{
				Name: "my-node-exporter",
			},
		},
		Endpoint: swarm.Endpoint{
			Ports: []swarm.PortConfig{},
		},
	}

	endpoint, err := getNodeExporterEndpoint(service, "node123")
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}

	expected := "http://my-node-exporter:9100/metrics"
	if endpoint != expected {
		t.Errorf("Expected endpoint '%s', got '%s'", expected, endpoint)
	}
}

func TestNodeMetricsHandler_ServiceNotFound(t *testing.T) {
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

	// Save original label
	originalLabel := nodeExporterLabel
	nodeExporterLabel = "dsd.node-exporter"
	defer func() { nodeExporterLabel = originalLabel }()

	// Create request
	req := httptest.NewRequest("GET", "/docker/nodes/node123/metrics", nil)
	req = mux.SetURLVars(req, map[string]string{"id": "node123"})
	w := httptest.NewRecorder()

	// Call handler
	nodeMetricsHandler(w, req)

	// Check response
	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}

	var response nodeMetricsResponse
	err := json.NewDecoder(w.Body).Decode(&response)
	if err != nil {
		t.Fatalf("Failed to decode response: %v", err)
	}

	if response.Available {
		t.Error("Expected available=false when service not found")
	}
	if response.Message == nil {
		t.Error("Expected message to be set when service not found")
	}
}

func TestNodeMetricsHandler_NoNodeID(t *testing.T) {
	defer ResetCli()
	c, _ := dockclient.NewClientWithOpts(dockclient.WithHost("http://localhost"), dockclient.WithVersion("1.35"))
	SetCli(c)

	// Create request without node ID
	req := httptest.NewRequest("GET", "/docker/nodes//metrics", nil)
	w := httptest.NewRecorder()

	// Call handler
	nodeMetricsHandler(w, req)

	// Check response
	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status 400, got %d", w.Code)
	}
}

func TestFilterMetricsForNode(t *testing.T) {
	metrics := `# HELP node_cpu_seconds_total Seconds the cpus spent in each mode.
# TYPE node_cpu_seconds_total counter
node_cpu_seconds_total{cpu="0",mode="idle"} 1000.5
node_cpu_seconds_total{cpu="0",mode="system"} 50.2
`

	filtered := filterMetricsForNode(metrics, "node123")

	// Should return metrics as-is (trimmed)
	if filtered == "" {
		t.Error("Expected non-empty filtered metrics")
	}
	// Check that it's trimmed but otherwise unchanged
	trimmed := strings.TrimSpace(metrics)
	if filtered != trimmed {
		t.Error("Expected metrics to be trimmed")
	}
}

func TestFetchMetricsFromNodeExporter(t *testing.T) {
	metricsData := "node_cpu_seconds_total{cpu=\"0\",mode=\"idle\"} 1000.5"
	
	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/metrics" {
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(metricsData))
		} else {
			w.WriteHeader(http.StatusNotFound)
		}
	}))
	defer mockServer.Close()

	metrics, err := fetchMetricsFromNodeExporter(mockServer.URL + "/metrics")
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}

	if metrics != metricsData {
		t.Errorf("Expected metrics '%s', got '%s'", metricsData, metrics)
	}
}

func TestFetchMetricsFromNodeExporter_Error(t *testing.T) {
	_, err := fetchMetricsFromNodeExporter("http://localhost:99999/metrics")
	if err == nil {
		t.Error("Expected error when connecting to invalid endpoint")
	}
}
