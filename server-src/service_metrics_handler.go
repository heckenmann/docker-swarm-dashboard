package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/docker/docker/api/types/filters"
	"github.com/docker/docker/api/types/swarm"
	"github.com/docker/docker/client"
	"github.com/gorilla/mux"
	dto "github.com/prometheus/client_model/go"
	"github.com/prometheus/common/expfmt"
	"github.com/prometheus/common/model"
)

// ContainerMemoryMetrics represents memory metrics for a single container/task
type ContainerMemoryMetrics struct {
	ContainerID      string  `json:"containerId"`
	TaskID           string  `json:"taskId"`
	TaskName         string  `json:"taskName"`
	Usage            float64 `json:"usage"`
	WorkingSet       float64 `json:"workingSet"`
	MemoryCache      float64 `json:"memoryCache"` // File-backed / cache pages
	Limit            float64 `json:"limit"`
	UsagePercent     float64 `json:"usagePercent"`
	CPUUsage         float64 `json:"cpuUsage"`         // Total CPU time in seconds
	CPUUserSeconds   float64 `json:"cpuUserSeconds"`   // User-space CPU time in seconds
	CPUSystemSeconds float64 `json:"cpuSystemSeconds"` // Kernel-space CPU time in seconds
	CPUPercent       float64 `json:"cpuPercent"`       // CPU usage as % of quota
	NetworkRxBytes   float64 `json:"networkRxBytes"`   // Total received bytes across all interfaces
	NetworkTxBytes   float64 `json:"networkTxBytes"`   // Total transmitted bytes across all interfaces
	FSUsage          float64 `json:"fsUsage"`          // Container filesystem usage in bytes
	FSLimit          float64 `json:"fsLimit"`          // Container filesystem limit in bytes
	ServerTime       float64 `json:"serverTime"`       // Unix timestamp
}

// ServiceMemoryMetrics represents aggregated memory metrics for a service
type ServiceMemoryMetrics struct {
	TotalUsage       float64                  `json:"totalUsage"`
	TotalLimit       float64                  `json:"totalLimit"`
	AverageUsage     float64                  `json:"averageUsage"`
	AveragePercent   float64                  `json:"averagePercent"`
	ContainerMetrics []ContainerMemoryMetrics `json:"containers"`
	ServerTime       float64                  `json:"serverTime"`
}

// serviceMetricsResponse represents the response structure for service metrics endpoint
type serviceMetricsResponse struct {
	Available bool                  `json:"available"`
	Metrics   *ServiceMemoryMetrics `json:"metrics,omitempty"`
	Error     *string               `json:"error,omitempty"`
	Message   *string               `json:"message,omitempty"`
}

// getCAdvisorEndpoint returns the endpoint URL for the cadvisor service
// It prefers the task's overlay network address so the dashboard can query the cadvisor
// instance running on the same node as the target service task.
func getCAdvisorEndpoint(cli *client.Client, service *swarm.Service, nodeID string) (string, error) {
	return resolveServiceEndpoint(cli, service, nodeID, 8080)
}

// fetchMetricsFromCAdvisor fetches metrics from the cadvisor endpoint
func fetchMetricsFromCAdvisor(url string) (string, error) {
	resp, err := metricsHttpClient.Get(url)
	if err != nil {
		return "", err
	}
	defer func() { _ = resp.Body.Close() }()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("cadvisor returned status %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	return string(body), nil
}

// parseCAdvisorMetrics parses Prometheus text format and extracts container memory metrics for a specific service
func parseCAdvisorMetrics(metricsText string, serviceID string, serviceName string) (*ServiceMemoryMetrics, error) {
	parser := expfmt.NewTextParser(model.LegacyValidation)
	metricFamilies, err := parser.TextToMetricFamilies(strings.NewReader(metricsText))
	if err != nil {
		// Handle malformed data gracefully by returning empty metrics instead of error
		return &ServiceMemoryMetrics{
			ContainerMetrics: []ContainerMemoryMetrics{},
		}, nil
	}

	containerMetrics := make(map[string]*ContainerMemoryMetrics)
	var serverTime float64

	// Extract server time if available
	if timeMetric, ok := metricFamilies["node_time_seconds"]; ok {
		if len(timeMetric.GetMetric()) > 0 {
			serverTime = getMetricValue(timeMetric.GetMetric()[0])
		}
	}

	// Extract memory usage
	if memUsage, ok := metricFamilies["container_memory_usage_bytes"]; ok {
		for _, metric := range memUsage.GetMetric() {
			containerID, taskID, taskName, svcName := extractSwarmLabels(metric)
			// Filter by service name or service ID in container labels
			if svcName != serviceName && !strings.Contains(containerID, serviceID) {
				continue
			}
			// Skip empty containers (these are pod-level aggregates)
			if containerID == "" {
				continue
			}

			key := containerID
			if containerMetrics[key] == nil {
				containerMetrics[key] = &ContainerMemoryMetrics{
					ContainerID: containerID,
					TaskID:      taskID,
					TaskName:    taskName,
				}
			}
			containerMetrics[key].Usage = getMetricValue(metric)
		}
	}

	// Extract working set memory
	if memWorkingSet, ok := metricFamilies["container_memory_working_set_bytes"]; ok {
		for _, metric := range memWorkingSet.GetMetric() {
			containerID, taskID, taskName, svcName := extractSwarmLabels(metric)
			if svcName != serviceName && !strings.Contains(containerID, serviceID) {
				continue
			}
			if containerID == "" {
				continue
			}

			key := containerID
			if containerMetrics[key] == nil {
				containerMetrics[key] = &ContainerMemoryMetrics{
					ContainerID: containerID,
					TaskID:      taskID,
					TaskName:    taskName,
				}
			}
			containerMetrics[key].WorkingSet = getMetricValue(metric)
		}
	}

	// Extract memory limits
	if memLimit, ok := metricFamilies["container_spec_memory_limit_bytes"]; ok {
		for _, metric := range memLimit.GetMetric() {
			containerID, taskID, taskName, svcName := extractSwarmLabels(metric)
			if svcName != serviceName && !strings.Contains(containerID, serviceID) {
				continue
			}
			if containerID == "" {
				continue
			}

			key := containerID
			if containerMetrics[key] == nil {
				containerMetrics[key] = &ContainerMemoryMetrics{
					ContainerID: containerID,
					TaskID:      taskID,
					TaskName:    taskName,
				}
			}
			limit := getMetricValue(metric)
			// cAdvisor may set extremely large values when no limit is configured
			// Treat values >= 1 PiB as "no limit"
			if limit < onePiBInBytes {
				containerMetrics[key].Limit = limit
			}
		}
	}

	// Extract CPU usage
	if cpuUsage, ok := metricFamilies["container_cpu_usage_seconds_total"]; ok {
		for _, metric := range cpuUsage.GetMetric() {
			containerID, taskID, taskName, svcName := extractSwarmLabels(metric)
			if svcName != serviceName && !strings.Contains(containerID, serviceID) {
				continue
			}
			if containerID == "" {
				continue
			}

			key := containerID
			if containerMetrics[key] == nil {
				containerMetrics[key] = &ContainerMemoryMetrics{
					ContainerID: containerID,
					TaskID:      taskID,
					TaskName:    taskName,
				}
			}
			containerMetrics[key].CPUUsage = getMetricValue(metric)
		}
	}

	// Extract CPU quota (for calculating CPU percent)
	cpuQuota := make(map[string]float64)
	if quota, ok := metricFamilies["container_spec_cpu_quota"]; ok {
		for _, metric := range quota.GetMetric() {
			containerID, _, _, svcName := extractSwarmLabels(metric)
			if svcName != serviceName && !strings.Contains(containerID, serviceID) {
				continue
			}
			if containerID == "" {
				continue
			}
			cpuQuota[containerID] = getMetricValue(metric)
		}
	}

	// Extract CPU period (for calculating CPU percent)
	cpuPeriod := make(map[string]float64)
	if period, ok := metricFamilies["container_spec_cpu_period"]; ok {
		for _, metric := range period.GetMetric() {
			containerID, _, _, svcName := extractSwarmLabels(metric)
			if svcName != serviceName && !strings.Contains(containerID, serviceID) {
				continue
			}
			if containerID == "" {
				continue
			}
			cpuPeriod[containerID] = getMetricValue(metric)
		}
	}

	// Extract memory cache (file-backed pages)
	if memCache, ok := metricFamilies["container_memory_cache"]; ok {
		for _, metric := range memCache.GetMetric() {
			containerID, taskID, taskName, svcName := extractSwarmLabels(metric)
			if svcName != serviceName && !strings.Contains(containerID, serviceID) {
				continue
			}
			if containerID == "" {
				continue
			}
			key := containerID
			if containerMetrics[key] == nil {
				containerMetrics[key] = &ContainerMemoryMetrics{
					ContainerID: containerID,
					TaskID:      taskID,
					TaskName:    taskName,
				}
			}
			containerMetrics[key].MemoryCache = getMetricValue(metric)
		}
	}

	// Extract container network bytes received (sum across all interfaces)
	if netRx, ok := metricFamilies["container_network_receive_bytes_total"]; ok {
		for _, metric := range netRx.GetMetric() {
			containerID, taskID, taskName, svcName := extractSwarmLabels(metric)
			if svcName != serviceName && !strings.Contains(containerID, serviceID) {
				continue
			}
			if containerID == "" {
				continue
			}
			key := containerID
			if containerMetrics[key] == nil {
				containerMetrics[key] = &ContainerMemoryMetrics{
					ContainerID: containerID,
					TaskID:      taskID,
					TaskName:    taskName,
				}
			}
			containerMetrics[key].NetworkRxBytes += getMetricValue(metric)
		}
	}

	// Extract container network bytes transmitted (sum across all interfaces)
	if netTx, ok := metricFamilies["container_network_transmit_bytes_total"]; ok {
		for _, metric := range netTx.GetMetric() {
			containerID, taskID, taskName, svcName := extractSwarmLabels(metric)
			if svcName != serviceName && !strings.Contains(containerID, serviceID) {
				continue
			}
			if containerID == "" {
				continue
			}
			key := containerID
			if containerMetrics[key] == nil {
				containerMetrics[key] = &ContainerMemoryMetrics{
					ContainerID: containerID,
					TaskID:      taskID,
					TaskName:    taskName,
				}
			}
			containerMetrics[key].NetworkTxBytes += getMetricValue(metric)
		}
	}

	// Extract container CPU user time
	if cpuUser, ok := metricFamilies["container_cpu_user_seconds_total"]; ok {
		for _, metric := range cpuUser.GetMetric() {
			containerID, taskID, taskName, svcName := extractSwarmLabels(metric)
			if svcName != serviceName && !strings.Contains(containerID, serviceID) {
				continue
			}
			if containerID == "" {
				continue
			}
			key := containerID
			if containerMetrics[key] == nil {
				containerMetrics[key] = &ContainerMemoryMetrics{
					ContainerID: containerID,
					TaskID:      taskID,
					TaskName:    taskName,
				}
			}
			containerMetrics[key].CPUUserSeconds += getMetricValue(metric)
		}
	}

	// Extract container CPU system time
	if cpuSys, ok := metricFamilies["container_cpu_system_seconds_total"]; ok {
		for _, metric := range cpuSys.GetMetric() {
			containerID, taskID, taskName, svcName := extractSwarmLabels(metric)
			if svcName != serviceName && !strings.Contains(containerID, serviceID) {
				continue
			}
			if containerID == "" {
				continue
			}
			key := containerID
			if containerMetrics[key] == nil {
				containerMetrics[key] = &ContainerMemoryMetrics{
					ContainerID: containerID,
					TaskID:      taskID,
					TaskName:    taskName,
				}
			}
			containerMetrics[key].CPUSystemSeconds += getMetricValue(metric)
		}
	}

	// Extract container filesystem usage (sum all devices per container)
	if fsUsage, ok := metricFamilies["container_fs_usage_bytes"]; ok {
		for _, metric := range fsUsage.GetMetric() {
			containerID, taskID, taskName, svcName := extractSwarmLabels(metric)
			if svcName != serviceName && !strings.Contains(containerID, serviceID) {
				continue
			}
			if containerID == "" {
				continue
			}
			key := containerID
			if containerMetrics[key] == nil {
				containerMetrics[key] = &ContainerMemoryMetrics{
					ContainerID: containerID,
					TaskID:      taskID,
					TaskName:    taskName,
				}
			}
			containerMetrics[key].FSUsage += getMetricValue(metric)
		}
	}

	// Extract container filesystem limit (sum all devices per container)
	if fsLimit, ok := metricFamilies["container_fs_limit_bytes"]; ok {
		for _, metric := range fsLimit.GetMetric() {
			containerID, taskID, taskName, svcName := extractSwarmLabels(metric)
			if svcName != serviceName && !strings.Contains(containerID, serviceID) {
				continue
			}
			if containerID == "" {
				continue
			}
			key := containerID
			if containerMetrics[key] == nil {
				containerMetrics[key] = &ContainerMemoryMetrics{
					ContainerID: containerID,
					TaskID:      taskID,
					TaskName:    taskName,
				}
			}
			containerMetrics[key].FSLimit += getMetricValue(metric)
		}
	}

	// Calculate CPU percent from quota/period
	for containerID, cm := range containerMetrics {
		if quota, hasQuota := cpuQuota[containerID]; hasQuota {
			if period, hasPeriod := cpuPeriod[containerID]; hasPeriod && period > 0 {
				// CPU percent = (quota / period) * 100
				// This represents the percentage of a single CPU core allocated
				cm.CPUPercent = (quota / period) * 100
			}
		}
	}

	// Calculate usage percentages and aggregate totals
	var totalUsage, totalLimit, usageWithLimit float64
	var containerCount int
	containers := make([]ContainerMemoryMetrics, 0, len(containerMetrics))

	for _, cm := range containerMetrics {
		if cm.Limit > 0 {
			cm.UsagePercent = (cm.Usage / cm.Limit) * 100
		}
		cm.ServerTime = serverTime

		totalUsage += cm.Usage
		if cm.Limit > 0 {
			totalLimit += cm.Limit
			usageWithLimit += cm.Usage
		}
		containerCount++
		containers = append(containers, *cm)
	}

	avgUsage := float64(0)
	avgPercent := float64(0)
	if containerCount > 0 {
		avgUsage = totalUsage / float64(containerCount)
		if totalLimit > 0 {
			avgPercent = (usageWithLimit / totalLimit) * 100
		}
	}

	return &ServiceMemoryMetrics{
		TotalUsage:       totalUsage,
		TotalLimit:       totalLimit,
		AverageUsage:     avgUsage,
		AveragePercent:   avgPercent,
		ContainerMetrics: containers,
		ServerTime:       serverTime,
	}, nil
}

// extractSwarmLabels extracts Swarm-specific labels from a metric
func extractSwarmLabels(metric *dto.Metric) (containerID, taskID, taskName, serviceName string) {
	for _, label := range metric.GetLabel() {
		switch label.GetName() {
		case "id":
			containerID = label.GetValue()
		case "container_label_com_docker_swarm_task_id":
			taskID = label.GetValue()
		case "container_label_com_docker_swarm_task_name":
			taskName = label.GetValue()
		case "container_label_com_docker_swarm_service_name":
			serviceName = label.GetValue()
		}
	}
	return
}

// serviceMetricsHandler handles requests for service metrics from cadvisor
func serviceMetricsHandler(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	serviceID := params["id"]

	if serviceID == "" {
		http.Error(w, "Service ID is required", http.StatusBadRequest)
		return
	}

	cli := getCli()

	// Get service details to find the service name and tasks
	servicesFilter := filters.NewArgs()
	servicesFilter.Add("id", serviceID)
	services, err := cli.ServiceList(context.Background(), swarm.ServiceListOptions{Filters: servicesFilter})
	if err != nil {
		errMsg := "Error fetching service: " + err.Error()
		response := serviceMetricsResponse{
			Available: false,
			Error:     &errMsg,
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(response)
		return
	}

	if len(services) == 0 {
		errMsg := "Service not found"
		response := serviceMetricsResponse{
			Available: false,
			Error:     &errMsg,
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(response)
		return
	}

	service := services[0]
	serviceName := service.Spec.Name

	// Find the cadvisor service
	cadvisorService, err := findCAdvisorService(cli)
	if err != nil {
		errMsg := "Error finding cadvisor service: " + err.Error()
		response := serviceMetricsResponse{
			Available: false,
			Error:     &errMsg,
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(response)
		return
	}

	if cadvisorService == nil {
		// cadvisor service not found
		msg := fmt.Sprintf("cAdvisor service not found. Deploy a global service with label '%s' to enable metrics.", cadvisorLabel)
		response := serviceMetricsResponse{
			Available: false,
			Message:   &msg,
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(response)
		return
	}

	// Get tasks for this service to find which nodes they run on
	tasksFilter := filters.NewArgs()
	tasksFilter.Add("service", serviceID)
	tasks, err := cli.TaskList(context.Background(), swarm.TaskListOptions{Filters: tasksFilter})
	if err != nil {
		errMsg := "Error fetching service tasks: " + err.Error()
		response := serviceMetricsResponse{
			Available: false,
			Error:     &errMsg,
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(response)
		return
	}

	// Collect metrics from all nodes where service tasks are running
	nodeIDs := make(map[string]bool)
	for _, task := range tasks {
		if task.Status.State == swarm.TaskStateRunning {
			nodeIDs[task.NodeID] = true
		}
	}

	if len(nodeIDs) == 0 {
		errMsg := "No running tasks found for service"
		response := serviceMetricsResponse{
			Available: true,
			Error:     &errMsg,
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(response)
		return
	}

	// Fetch metrics from all relevant nodes in parallel
	type nodeResult struct {
		metrics *ServiceMemoryMetrics
		err     error
	}
	resultsChan := make(chan nodeResult, len(nodeIDs))

	for nID := range nodeIDs {
		go func(nodeID string) {
			endpoint, err := getCAdvisorEndpoint(cli, cadvisorService, nodeID)
			if err != nil {
				resultsChan <- nodeResult{err: err}
				return
			}
			metricsText, err := fetchMetricsFromCAdvisor(endpoint)
			if err != nil {
				resultsChan <- nodeResult{err: err}
				return
			}
			parsed, err := parseCAdvisorMetrics(metricsText, serviceID, serviceName)
			resultsChan <- nodeResult{metrics: parsed, err: err}
		}(nID)
	}

	// Aggregate results from all nodes
	var aggregatedMetrics ServiceMemoryMetrics
	aggregatedMetrics.ContainerMetrics = []ContainerMemoryMetrics{}
	nodesWithMetrics := 0

	for i := 0; i < len(nodeIDs); i++ {
		res := <-resultsChan
		if res.err == nil && res.metrics != nil {
			nodesWithMetrics++
			aggregatedMetrics.TotalUsage += res.metrics.TotalUsage
			aggregatedMetrics.TotalLimit += res.metrics.TotalLimit
			aggregatedMetrics.ContainerMetrics = append(aggregatedMetrics.ContainerMetrics, res.metrics.ContainerMetrics...)
			if res.metrics.ServerTime > aggregatedMetrics.ServerTime {
				aggregatedMetrics.ServerTime = res.metrics.ServerTime
			}
		}
	}

	if nodesWithMetrics == 0 {
		errMsg := "Failed to fetch metrics from any node"
		// If we couldn't get any metrics, we consider it not available for this request
		response := serviceMetricsResponse{
			Available: false,
			Error:     &errMsg,
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(response)
		return
	}

	// Recalculate averages
	containerCount := len(aggregatedMetrics.ContainerMetrics)
	if containerCount > 0 {
		aggregatedMetrics.AverageUsage = aggregatedMetrics.TotalUsage / float64(containerCount)
		if aggregatedMetrics.TotalLimit > 0 {
			aggregatedMetrics.AveragePercent = (aggregatedMetrics.TotalUsage / aggregatedMetrics.TotalLimit) * 100
		}
	}

	// Success
	response := serviceMetricsResponse{
		Available: true,
		Metrics:   &aggregatedMetrics,
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(response)
}
