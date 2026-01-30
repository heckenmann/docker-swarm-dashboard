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
	dto "github.com/prometheus/client_model/go"
	"github.com/prometheus/common/expfmt"
	"github.com/prometheus/common/model"
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

// CPUMetric represents CPU time data for a specific mode
type CPUMetric struct {
	Mode  string  `json:"mode"`
	Value float64 `json:"value"`
}

// MemoryMetrics represents memory metrics
type MemoryMetrics struct {
	Total     float64 `json:"total"`
	Free      float64 `json:"free"`
	Available float64 `json:"available"`
}

// FilesystemMetric represents filesystem/disk metrics
type FilesystemMetric struct {
	Device     string  `json:"device"`
	Mountpoint string  `json:"mountpoint"`
	Size       float64 `json:"size"`
	Available  float64 `json:"available"`
	Used       float64 `json:"used"`
	UsedPercent float64 `json:"usedPercent"`
}

// NetworkMetric represents network interface metrics
type NetworkMetric struct {
	Interface    string  `json:"interface"`
	ReceiveBytes float64 `json:"receiveBytes"`
	TransmitBytes float64 `json:"transmitBytes"`
}

// NTPMetrics represents NTP/time synchronization metrics
type NTPMetrics struct {
	OffsetSeconds float64 `json:"offsetSeconds"`
	SyncStatus    float64 `json:"syncStatus"`
}

// SystemMetrics represents system-level metrics
type SystemMetrics struct {
	Load1        float64 `json:"load1"`
	Load5        float64 `json:"load5"`
	Load15       float64 `json:"load15"`
	BootTime     float64 `json:"bootTime"`
	UptimeSeconds float64 `json:"uptimeSeconds"`
}

// ParsedMetrics represents the parsed and extracted metrics
type ParsedMetrics struct {
	CPU        []CPUMetric        `json:"cpu"`
	Memory     MemoryMetrics      `json:"memory"`
	Filesystem []FilesystemMetric `json:"filesystem"`
	Network    []NetworkMetric    `json:"network"`
	NTP        NTPMetrics         `json:"ntp"`
	System     SystemMetrics      `json:"system"`
	ServerTime float64            `json:"serverTime"` // Unix timestamp
}

// nodeMetricsResponse represents the response structure for node metrics endpoint
type nodeMetricsResponse struct {
	Available bool           `json:"available"`
	Metrics   *ParsedMetrics `json:"metrics,omitempty"`
	Error     *string        `json:"error,omitempty"`
	Message   *string        `json:"message,omitempty"`
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

// parsePrometheusMetrics parses Prometheus text format and extracts CPU and memory metrics
func parsePrometheusMetrics(metricsText string) (*ParsedMetrics, error) {
	parser := expfmt.NewTextParser(model.LegacyValidation)
	metricFamilies, err := parser.TextToMetricFamilies(strings.NewReader(metricsText))
	if err != nil {
		return nil, fmt.Errorf("failed to parse metrics: %w", err)
	}

	parsed := &ParsedMetrics{
		CPU:        make([]CPUMetric, 0),
		Memory:     MemoryMetrics{},
		Filesystem: make([]FilesystemMetric, 0),
		Network:    make([]NetworkMetric, 0),
		NTP:        NTPMetrics{},
		System:     SystemMetrics{},
	}

	// Extract CPU metrics
	if cpuFamily, ok := metricFamilies["node_cpu_seconds_total"]; ok {
		cpuModes := make(map[string]float64)
		for _, metric := range cpuFamily.GetMetric() {
			var mode string
			for _, label := range metric.GetLabel() {
				if label.GetName() == "mode" {
					mode = label.GetValue()
					break
				}
			}
			if mode != "" {
				value := getMetricValue(metric)
				cpuModes[mode] += value
			}
		}
		for mode, value := range cpuModes {
			parsed.CPU = append(parsed.CPU, CPUMetric{
				Mode:  mode,
				Value: value,
			})
		}
	}

	// Extract memory metrics
	if memTotalFamily, ok := metricFamilies["node_memory_MemTotal_bytes"]; ok {
		if len(memTotalFamily.GetMetric()) > 0 {
			parsed.Memory.Total = getMetricValue(memTotalFamily.GetMetric()[0])
		}
	}
	if memFreeFamily, ok := metricFamilies["node_memory_MemFree_bytes"]; ok {
		if len(memFreeFamily.GetMetric()) > 0 {
			parsed.Memory.Free = getMetricValue(memFreeFamily.GetMetric()[0])
		}
	}
	if memAvailableFamily, ok := metricFamilies["node_memory_MemAvailable_bytes"]; ok {
		if len(memAvailableFamily.GetMetric()) > 0 {
			parsed.Memory.Available = getMetricValue(memAvailableFamily.GetMetric()[0])
		}
	}

	// Extract filesystem metrics
	filesystemSizes := make(map[string]map[string]float64)
	if fsSize, ok := metricFamilies["node_filesystem_size_bytes"]; ok {
		for _, metric := range fsSize.GetMetric() {
			device, mountpoint := getFilesystemLabels(metric)
			if device != "" && mountpoint != "" {
				key := device + "|" + mountpoint
				if filesystemSizes[key] == nil {
					filesystemSizes[key] = make(map[string]float64)
				}
				filesystemSizes[key]["size"] = getMetricValue(metric)
				filesystemSizes[key]["device"] = 0 // placeholder
				filesystemSizes[key]["mountpoint"] = 0 // placeholder
			}
		}
	}
	if fsAvail, ok := metricFamilies["node_filesystem_avail_bytes"]; ok {
		for _, metric := range fsAvail.GetMetric() {
			device, mountpoint := getFilesystemLabels(metric)
			if device != "" && mountpoint != "" {
				key := device + "|" + mountpoint
				if filesystemSizes[key] == nil {
					filesystemSizes[key] = make(map[string]float64)
				}
				filesystemSizes[key]["avail"] = getMetricValue(metric)
			}
		}
	}

	// Build filesystem metrics from collected data
	for key, data := range filesystemSizes {
		parts := strings.Split(key, "|")
		if len(parts) != 2 {
			continue
		}
		size := data["size"]
		avail := data["avail"]
		if size > 0 {
			used := size - avail
			usedPercent := (used / size) * 100
			parsed.Filesystem = append(parsed.Filesystem, FilesystemMetric{
				Device:      parts[0],
				Mountpoint:  parts[1],
				Size:        size,
				Available:   avail,
				Used:        used,
				UsedPercent: usedPercent,
			})
		}
	}

	// Extract network metrics
	networkRx := make(map[string]float64)
	networkTx := make(map[string]float64)
	
	if netRx, ok := metricFamilies["node_network_receive_bytes_total"]; ok {
		for _, metric := range netRx.GetMetric() {
			iface := getNetworkInterface(metric)
			if iface != "" && iface != "lo" { // Skip loopback
				networkRx[iface] = getMetricValue(metric)
			}
		}
	}
	if netTx, ok := metricFamilies["node_network_transmit_bytes_total"]; ok {
		for _, metric := range netTx.GetMetric() {
			iface := getNetworkInterface(metric)
			if iface != "" && iface != "lo" { // Skip loopback
				networkTx[iface] = getMetricValue(metric)
			}
		}
	}

	// Build network metrics
	for iface, rx := range networkRx {
		tx := networkTx[iface]
		parsed.Network = append(parsed.Network, NetworkMetric{
			Interface:     iface,
			ReceiveBytes:  rx,
			TransmitBytes: tx,
		})
	}

	// Extract NTP metrics
	if ntpOffset, ok := metricFamilies["node_timex_offset_seconds"]; ok {
		if len(ntpOffset.GetMetric()) > 0 {
			parsed.NTP.OffsetSeconds = getMetricValue(ntpOffset.GetMetric()[0])
		}
	}
	if ntpSync, ok := metricFamilies["node_timex_sync_status"]; ok {
		if len(ntpSync.GetMetric()) > 0 {
			parsed.NTP.SyncStatus = getMetricValue(ntpSync.GetMetric()[0])
		}
	}

	// Extract server time
	if timeMetric, ok := metricFamilies["node_time_seconds"]; ok {
		if len(timeMetric.GetMetric()) > 0 {
			parsed.ServerTime = getMetricValue(timeMetric.GetMetric()[0])
		}
	}

	// Extract load average
	if load1, ok := metricFamilies["node_load1"]; ok {
		if len(load1.GetMetric()) > 0 {
			parsed.System.Load1 = getMetricValue(load1.GetMetric()[0])
		}
	}
	if load5, ok := metricFamilies["node_load5"]; ok {
		if len(load5.GetMetric()) > 0 {
			parsed.System.Load5 = getMetricValue(load5.GetMetric()[0])
		}
	}
	if load15, ok := metricFamilies["node_load15"]; ok {
		if len(load15.GetMetric()) > 0 {
			parsed.System.Load15 = getMetricValue(load15.GetMetric()[0])
		}
	}

	// Extract boot time and calculate uptime
	if bootTime, ok := metricFamilies["node_boot_time_seconds"]; ok {
		if len(bootTime.GetMetric()) > 0 {
			parsed.System.BootTime = getMetricValue(bootTime.GetMetric()[0])
			// Calculate uptime if we have server time
			if parsed.ServerTime > 0 && parsed.System.BootTime > 0 {
				parsed.System.UptimeSeconds = parsed.ServerTime - parsed.System.BootTime
			}
		}
	}

	return parsed, nil
}

// getFilesystemLabels extracts device and mountpoint from filesystem metric labels
func getFilesystemLabels(metric *dto.Metric) (string, string) {
	var device, mountpoint string
	for _, label := range metric.GetLabel() {
		switch label.GetName() {
		case "device":
			device = label.GetValue()
		case "mountpoint":
			mountpoint = label.GetValue()
		}
	}
	return device, mountpoint
}

// getNetworkInterface extracts the network interface name from metric labels
func getNetworkInterface(metric *dto.Metric) string {
	for _, label := range metric.GetLabel() {
		if label.GetName() == "device" {
			return label.GetValue()
		}
	}
	return ""
}

// getMetricValue extracts the numeric value from a Prometheus metric
func getMetricValue(metric *dto.Metric) float64 {
	if metric.GetGauge() != nil {
		return metric.GetGauge().GetValue()
	}
	if metric.GetCounter() != nil {
		return metric.GetCounter().GetValue()
	}
	if metric.GetUntyped() != nil {
		return metric.GetUntyped().GetValue()
	}
	return 0
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
	metricsText, err := fetchMetricsFromNodeExporter(endpoint)
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

	// Parse metrics
	parsedMetrics, err := parsePrometheusMetrics(metricsText)
	if err != nil {
		errMsg := "Error parsing metrics: " + err.Error()
		response := nodeMetricsResponse{
			Available: true,
			Error:     &errMsg,
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
		return
	}

	// Success
	response := nodeMetricsResponse{
		Available: true,
		Metrics:   parsedMetrics,
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// filterMetricsForNode is no longer needed as parsing handles this
// Keeping as a no-op for compatibility if needed elsewhere
func filterMetricsForNode(metrics string, nodeID string) string {
	return strings.TrimSpace(metrics)
}
