package main

import (
	"context"
	"fmt"
	"strings"

	"github.com/docker/docker/api/types/filters"
	"github.com/docker/docker/api/types/swarm"
)

func queryServiceMetrics(ctx context.Context, identifier string) serviceMetricsResponse {
	cli, err := getCli()
	if err != nil {
		errMsg := "Error getting Docker client: " + err.Error()
		return serviceMetricsResponse{Available: false, Error: &errMsg}
	}

	service, err := resolveService(ctx, cli, identifier)
	if err != nil {
		errMsg := "Error fetching service: " + err.Error()
		return serviceMetricsResponse{Available: false, Error: &errMsg}
	}

	cadvisorService, err := findCAdvisorService(ctx, cli)
	if err != nil {
		errMsg := "Error finding cadvisor service: " + err.Error()
		return serviceMetricsResponse{Available: false, Error: &errMsg}
	}
	if cadvisorService == nil {
		msg := fmt.Sprintf("cAdvisor service not found. Deploy a global service with label '%s' to enable metrics.", cadvisorLabel)
		return serviceMetricsResponse{Available: false, Message: &msg}
	}

	taskFilters := filters.NewArgs()
	taskFilters.Add("service", service.ID)
	tasks, err := cli.TaskList(ctx, swarm.TaskListOptions{Filters: taskFilters})
	if err != nil {
		errMsg := "Error fetching service tasks: " + err.Error()
		return serviceMetricsResponse{Available: false, Error: &errMsg}
	}

	nodeIDs := make(map[string]bool)
	for _, task := range tasks {
		if task.Status.State == swarm.TaskStateRunning {
			nodeIDs[task.NodeID] = true
		}
	}
	if len(nodeIDs) == 0 {
		errMsg := "No running tasks found for service"
		return serviceMetricsResponse{Available: true, Error: &errMsg}
	}

	type nodeResult struct {
		metrics *ServiceMemoryMetrics
		err     error
	}
	results := make(chan nodeResult, len(nodeIDs))
	for nodeID := range nodeIDs {
		go func(nodeID string) {
			endpoint, err := getCAdvisorEndpoint(ctx, cli, cadvisorService, nodeID)
			if err != nil {
				results <- nodeResult{err: err}
				return
			}
			metricsText, err := fetchMetricsFromCAdvisor(ctx, endpoint)
			if err != nil {
				results <- nodeResult{err: err}
				return
			}
			parsed, err := parseCAdvisorMetrics(metricsText, service.ID, service.Spec.Name)
			results <- nodeResult{metrics: parsed, err: err}
		}(nodeID)
	}

	aggregated := ServiceMemoryMetrics{ContainerMetrics: []ContainerMemoryMetrics{}}
	nodesWithMetrics := 0
	for range nodeIDs {
		var result nodeResult
		select {
		case <-ctx.Done():
			errMsg := "Service metrics request cancelled: " + ctx.Err().Error()
			return serviceMetricsResponse{Available: false, Error: &errMsg}
		case result = <-results:
		}
		if result.err != nil || result.metrics == nil {
			continue
		}
		nodesWithMetrics++
		aggregated.TotalUsage += result.metrics.TotalUsage
		aggregated.TotalLimit += result.metrics.TotalLimit
		aggregated.ContainerMetrics = append(aggregated.ContainerMetrics, result.metrics.ContainerMetrics...)
		if result.metrics.ServerTime > aggregated.ServerTime {
			aggregated.ServerTime = result.metrics.ServerTime
		}
	}
	if err := ctx.Err(); err != nil {
		errMsg := "Service metrics request cancelled: " + err.Error()
		return serviceMetricsResponse{Available: false, Error: &errMsg}
	}
	if nodesWithMetrics == 0 {
		errMsg := "Failed to fetch metrics from any node"
		return serviceMetricsResponse{Available: false, Error: &errMsg}
	}

	containerCount := len(aggregated.ContainerMetrics)
	if containerCount > 0 {
		aggregated.AverageUsage = aggregated.TotalUsage / float64(containerCount)
		if aggregated.TotalLimit > 0 {
			aggregated.AveragePercent = (aggregated.TotalUsage / aggregated.TotalLimit) * 100
		}
	}
	return serviceMetricsResponse{Available: true, Metrics: &aggregated}
}

func queryNodeMetrics(ctx context.Context, identifier string) nodeMetricsResponse {
	cli, err := getCli()
	if err != nil {
		errMsg := "Error getting Docker client: " + err.Error()
		return nodeMetricsResponse{Available: false, Error: &errMsg}
	}

	service, err := findNodeExporterService(ctx, cli)
	if err != nil {
		errMsg := "Error finding node-exporter service: " + err.Error()
		return nodeMetricsResponse{Available: false, Error: &errMsg}
	}
	if service == nil {
		msg := fmt.Sprintf("Node-exporter service not found. Deploy a global service with label '%s' to enable metrics.", nodeExporterLabel)
		return nodeMetricsResponse{Available: false, Message: &msg}
	}

	endpoint, err := getNodeExporterEndpoint(ctx, cli, service, identifier)
	if err != nil {
		errMsg := "Error constructing node-exporter endpoint: " + err.Error()
		return nodeMetricsResponse{Available: false, Error: &errMsg}
	}
	metricsText, err := fetchMetricsFromNodeExporter(ctx, endpoint)
	if err != nil {
		errMsg := "Error fetching metrics from node-exporter: " + err.Error()
		return nodeMetricsResponse{Available: true, Error: &errMsg}
	}
	metrics, err := parsePrometheusMetrics(metricsText)
	if err != nil {
		errMsg := "Error parsing metrics: " + err.Error()
		return nodeMetricsResponse{Available: true, Error: &errMsg}
	}
	return nodeMetricsResponse{Available: true, Metrics: metrics}
}

func queryClusterMetrics(ctx context.Context) clusterMetricsResponse {
	cli, err := getCli()
	if err != nil {
		errMsg := "Error getting Docker client: " + err.Error()
		return clusterMetricsResponse{Available: false, Error: &errMsg}
	}

	nodes, err := cli.NodeList(ctx, swarm.NodeListOptions{})
	if err != nil {
		errMsg := "Error listing nodes: " + err.Error()
		return clusterMetricsResponse{Available: false, Error: &errMsg}
	}
	service, err := findNodeExporterService(ctx, cli)
	if err != nil {
		errMsg := "Error finding node-exporter service: " + err.Error()
		return clusterMetricsResponse{Available: false, Error: &errMsg}
	}
	if service == nil {
		msg := fmt.Sprintf("Node-exporter service not found. Deploy a global service with label '%s' to enable cluster metrics.", nodeExporterLabel)
		return clusterMetricsResponse{Available: false, Message: &msg}
	}

	taskFilters := filters.NewArgs()
	taskFilters.Add("service", service.ID)
	taskFilters.Add("desired-state", string(swarm.TaskStateRunning))
	tasks, err := cli.TaskList(ctx, swarm.TaskListOptions{Filters: taskFilters})
	if err != nil {
		errMsg := "Error listing tasks: " + err.Error()
		return clusterMetricsResponse{Available: false, Error: &errMsg}
	}
	if len(tasks) == 0 {
		msg := "Node-exporter service found, but no running tasks were detected. Ensure it's deployed as a global service."
		return clusterMetricsResponse{Available: false, Message: &msg}
	}

	type nodeResult struct {
		metrics *ParsedMetrics
		err     error
	}
	results := make(chan nodeResult, len(tasks))
	started := 0
	for _, task := range tasks {
		if task.Status.State != swarm.TaskStateRunning {
			continue
		}
		started++
		go func(task swarm.Task) {
			endpoint, err := getNodeExporterEndpoint(ctx, cli, service, task.NodeID)
			if err != nil {
				results <- nodeResult{err: err}
				return
			}
			metricsText, err := fetchMetricsFromNodeExporter(ctx, endpoint)
			if err != nil {
				results <- nodeResult{err: err}
				return
			}
			parsed, err := parsePrometheusMetrics(metricsText)
			results <- nodeResult{metrics: parsed, err: err}
		}(task)
	}

	var totalCPU int
	var totalMemory, availableMemory float64
	var totalDisk, availableDisk float64
	nodesWithMetrics := 0
	for i := 0; i < started; i++ {
		var result nodeResult
		select {
		case <-ctx.Done():
			errMsg := "Cluster metrics request cancelled: " + ctx.Err().Error()
			return clusterMetricsResponse{Available: false, Error: &errMsg, NodeCount: len(nodes)}
		case result = <-results:
		}
		if result.err != nil || result.metrics == nil {
			continue
		}
		nodesWithMetrics++
		totalCPU += result.metrics.System.NumCPUs
		totalMemory += result.metrics.Memory.Total
		availableMemory += result.metrics.Memory.Available

		foundRoot := false
		for _, filesystem := range result.metrics.Filesystem {
			if filesystem.Mountpoint == "/" {
				totalDisk += filesystem.Size
				availableDisk += filesystem.Available
				foundRoot = true
				break
			}
		}
		if !foundRoot && len(result.metrics.Filesystem) > 0 {
			totalDisk += result.metrics.Filesystem[0].Size
			availableDisk += result.metrics.Filesystem[0].Available
		}
	}
	if err := ctx.Err(); err != nil {
		errMsg := "Cluster metrics request cancelled: " + err.Error()
		return clusterMetricsResponse{Available: false, Error: &errMsg, NodeCount: len(nodes)}
	}

	if nodesWithMetrics == 0 && started > 0 {
		errMsg := "Failed to fetch metrics from node exporter instances. Check network connectivity."
		return clusterMetricsResponse{
			Available: true,
			Error:     &errMsg,
			NodeCount: len(nodes),
		}
	}

	usedMemory := totalMemory - availableMemory
	memoryPercent := 0.0
	if totalMemory > 0 {
		memoryPercent = (usedMemory / totalMemory) * 100
	}
	usedDisk := totalDisk - availableDisk
	diskPercent := 0.0
	if totalDisk > 0 {
		diskPercent = (usedDisk / totalDisk) * 100
	}

	return clusterMetricsResponse{
		Available:      true,
		TotalCPU:       totalCPU,
		TotalMemory:    totalMemory,
		UsedMemory:     usedMemory,
		MemoryPercent:  memoryPercent,
		TotalDisk:      totalDisk,
		UsedDisk:       usedDisk,
		DiskPercent:    diskPercent,
		NodeCount:      len(nodes),
		NodesAvailable: nodesWithMetrics,
	}
}

func queryTaskMetrics(ctx context.Context, identifier string) taskMetricsResponse {
	cli, err := getCli()
	if err != nil {
		errMsg := fmt.Sprintf("Failed to get Docker client: %v", err)
		return taskMetricsResponse{Available: false, Error: &errMsg}
	}

	task, _, err := cli.TaskInspectWithRaw(ctx, identifier)
	if err != nil {
		errMsg := fmt.Sprintf("Failed to inspect task: %v", err)
		return taskMetricsResponse{Available: false, Error: &errMsg}
	}
	if task.Status.State != swarm.TaskStateRunning {
		msg := "Task is not running"
		return taskMetricsResponse{Available: false, Message: &msg}
	}

	cadvisorService, err := findCAdvisorService(ctx, cli)
	if err != nil {
		errMsg := fmt.Sprintf("Failed to find cAdvisor service: %v", err)
		return taskMetricsResponse{Available: false, Error: &errMsg}
	}
	if cadvisorService == nil {
		msg := fmt.Sprintf("cAdvisor not found. Deploy with label '%s'", cadvisorLabel)
		return taskMetricsResponse{Available: false, Message: &msg}
	}

	endpoint, err := getCAdvisorEndpoint(ctx, cli, cadvisorService, task.NodeID)
	if err != nil {
		errMsg := fmt.Sprintf("Failed to get cAdvisor endpoint: %v", err)
		return taskMetricsResponse{Available: false, Error: &errMsg}
	}
	metricsURL := endpoint
	if !strings.HasPrefix(endpoint, "http://") && !strings.HasPrefix(endpoint, "https://") {
		metricsURL = fmt.Sprintf("http://%s/metrics", endpoint)
	}
	metricsText, err := fetchMetricsFromCAdvisor(ctx, metricsURL)
	if err != nil {
		errMsg := fmt.Sprintf("Failed to fetch metrics: %v", err)
		return taskMetricsResponse{Available: false, Error: &errMsg}
	}

	serviceName := ""
	if task.ServiceID != "" {
		serviceFilters := filters.NewArgs()
		serviceFilters.Add("id", task.ServiceID)
		if services, serviceErr := cli.ServiceList(ctx, swarm.ServiceListOptions{Filters: serviceFilters}); serviceErr == nil && len(services) > 0 {
			serviceName = services[0].Spec.Name
		}
	}
	serviceMetrics, err := parseCAdvisorMetrics(metricsText, task.ServiceID, serviceName)
	if err != nil {
		errMsg := fmt.Sprintf("Failed to parse metrics: %v", err)
		return taskMetricsResponse{Available: false, Error: &errMsg}
	}

	for i := range serviceMetrics.ContainerMetrics {
		container := &serviceMetrics.ContainerMetrics[i]
		if container.TaskID == task.ID {
			return taskMetricsResponse{Available: true, Metrics: container}
		}
	}
	msg := "Metrics not available for this task"
	return taskMetricsResponse{Available: false, Message: &msg}
}
