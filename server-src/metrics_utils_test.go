package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/docker/docker/api/types/swarm"
)

func TestGetDashboardNetworks(t *testing.T) {
	cli := getCli()

	// This will likely return empty map in test environment unless mocked
	nets := getDashboardNetworks(cli)
	if nets == nil {
		t.Error("expected non-nil map")
	}
}

func TestResolveServiceEndpoint(t *testing.T) {
	// Mock server
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.URL.Path == "/v1.35/tasks":
			tasks := []swarm.Task{
				{
					ID: "t1",
					Status: swarm.TaskStatus{
						State: swarm.TaskStateRunning,
					},
					NetworksAttachments: []swarm.NetworkAttachment{
						{
							Network:   swarm.Network{ID: "net1"},
							Addresses: []string{"10.0.0.1/24"},
						},
					},
					NodeID: "node1",
				},
			}
			json.NewEncoder(w).Encode(tasks)
		default:
			w.WriteHeader(http.StatusNotFound)
		}
	}))
	defer server.Close()

	defer ResetCli()
	SetCli(makeClientForServer(t, server.URL))
	cli := getCli()

	service := &swarm.Service{
		ID: "s1",
		Spec: swarm.ServiceSpec{
			Annotations: swarm.Annotations{Name: "svc1"},
		},
		Endpoint: swarm.Endpoint{
			Ports: []swarm.PortConfig{
				{TargetPort: 9100},
			},
		},
	}

	endpoint, err := resolveServiceEndpoint(cli, service, "node1", 9100)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	expected := "http://10.0.0.1:9100/metrics"
	if endpoint != expected {
		t.Errorf("expected %s, got %s", expected, endpoint)
	}
}

func TestClusterMetricsHandler_ErrorListingNodes(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v1.35/nodes" {
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte(`{"message":"error"}`))
			return
		}
		w.WriteHeader(http.StatusNotFound)
	}))
	defer server.Close()

	defer ResetCli()
	SetCli(makeClientForServer(t, server.URL))

	req := httptest.NewRequest("GET", "/docker/nodes/metrics", nil)
	w := httptest.NewRecorder()
	clusterMetricsHandler(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}
	var resp clusterMetricsResponse
	json.NewDecoder(w.Body).Decode(&resp)
	if resp.Available {
		t.Error("expected available to be false")
	}
}

func TestLoadMetricsLabelsFromEnv(t *testing.T) {
	origNode := nodeExporterLabel
	origCadvisor := cadvisorLabel
	origEnvNode, nodeSet := os.LookupEnv("DSD_NODE_EXPORTER_LABEL")
	origEnvCadvisor, cadvisorSet := os.LookupEnv("DSD_CADVISOR_LABEL")

	defer func() {
		nodeExporterLabel = origNode
		cadvisorLabel = origCadvisor
		if nodeSet {
			os.Setenv("DSD_NODE_EXPORTER_LABEL", origEnvNode)
		} else {
			os.Unsetenv("DSD_NODE_EXPORTER_LABEL")
		}
		if cadvisorSet {
			os.Setenv("DSD_CADVISOR_LABEL", origEnvCadvisor)
		} else {
			os.Unsetenv("DSD_CADVISOR_LABEL")
		}
	}()

	os.Setenv("DSD_NODE_EXPORTER_LABEL", "test-node-label")
	os.Setenv("DSD_CADVISOR_LABEL", "test-cadvisor-label")
	loadMetricsLabelsFromEnv()

	if nodeExporterLabel != "test-node-label" {
		t.Errorf("expected test-node-label, got %s", nodeExporterLabel)
	}
	if cadvisorLabel != "test-cadvisor-label" {
		t.Errorf("expected test-cadvisor-label, got %s", cadvisorLabel)
	}
}
