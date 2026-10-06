package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync/atomic"
	"testing"
	"time"

	"github.com/docker/docker/api/types/swarm"
	"github.com/modelcontextprotocol/go-sdk/mcp"
)

func TestMetricsQueries_AlreadyCancelled(t *testing.T) {
	var requests atomic.Int32
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		requests.Add(1)
		_, _ = fmt.Fprint(w, "[]")
	}))
	defer server.Close()
	SetCli(makeClientForServer(t, server.URL))
	defer ResetCli()
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	for _, query := range []struct {
		name string
		run  func() *string
	}{
		{"node", func() *string { return queryNodeMetrics(ctx, "node1").Error }},
		{"service", func() *string { return queryServiceMetrics(ctx, "web").Error }},
		{"task", func() *string { return queryTaskMetrics(ctx, "task1").Error }},
		{"cluster", func() *string { return queryClusterMetrics(ctx).Error }},
	} {
		t.Run(query.name, func(t *testing.T) {
			if err := query.run(); err == nil || !strings.Contains(*err, context.Canceled.Error()) {
				t.Fatalf("expected cancellation error, got %v", err)
			}
		})
	}
	if requests.Load() != 0 {
		t.Fatalf("cancelled queries made %d Docker API requests", requests.Load())
	}
}

func TestMetricsHelpers_CancelDockerRequests(t *testing.T) {
	for _, stage := range []string{"node discovery", "cadvisor discovery", "task resolution", "network inspection"} {
		t.Run(stage, func(t *testing.T) {
			started, stopped := make(chan struct{}), make(chan struct{})
			release := make(chan struct{})
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if stage == "network inspection" && r.URL.Path == "/v1.35/tasks" {
					_, _ = fmt.Fprint(w, "[]")
					return
				}
				close(started)
				select {
				case <-r.Context().Done():
					close(stopped)
				case <-release:
				}
			}))
			defer server.Close()
			defer close(release)
			cli := makeClientForServer(t, server.URL)
			ctx, cancel := context.WithCancel(context.Background())
			defer cancel()
			result := make(chan error, 1)
			go func() {
				var err error
				switch stage {
				case "node discovery":
					_, err = findNodeExporterService(ctx, cli)
				case "cadvisor discovery":
					_, err = findCAdvisorService(ctx, cli)
				default:
					_, err = resolveServiceEndpoint(ctx, cli, &swarm.Service{ID: "exporter", Spec: swarm.ServiceSpec{Annotations: swarm.Annotations{Name: "exporter"}}}, "node1", 9100)
				}
				result <- err
			}()
			select {
			case <-started:
			case <-time.After(2 * time.Second):
				t.Fatal("Docker request did not start")
			}
			cancel()
			select {
			case err := <-result:
				if !errors.Is(err, context.Canceled) {
					t.Fatalf("expected cancellation, got %v", err)
				}
			case <-time.After(2 * time.Second):
				t.Fatal("Docker request ignored cancellation")
			}
			select {
			case <-stopped:
			case <-time.After(2 * time.Second):
				t.Fatal("Docker server did not observe cancellation")
			}
		})
	}
}

func TestMetricsFetches_CancelHTTPHeadersAndBody(t *testing.T) {
	for _, fetch := range []struct {
		name string
		run  func(context.Context, string) (string, error)
	}{
		{"node-exporter", fetchMetricsFromNodeExporter}, {"cadvisor", fetchMetricsFromCAdvisor},
	} {
		for _, body := range []bool{false, true} {
			t.Run(fmt.Sprintf("%s/body=%v", fetch.name, body), func(t *testing.T) {
				started, stopped := make(chan struct{}), make(chan struct{})
				release := make(chan struct{})
				server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					if body {
						_, _ = fmt.Fprint(w, "partial metric")
						w.(http.Flusher).Flush()
					}
					close(started)
					select {
					case <-r.Context().Done():
						close(stopped)
					case <-release:
					}
				}))
				defer server.Close()
				defer close(release)
				ctx, cancel := context.WithCancel(context.Background())
				defer cancel()
				result := make(chan error, 1)
				go func() { _, err := fetch.run(ctx, server.URL); result <- err }()
				select {
				case <-started:
				case <-time.After(2 * time.Second):
					t.Fatal("exporter request did not start")
				}
				cancel()
				select {
				case err := <-result:
					if !errors.Is(err, context.Canceled) {
						t.Fatalf("expected cancellation, got %v", err)
					}
				case <-time.After(2 * time.Second):
					t.Fatal("exporter ignored cancellation")
				}
				select {
				case <-stopped:
				case <-time.After(2 * time.Second):
					t.Fatal("exporter did not observe cancellation")
				}
			})
		}
	}
}

type metricsRoundTripFunc func(*http.Request) (*http.Response, error)

func (f metricsRoundTripFunc) RoundTrip(r *http.Request) (*http.Response, error) { return f(r) }

func TestMetricsAggregation_CancelsWithoutWaitingForWorkers(t *testing.T) {
	for _, kind := range []string{"service", "cluster"} {
		t.Run(kind, func(t *testing.T) {
			services := []swarm.Service{{ID: "web", Spec: swarm.ServiceSpec{Annotations: swarm.Annotations{Name: "web"}}}}
			for _, label := range []string{nodeExporterLabel, cadvisorLabel} {
				services = append(services, swarm.Service{ID: label, Spec: swarm.ServiceSpec{Annotations: swarm.Annotations{Name: label, Labels: map[string]string{label: "true"}}}})
			}
			tasks := []swarm.Task{}
			for _, node := range []string{"node1", "node2"} {
				tasks = append(tasks, swarm.Task{NodeID: node, Status: swarm.TaskStatus{State: swarm.TaskStateRunning}, NetworksAttachments: []swarm.NetworkAttachment{{Addresses: []string{"127.0.0.1/32"}}}})
			}
			docker := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				switch r.URL.Path {
				case "/v1.35/services":
					_ = json.NewEncoder(w).Encode(services)
				case "/v1.35/nodes":
					_ = json.NewEncoder(w).Encode([]swarm.Node{{ID: "node1"}, {ID: "node2"}})
				case "/v1.35/tasks":
					_ = json.NewEncoder(w).Encode(tasks)
				default:
					http.NotFound(w, r)
				}
			}))
			defer docker.Close()
			SetCli(makeClientForServer(t, docker.URL))
			defer ResetCli()
			requests := make(chan *http.Request, 2)
			release := make(chan struct{})
			oldClient := metricsHttpClient
			metricsHttpClient = &http.Client{Transport: metricsRoundTripFunc(func(r *http.Request) (*http.Response, error) {
				requests <- r
				// Deliberately ignore cancellation to verify the aggregator itself exits.
				<-release
				return &http.Response{StatusCode: 200, Body: io.NopCloser(strings.NewReader("")), Header: make(http.Header)}, nil
			})}
			defer func() { close(release); metricsHttpClient = oldClient }()
			ctx, cancel := context.WithCancel(context.Background())
			defer cancel()
			result := make(chan *string, 1)
			go func() {
				if kind == "service" {
					result <- queryServiceMetrics(ctx, "web").Error
				} else {
					result <- queryClusterMetrics(ctx).Error
				}
			}()
			for range 2 {
				select {
				case request := <-requests:
					if request.Context() != ctx {
						t.Fatal("worker did not receive query context")
					}
				case <-time.After(2 * time.Second):
					t.Fatal("parallel workers did not start")
				}
			}
			cancel()
			select {
			case err := <-result:
				if err == nil || !strings.Contains(*err, context.Canceled.Error()) {
					t.Fatalf("expected aggregation cancellation, got %v", err)
				}
			case <-time.After(2 * time.Second):
				t.Fatal("aggregation kept waiting for workers")
			}
			// Workers have one buffered result slot each, so returning cannot block sends.
		})
	}
}

func TestMCPMetrics_CancellationReachesExporter(t *testing.T) {
	for _, tool := range []struct {
		name string
		args map[string]any
	}{
		{"get_node_metrics", map[string]any{"identifier": "node1"}},
		{"get_service_metrics", map[string]any{"identifier": "web"}},
		{"get_task_metrics", map[string]any{"identifier": "task1"}},
		{"get_cluster_metrics", nil},
	} {
		t.Run(tool.name, func(t *testing.T) {
			session, _ := mcpFixture(t)
			started, stopped := make(chan struct{}, 1), make(chan struct{}, 1)
			release := make(chan struct{})
			defer close(release)
			oldClient := metricsHttpClient
			metricsHttpClient = &http.Client{Transport: metricsRoundTripFunc(func(request *http.Request) (*http.Response, error) {
				started <- struct{}{}
				select {
				case <-request.Context().Done():
				case <-release:
					return nil, context.Canceled
				}
				stopped <- struct{}{}
				return nil, request.Context().Err()
			})}
			defer func() { metricsHttpClient = oldClient }()
			ctx, cancel := context.WithCancel(context.Background())
			defer cancel()
			result := make(chan error, 1)
			go func() {
				_, err := session.CallTool(ctx, &mcp.CallToolParams{Name: tool.name, Arguments: tool.args})
				result <- err
			}()
			select {
			case <-started:
			case <-time.After(2 * time.Second):
				t.Fatal("MCP exporter request did not start")
			}
			cancel()
			select {
			case err := <-result:
				if err == nil {
					t.Fatal("cancelled MCP call succeeded")
				}
			case <-time.After(2 * time.Second):
				t.Fatal("MCP call ignored cancellation")
			}
			select {
			case <-stopped:
			case <-time.After(2 * time.Second):
				t.Fatal("MCP request cancellation did not reach exporter")
			}
		})
	}
}
