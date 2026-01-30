package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"

	"github.com/docker/docker/api/types/swarm"
	"github.com/docker/docker/client"
	"github.com/gorilla/mux"
)

var (
	nodeExporterLabel = ""
)

func init() {
	loadNodeExporterLabelFromEnv()
}

// loadNodeExporterLabelFromEnv reads the DSD_NODE_EXPORTER_LABEL environment variable.
func loadNodeExporterLabelFromEnv() {
	if label, labelSet := os.LookupEnv("DSD_NODE_EXPORTER_LABEL"); labelSet {
		nodeExporterLabel = label
	} else {
		nodeExporterLabel = "dsd.node-exporter"
	}
}

// nodeMetricsResponse represents the response structure for node metrics endpoint
type nodeMetricsResponse struct {
	Available bool    `json:"available"`
	Metrics   *string `json:"metrics,omitempty"`
	Error     *string `json:"error,omitempty"`
	Message   *string `json:"message,omitempty"`
}

// findNodeExporterService discovers the node-exporter service by label
func findNodeExporterService(cli *client.Client) (*swarm.Service, error) {
	services, err := cli.ServiceList(context.Background(), swarm.ServiceListOptions{})
	if err != nil {
		return nil, err
	}

	// Look for a service with the configured label
	for _, service := range services {
		if service.Spec.Labels != nil {
			if _, hasLabel := service.Spec.Labels[nodeExporterLabel]; hasLabel {
				return &service, nil
			}
		}
	}

	return nil, nil // Not found but no error
}

// getNodeExporterEndpoint returns the endpoint URL for the node-exporter service
func getNodeExporterEndpoint(service *swarm.Service, nodeID string) (string, error) {
	if service == nil {
		return "", fmt.Errorf("service is nil")
	}

	// Node-exporter typically runs as a global service on each node
	// We need to find the task running on the specified node
	serviceName := service.Spec.Name

	// For global services, we can construct the URL using the service name
	// The service is accessible via Docker's internal network
	// Port 9100 is the default for node-exporter
	port := 9100

	// Check if service has port configuration
	if service.Endpoint.Ports != nil && len(service.Endpoint.Ports) > 0 {
		port = int(service.Endpoint.Ports[0].PublishedPort)
		if port == 0 {
			port = int(service.Endpoint.Ports[0].TargetPort)
		}
	}

	// Construct URL - using service name for DNS resolution within Docker network
	url := fmt.Sprintf("http://%s:%d/metrics", serviceName, port)
	return url, nil
}

// fetchMetricsFromNodeExporter fetches metrics from the node-exporter endpoint
func fetchMetricsFromNodeExporter(url string) (string, error) {
	resp, err := http.Get(url)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("node-exporter returned status %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	return string(body), nil
}

// nodeMetricsHandler handles requests for node metrics from node-exporter
func nodeMetricsHandler(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	nodeID := params["id"]

	if nodeID == "" {
		http.Error(w, "Node ID is required", http.StatusBadRequest)
		return
	}

	cli := getCli()

	// Find the node-exporter service
	service, err := findNodeExporterService(cli)
	if err != nil {
		errMsg := "Error finding node-exporter service: " + err.Error()
		response := nodeMetricsResponse{
			Available: false,
			Error:     &errMsg,
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
		return
	}

	if service == nil {
		// Node-exporter service not found
		msg := fmt.Sprintf("Node-exporter service not found. Deploy a global service with label '%s' to enable metrics.", nodeExporterLabel)
		response := nodeMetricsResponse{
			Available: false,
			Message:   &msg,
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
		return
	}

	// Get the endpoint URL
	endpoint, err := getNodeExporterEndpoint(service, nodeID)
	if err != nil {
		errMsg := "Error constructing node-exporter endpoint: " + err.Error()
		response := nodeMetricsResponse{
			Available: false,
			Error:     &errMsg,
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
		return
	}

	// Fetch metrics from node-exporter
	metrics, err := fetchMetricsFromNodeExporter(endpoint)
	if err != nil {
		errMsg := "Error fetching metrics from node-exporter: " + err.Error()
		response := nodeMetricsResponse{
			Available: true, // Service is available but request failed
			Error:     &errMsg,
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
		return
	}

	// Filter metrics for this specific node
	filteredMetrics := filterMetricsForNode(metrics, nodeID)

	// Success
	response := nodeMetricsResponse{
		Available: true,
		Metrics:   &filteredMetrics,
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// filterMetricsForNode filters Prometheus metrics for a specific node
// For now, we return all metrics as node-exporter already runs per-node
func filterMetricsForNode(metrics string, nodeID string) string {
	// Node-exporter is a per-node service, so all metrics are already node-specific
	// In the future, we could add node_id labels or filter further
	return strings.TrimSpace(metrics)
}
