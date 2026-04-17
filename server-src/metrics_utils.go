package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/docker/docker/api/types/filters"
	"github.com/docker/docker/api/types/swarm"
	"github.com/docker/docker/client"
)

var (
	nodeExporterLabel = ""
	cadvisorLabel     = ""

	// Shared HTTP client with timeout for metrics fetching
	metricsHttpClient = &http.Client{
		Timeout: 5 * time.Second,
	}
)

const (
	// onePiBInBytes represents 1 PiB (pebibyte) in bytes.
	// cAdvisor may set extremely large values (e.g., 2^64-1) when no memory limit is configured.
	// We treat values >= 1 PiB as "no limit" to distinguish from actual configured limits.
	onePiBInBytes = 1125899906842624
)

func init() {
	loadMetricsLabelsFromEnv()
}

func loadMetricsLabelsFromEnv() {
	if label, labelSet := os.LookupEnv("DSD_NODE_EXPORTER_LABEL"); labelSet {
		nodeExporterLabel = label
	} else {
		nodeExporterLabel = "dsd.node-exporter"
	}

	if label, labelSet := os.LookupEnv("DSD_CADVISOR_LABEL"); labelSet {
		cadvisorLabel = label
	} else {
		cadvisorLabel = "dsd.cadvisor"
	}
}

// findNodeExporterService discovers the node-exporter service by label
func findNodeExporterService(cli *client.Client) (*swarm.Service, error) {
	services, err := cli.ServiceList(context.Background(), swarm.ServiceListOptions{})
	if err != nil {
		return nil, err
	}

	for _, service := range services {
		if service.Spec.Labels != nil {
			if _, hasLabel := service.Spec.Labels[nodeExporterLabel]; hasLabel {
				return &service, nil
			}
		}
	}
	return nil, nil
}

// findCAdvisorService discovers the cadvisor service by label
func findCAdvisorService(cli *client.Client) (*swarm.Service, error) {
	services, err := cli.ServiceList(context.Background(), swarm.ServiceListOptions{})
	if err != nil {
		return nil, err
	}

	for _, service := range services {
		if service.Spec.Labels != nil {
			if _, hasLabel := service.Spec.Labels[cadvisorLabel]; hasLabel {
				return &service, nil
			}
		}
	}
	return nil, nil
}

// getDashboardNetworks identifies the network IDs the current dashboard container is attached to.
func getDashboardNetworks(cli *client.Client) map[string]bool {
	networks := make(map[string]bool)
	hostname, err := os.Hostname()
	if err != nil {
		return networks
	}

	container, err := cli.ContainerInspect(context.Background(), hostname)
	if err != nil {
		// If we can't inspect the container, we might not be in a container or lack permissions.
		// We'll return an empty map which will cause the endpoint resolver to fall back to the first IP.
		return networks
	}

	for _, net := range container.NetworkSettings.Networks {
		networks[net.NetworkID] = true
	}
	return networks
}

// resolveServiceEndpoint finds the best IP/port for a service task on a specific node.
// It prefers networks that the dashboard is also attached to.
func resolveServiceEndpoint(cli *client.Client, service *swarm.Service, nodeID string, defaultPort int) (string, error) {
	if service == nil {
		return "", fmt.Errorf("service is nil")
	}

	// Determine port to use: prefer target port if configured
	port := defaultPort
	foundPort := false
	for _, p := range service.Endpoint.Ports {
		if int(p.TargetPort) == defaultPort || int(p.PublishedPort) == defaultPort {
			if int(p.TargetPort) != 0 {
				port = int(p.TargetPort)
			} else {
				port = int(p.PublishedPort)
			}
			foundPort = true
			break
		}
	}

	// If the exact default port wasn't found, but some port is configured,
	// use the first available port as a fallback
	if !foundPort && len(service.Endpoint.Ports) > 0 {
		if int(service.Endpoint.Ports[0].TargetPort) != 0 {
			port = int(service.Endpoint.Ports[0].TargetPort)
		} else if int(service.Endpoint.Ports[0].PublishedPort) != 0 {
			port = int(service.Endpoint.Ports[0].PublishedPort)
		}
	}

	serviceID := service.ID
	if serviceID == "" && service.Spec.Name != "" {
		return fmt.Sprintf("http://%s:%d/metrics", service.Spec.Name, port), nil
	}

	f := filters.NewArgs()
	f.Add("service", serviceID)
	if nodeID != "" {
		f.Add("node", nodeID)
	}

	tasks, err := cli.TaskList(context.Background(), swarm.TaskListOptions{Filters: f})
	if err != nil {
		if service.Spec.Name != "" {
			return fmt.Sprintf("http://%s:%d/metrics", service.Spec.Name, port), nil
		}
		return "", fmt.Errorf("failed to list tasks: %w", err)
	}

	dashboardNets := getDashboardNetworks(cli)

	var fallbackAddr string

	for _, t := range tasks {
		if t.Status.State != swarm.TaskStateRunning {
			continue
		}
		for _, na := range t.NetworksAttachments {
			if len(na.Addresses) > 0 {
				addr := na.Addresses[0]
				if strings.Contains(addr, "/") {
					addr = strings.SplitN(addr, "/", 2)[0]
				}

				// If this network is shared with the dashboard, use it immediately
				if dashboardNets[na.Network.ID] {
					return fmt.Sprintf("http://%s:%d/metrics", addr, port), nil
				}

				// Otherwise keep as fallback
				if fallbackAddr == "" {
					fallbackAddr = addr
				}
			}
		}
	}

	if fallbackAddr != "" {
		return fmt.Sprintf("http://%s:%d/metrics", fallbackAddr, port), nil
	}

	if service.Spec.Name != "" {
		return fmt.Sprintf("http://%s:%d/metrics", service.Spec.Name, port), nil
	}

	return "", fmt.Errorf("no task address found for service %s on node %s", serviceID, nodeID)
}
