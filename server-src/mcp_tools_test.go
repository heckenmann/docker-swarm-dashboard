package main

import (
	"context"
	"encoding/binary"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strconv"
	"strings"
	"testing"
	"time"

	"github.com/docker/docker/api/types/swarm"
	"github.com/modelcontextprotocol/go-sdk/mcp"
)

// mcpFixture exercises the SDK transport and real shared queries against an
// injected Docker API and exporter. It never uses the host Docker daemon.
func mcpFixture(t *testing.T) (*mcp.ClientSession, chan url.Values) {
	t.Helper()
	metrics := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		_, _ = fmt.Fprint(w, `node_memory_MemTotal_bytes 1000
node_memory_MemAvailable_bytes 400
node_cpu_seconds_total{cpu="0",mode="idle"} 10
node_filesystem_size_bytes{device="root",mountpoint="/",fstype="ext4"} 2000
node_filesystem_avail_bytes{device="root",mountpoint="/",fstype="ext4"} 1000
container_memory_usage_bytes{id="/docker/container1",name="web.1.task1",container_label_com_docker_swarm_service_name="web",container_label_com_docker_swarm_task_id="task1"} 100
container_spec_memory_limit_bytes{id="/docker/container1",name="web.1.task1",container_label_com_docker_swarm_service_name="web",container_label_com_docker_swarm_task_id="task1"} 500
`)
	}))
	t.Cleanup(metrics.Close)
	u, _ := url.Parse(metrics.URL)
	port, _ := strconv.Atoi(u.Port())
	replicas := uint64(1)
	services := []swarm.Service{{ID: "service1", Spec: swarm.ServiceSpec{
		Annotations:  swarm.Annotations{Name: "web", Labels: map[string]string{"com.docker.stack.namespace": "demo"}},
		TaskTemplate: swarm.TaskSpec{ContainerSpec: &swarm.ContainerSpec{Env: []string{"PASSWORD=mcp-fixture-secret"}}},
		Mode:         swarm.ServiceMode{Replicated: &swarm.ReplicatedService{Replicas: &replicas}},
		EndpointSpec: &swarm.EndpointSpec{Ports: []swarm.PortConfig{{PublishedPort: 8080, TargetPort: 80}}},
	}}}
	for _, exporter := range []struct{ id, label string }{{"exporter", nodeExporterLabel}, {"cadvisor", cadvisorLabel}} {
		services = append(services, swarm.Service{ID: exporter.id, Spec: swarm.ServiceSpec{
			Annotations: swarm.Annotations{Name: exporter.id, Labels: map[string]string{exporter.label: "true"}},
			Mode:        swarm.ServiceMode{Global: &swarm.GlobalService{}},
		}, Endpoint: swarm.Endpoint{Ports: []swarm.PortConfig{{TargetPort: uint32(port)}}}})
	}
	nodes := []swarm.Node{{ID: "node1", Spec: swarm.NodeSpec{Annotations: swarm.Annotations{Name: "manager"}}, Description: swarm.NodeDescription{Hostname: "host1"}}}
	tasks := []swarm.Task{}
	for _, service := range services {
		id := service.ID + "-task"
		if service.ID == "service1" {
			id = "task1"
		}
		tasks = append(tasks, swarm.Task{ID: id, ServiceID: service.ID, NodeID: "node1", Spec: service.Spec.TaskTemplate,
			Status:              swarm.TaskStatus{State: swarm.TaskStateRunning, ContainerStatus: &swarm.ContainerStatus{PID: 1}},
			NetworksAttachments: []swarm.NetworkAttachment{{Addresses: []string{u.Hostname() + "/32"}}},
		})
	}
	logOptions := make(chan url.Values, 16)
	docker := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var filters map[string]map[string]bool
		if raw := r.URL.Query().Get("filters"); raw != "" {
			if err := json.Unmarshal([]byte(raw), &filters); err != nil {
				http.Error(w, err.Error(), 400)
				return
			}
		}
		matches := func(key, value string) bool {
			if len(filters[key]) == 0 {
				return true
			}
			for requested := range filters[key] {
				if value == requested || (key == "id" && strings.HasPrefix(value, requested)) || (key == "name" && strings.Contains(value, requested)) {
					return true
				}
			}
			return false
		}
		switch r.URL.Path {
		case "/v1.35/services":
			result := []swarm.Service{}
			for _, service := range services {
				if matches("id", service.ID) && matches("name", service.Spec.Name) {
					result = append(result, service)
				}
			}
			_ = json.NewEncoder(w).Encode(result)
		case "/v1.35/nodes":
			result := []swarm.Node{}
			for _, node := range nodes {
				if matches("id", node.ID) && (matches("name", node.Spec.Name) || matches("name", node.Description.Hostname)) {
					result = append(result, node)
				}
			}
			_ = json.NewEncoder(w).Encode(result)
		case "/v1.35/tasks":
			result := []swarm.Task{}
			for _, task := range tasks {
				if matches("id", task.ID) && matches("service", task.ServiceID) && matches("node", task.NodeID) {
					result = append(result, task)
				}
			}
			_ = json.NewEncoder(w).Encode(result)
		case "/v1.35/tasks/task1":
			_ = json.NewEncoder(w).Encode(tasks[0])
		case "/v1.35/info":
			_, _ = fmt.Fprint(w, `{}`)
		case "/v1.35/services/service1/logs":
			logOptions <- r.URL.Query()
			payload := "first line\nsecond line\n" + strings.Repeat("x", 5000) + "\n"
			header := make([]byte, 8)
			header[0] = 1
			binary.BigEndian.PutUint32(header[4:], uint32(len(payload)))
			_, _ = w.Write(append(header, payload...))
		default:
			http.NotFound(w, r)
		}
	}))
	t.Cleanup(docker.Close)
	SetCli(makeClientForServer(t, docker.URL))
	t.Cleanup(ResetCli)
	server := httptest.NewServer(newMCPHTTPHandler())
	t.Cleanup(server.Close)
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	t.Cleanup(cancel)
	session, err := mcp.NewClient(&mcp.Implementation{Name: "mcp-test", Version: "1"}, nil).Connect(ctx, &mcp.StreamableClientTransport{Endpoint: server.URL}, nil)
	if err != nil {
		t.Fatalf("connect MCP client: %v", err)
	}
	t.Cleanup(func() { _ = session.Close() })
	return session, logOptions
}

func callMCPTool(t *testing.T, session *mcp.ClientSession, name string, args any) (*mcp.CallToolResult, map[string]any) {
	t.Helper()
	result, err := session.CallTool(context.Background(), &mcp.CallToolParams{Name: name, Arguments: args})
	if err != nil {
		t.Fatalf("call %s: %v", name, err)
	}
	if result.IsError {
		t.Fatalf("%s tool error: %v", name, result.Content)
	}
	data, err := json.Marshal(result.StructuredContent)
	if err != nil {
		t.Fatal(err)
	}
	var output map[string]any
	if err := json.Unmarshal(data, &output); err != nil {
		t.Fatalf("%s must return structured object content: %v", name, err)
	}
	return result, output
}

func TestMCPTools_RepresentativeDataAndDiscovery(t *testing.T) {
	session, logOptions := mcpFixture(t)
	tests := []struct {
		name string
		args map[string]any
		key  string
	}{
		{"list_services", nil, "services"}, {"get_service", map[string]any{"identifier": "web"}, "service"},
		{"get_service_metrics", map[string]any{"identifier": "web"}, "metrics"},
		{"list_nodes", nil, "nodes"}, {"get_node", map[string]any{"identifier": "host1"}, "node"},
		{"get_cluster_metrics", nil, "nodeCount"}, {"get_node_metrics", map[string]any{"identifier": "manager"}, "metrics"},
		{"list_tasks", map[string]any{"service": "web", "node": "host1"}, "tasks"},
		{"get_task", map[string]any{"identifier": "task1"}, "NodeName"},
		{"get_task_metrics", map[string]any{"identifier": "task1"}, "metrics"},
		{"list_stacks", nil, "stacks"}, {"list_published_ports", nil, "ports"},
		{"get_timeline", nil, "timeline"}, {"get_cluster_overview", nil, "services"},
		{"get_dashboard_settings", nil, "mcpEnabled"}, {"get_version", nil, "version"},
		{"get_health", nil, "status"}, {"list_log_services", nil, "services"},
		{"get_service_logs", map[string]any{"service": "web", "tail": "ALL", "since": "2d", "timestamps": true, "stdout": true, "stderr": false, "details": true}, "lines"},
	}
	tools, err := session.ListTools(context.Background(), nil)
	if err != nil {
		t.Fatal(err)
	}
	if len(tools.Tools) != len(tests) {
		t.Fatalf("registered %d tools, expected %d", len(tools.Tools), len(tests))
	}
	registered := map[string]bool{}
	for _, tool := range tools.Tools {
		registered[tool.Name] = true
		if tool.Annotations == nil || !tool.Annotations.ReadOnlyHint {
			t.Errorf("%s is not annotated read-only", tool.Name)
		}
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if !registered[test.name] {
				t.Fatalf("tool not discoverable: %s", test.name)
			}
			result, output := callMCPTool(t, session, test.name, test.args)
			if value, ok := output[test.key]; !ok || value == nil {
				t.Fatalf("missing representative %s in %v", test.key, output)
			}
			if strings.Contains(fmt.Sprint(result.Content), "mcp-fixture-secret") {
				t.Fatal("tool leaked a container environment secret")
			}
			if test.name == "get_service_logs" {
				lines := output["lines"].([]any)
				if len(lines) != 3 || lines[1] != "second line" || len(lines[2].(string)) != 5000 {
					t.Fatalf("corrupted Docker log snapshot: %v", lines)
				}
				options := <-logOptions
				for key, expected := range map[string]string{"tail": "all", "follow": "", "stdout": "1", "stderr": "", "timestamps": "1", "details": "1"} {
					if options.Get(key) != expected {
						t.Errorf("log option %s=%q, expected %q", key, options.Get(key), expected)
					}
				}
				since, err := strconv.ParseInt(options.Get("since"), 10, 64)
				if err != nil || time.Since(time.Unix(since, 0)) < 48*time.Hour-5*time.Second || time.Since(time.Unix(since, 0)) > 48*time.Hour+5*time.Second {
					t.Errorf("Docker since must represent two days ago, got %q", options.Get("since"))
				}
			}
			if test.name == "list_tasks" && len(output["tasks"].([]any)) != 1 {
				t.Fatal("task filters did not narrow the result")
			}
		})
	}
}

func TestMCPTools_UnknownEntitiesAndSchemaErrors(t *testing.T) {
	session, _ := mcpFixture(t)
	for _, test := range []struct {
		name string
		args map[string]any
	}{
		{"get_service", map[string]any{"identifier": "unknown"}},
		{"get_service", map[string]any{"identifier": "we"}},
		{"get_node", map[string]any{"identifier": "unknown"}},
		{"get_node_metrics", map[string]any{"identifier": "unknown"}},
		{"get_task", map[string]any{"identifier": "unknown"}},
		{"list_tasks", map[string]any{"service": "unknown"}},
		{"list_tasks", map[string]any{"node": "unknown"}},
		{"get_service_logs", map[string]any{"service": "unknown"}},
		{"get_service_logs", map[string]any{"service": "web", "tail": "invalid"}},
		{"get_service", map[string]any{}},
	} {
		result, err := session.CallTool(context.Background(), &mcp.CallToolParams{Name: test.name, Arguments: test.args})
		if err != nil {
			t.Fatal(err)
		}
		if !result.IsError || len(result.Content) == 0 {
			t.Errorf("%s(%v) must return an actionable tool error", test.name, test.args)
		}
	}
}

func TestMCPTools_LogAvailability(t *testing.T) {
	previous := handlingLogs
	handlingLogs = false
	t.Cleanup(func() { handlingLogs = previous })
	session, _ := mcpFixture(t)
	tools, err := session.ListTools(context.Background(), nil)
	if err != nil {
		t.Fatal(err)
	}
	for _, tool := range tools.Tools {
		if tool.Name == "get_service_logs" || tool.Name == "list_log_services" {
			t.Fatalf("disabled log tool registered: %s", tool.Name)
		}
	}
	_, settings := callMCPTool(t, session, "get_dashboard_settings", nil)
	if settings["showLogsButton"] != false {
		t.Fatal("disabled log capability not advertised")
	}
	if _, err := queryServiceLogs(context.Background(), mcpServiceLogsInput{Service: "web"}); err == nil {
		t.Fatal("direct query bypassed disabled logs")
	}
}

func TestMCPTools_MaskingParity(t *testing.T) {
	session, _ := mcpFixture(t)
	for _, enabled := range []string{"true", "false"} {
		t.Run(enabled, func(t *testing.T) {
			t.Setenv("DSD_MASK_ENV", enabled)
			for _, tool := range []struct {
				name string
				args map[string]any
			}{
				{"list_services", nil}, {"get_service", map[string]any{"identifier": "service1"}},
				{"list_tasks", nil}, {"get_task", map[string]any{"identifier": "task1"}},
				{"get_node", map[string]any{"identifier": "node1"}}, {"get_cluster_overview", nil},
			} {
				_, output := callMCPTool(t, session, tool.name, tool.args)
				data, _ := json.Marshal(output)
				if exposed := strings.Contains(string(data), "mcp-fixture-secret"); exposed != (enabled == "false") {
					t.Errorf("%s masking does not respect DSD_MASK_ENV=%s", tool.name, enabled)
				}
			}
			for _, query := range []func(context.Context) (any, error){
				func(ctx context.Context) (any, error) { return queryDashboardH(ctx) },
				func(ctx context.Context) (any, error) { return queryDashboardV(ctx) },
			} {
				output, err := query(context.Background())
				if err != nil {
					t.Fatal(err)
				}
				data, _ := json.Marshal(output)
				if exposed := strings.Contains(string(data), "mcp-fixture-secret"); exposed != (enabled == "false") {
					t.Error("REST dashboard masking differs from MCP")
				}
			}
		})
	}
}

func TestMCPServiceLogs_DefaultsAndNumericTail(t *testing.T) {
	session, options := mcpFixture(t)
	previous := logsFormTail
	logsFormTail = ""
	t.Cleanup(func() { logsFormTail = previous })
	for _, tail := range []string{"", "0", "5"} {
		args := map[string]any{"service": "service1"}
		if tail != "" {
			args["tail"] = tail
		}
		_, output := callMCPTool(t, session, "get_service_logs", args)
		expected := tail
		if expected == "" {
			expected = "20"
		}
		if output["tail"] != expected || (<-options).Get("tail") != expected {
			t.Fatalf("tail %q was not passed to Docker", tail)
		}
	}
}
