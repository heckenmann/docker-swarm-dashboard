package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/docker/docker/api/types/filters"
	"github.com/docker/docker/api/types/swarm"
	"github.com/gorilla/mux"
)

// taskMetricsResponse represents the response structure for task metrics endpoint
type taskMetricsResponse struct {
	Available bool                    `json:"available"`
	Metrics   *ContainerMemoryMetrics `json:"metrics,omitempty"`
	Error     *string                 `json:"error,omitempty"`
	Message   *string                 `json:"message,omitempty"`
}

// taskMetricsHandler returns memory and CPU metrics for a specific task from cAdvisor
func taskMetricsHandler(w http.ResponseWriter, r *http.Request) {
	cli := getCli()
	vars := mux.Vars(r)
	taskID := vars["id"]

	w.Header().Set("Content-Type", "application/json")

	// Get task details
	task, _, err := cli.TaskInspectWithRaw(context.Background(), taskID)
	if err != nil {
		errMsg := fmt.Sprintf("Failed to inspect task: %v", err)
		if err := json.NewEncoder(w).Encode(taskMetricsResponse{
			Available: false,
			Error:     &errMsg,
		}); err != nil {
			http.Error(w, fmt.Sprintf("encoding response failed: %v", err), http.StatusInternalServerError)
		}
		return
	}

	// Only provide metrics for running tasks
	if task.Status.State != swarm.TaskStateRunning {
		msg := "Task is not running"
		if err := json.NewEncoder(w).Encode(taskMetricsResponse{
			Available: false,
			Message:   &msg,
		}); err != nil {
			http.Error(w, fmt.Sprintf("encoding response failed: %v", err), http.StatusInternalServerError)
		}
		return
	}

	// Find cAdvisor service
	cadvisorService, err := findCAdvisorService(cli)
	if err != nil {
		errMsg := fmt.Sprintf("Failed to find cAdvisor service: %v", err)
		if err := json.NewEncoder(w).Encode(taskMetricsResponse{
			Available: false,
			Error:     &errMsg,
		}); err != nil {
			http.Error(w, fmt.Sprintf("encoding response failed: %v", err), http.StatusInternalServerError)
		}
		return
	}

	if cadvisorService == nil {
		msg := fmt.Sprintf("cAdvisor not found. Deploy with label '%s'", cadvisorLabel)
		if err := json.NewEncoder(w).Encode(taskMetricsResponse{
			Available: false,
			Message:   &msg,
		}); err != nil {
			http.Error(w, fmt.Sprintf("encoding response failed: %v", err), http.StatusInternalServerError)
		}
		return
	}

	// Get cAdvisor endpoint on the same node as the task
	endpoint, err := getCAdvisorEndpoint(cli, cadvisorService, task.NodeID)
	if err != nil {
		errMsg := fmt.Sprintf("Failed to get cAdvisor endpoint: %v", err)
		if err := json.NewEncoder(w).Encode(taskMetricsResponse{
			Available: false,
			Error:     &errMsg,
		}); err != nil {
			http.Error(w, fmt.Sprintf("encoding response failed: %v", err), http.StatusInternalServerError)
		}
		return
	}

	// Fetch metrics from cAdvisor. `endpoint` may already be a full URL
	metricsURL := endpoint
	if !strings.HasPrefix(endpoint, "http://") && !strings.HasPrefix(endpoint, "https://") {
		metricsURL = fmt.Sprintf("http://%s/metrics", endpoint)
	}
	metricsText, err := fetchMetricsFromCAdvisor(metricsURL)
	if err != nil {
		errMsg := fmt.Sprintf("Failed to fetch metrics: %v", err)
		if err := json.NewEncoder(w).Encode(taskMetricsResponse{
			Available: false,
			Error:     &errMsg,
		}); err != nil {
			http.Error(w, fmt.Sprintf("encoding response failed: %v", err), http.StatusInternalServerError)
		}
		return
	}

	// Try to determine the service name (helps parseCAdvisorMetrics filter by service)
	serviceName := ""
	if task.ServiceID != "" {
		f := filters.NewArgs()
		f.Add("id", task.ServiceID)
		if svcs, serr := cli.ServiceList(context.Background(), swarm.ServiceListOptions{Filters: f}); serr == nil && len(svcs) > 0 {
			serviceName = svcs[0].Spec.Name
		}
	}

	// Parse the metrics
	serviceMetrics, err := parseCAdvisorMetrics(metricsText, task.ServiceID, serviceName)
	if err != nil {
		errMsg := fmt.Sprintf("Failed to parse metrics: %v", err)
		if err := json.NewEncoder(w).Encode(taskMetricsResponse{
			Available: false,
			Error:     &errMsg,
		}); err != nil {
			http.Error(w, fmt.Sprintf("encoding response failed: %v", err), http.StatusInternalServerError)
		}
		return
	}

	// Find the specific container metrics for this task
	var taskMetrics *ContainerMemoryMetrics
	for i := range serviceMetrics.ContainerMetrics {
		container := &serviceMetrics.ContainerMetrics[i]
		// Match by task ID or container name
		if container.TaskID == taskID {
			taskMetrics = container
			break
		}
	}

	if taskMetrics == nil {
		msg := "Metrics not available for this task"
		if err := json.NewEncoder(w).Encode(taskMetricsResponse{
			Available: false,
			Message:   &msg,
		}); err != nil {
			http.Error(w, fmt.Sprintf("encoding response failed: %v", err), http.StatusInternalServerError)
		}
		return
	}

	if err := json.NewEncoder(w).Encode(taskMetricsResponse{
		Available: true,
		Metrics:   taskMetrics,
	}); err != nil {
		http.Error(w, fmt.Sprintf("encoding response failed: %v", err), http.StatusInternalServerError)
	}
}
