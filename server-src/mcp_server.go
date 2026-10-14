package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/docker/docker/api/types/container"
	"github.com/modelcontextprotocol/go-sdk/mcp"

	"heckenmann.de/docker-swarm-dashboard/v2/internal/version"
)

const mcpLogRequestTimeout = 5 * time.Second

const mcpMetricsResultDescription = " Check available, message, and error before using metrics; an error may be present even when available=true. A missing exporter returns available=false with a deployment message. Each exporter HTTP request has a five-second timeout and honors request cancellation."

type mcpEntityInput struct {
	Identifier string `json:"identifier" jsonschema:"Docker ID or exact entity name where supported by the tool. Task tools accept task IDs only."`
}

type mcpListTasksInput struct {
	Service string `json:"service,omitempty" jsonschema:"Optional service ID or exact service name. Omit to include all services."`
	Node    string `json:"node,omitempty" jsonschema:"Optional node ID, node name, or hostname. Omit to include all nodes. Service and node filters are combined."`
}

type mcpServiceLogsInput struct {
	Service    string `json:"service" jsonschema:"Service ID or exact service name."`
	Tail       string `json:"tail,omitempty" jsonschema:"Non-negative line count as a string, or all. Omit to use logsFormTail from dashboard settings, falling back to 20. Zero returns no lines."`
	Since      string `json:"since,omitempty" jsonschema:"Docker-compatible timestamp or relative duration such as 15m, 2h, or 2d. Omit or pass an empty string for no time filter."`
	Timestamps *bool  `json:"timestamps,omitempty" jsonschema:"Include Docker timestamps. Defaults to logsFormTimestamps from dashboard settings."`
	Stdout     *bool  `json:"stdout,omitempty" jsonschema:"Include stdout. Defaults to logsFormStdout from dashboard settings."`
	Stderr     *bool  `json:"stderr,omitempty" jsonschema:"Include stderr. Defaults to logsFormStderr from dashboard settings."`
	Details    *bool  `json:"details,omitempty" jsonschema:"Include extra log attributes. Defaults to logsFormDetails from dashboard settings."`
}

func newMCPServer() *mcp.Server {
	server := mcp.NewServer(&mcp.Implementation{
		Name:    "docker-swarm-dashboard",
		Version: mcpImplementationVersion(),
	}, nil)

	addMCPTool(server, &mcp.Tool{
		Name:        "list_services",
		Description: "List Docker Swarm services with the same masked service data available in the dashboard.",
	}, func(ctx context.Context, _ *mcp.CallToolRequest, _ struct{}) (*mcp.CallToolResult, any, error) {
		result, err := queryServices(ctx)
		return nil, map[string]any{"services": result}, err
	})

	addMCPTool(server, &mcp.Tool{
		Name:        "get_service",
		Description: "Get one Docker Swarm service and its tasks. Accepts a service ID or exact service name.",
	}, func(ctx context.Context, _ *mcp.CallToolRequest, input mcpEntityInput) (*mcp.CallToolResult, any, error) {
		result, err := queryServiceDetails(ctx, input.Identifier)
		return nil, result, err
	})

	addMCPTool(server, &mcp.Tool{
		Name:        "get_service_metrics",
		Description: "Get cAdvisor metrics for a Docker Swarm service by ID or exact name. Aggregates running tasks across nodes." + mcpMetricsResultDescription,
	}, func(ctx context.Context, _ *mcp.CallToolRequest, input mcpEntityInput) (*mcp.CallToolResult, any, error) {
		return nil, queryServiceMetrics(ctx, input.Identifier), nil
	})

	addMCPTool(server, &mcp.Tool{
		Name:        "list_nodes",
		Description: "List Docker Swarm nodes.",
	}, func(ctx context.Context, _ *mcp.CallToolRequest, _ struct{}) (*mcp.CallToolResult, any, error) {
		result, err := queryNodes(ctx)
		return nil, map[string]any{"nodes": result}, err
	})

	addMCPTool(server, &mcp.Tool{
		Name:        "get_node",
		Description: "Get one Docker Swarm node and its tasks. Accepts a node ID, node name, or hostname.",
	}, func(ctx context.Context, _ *mcp.CallToolRequest, input mcpEntityInput) (*mcp.CallToolResult, any, error) {
		result, err := queryNodeDetails(ctx, input.Identifier)
		return nil, result, err
	})

	addMCPTool(server, &mcp.Tool{
		Name:        "get_cluster_metrics",
		Description: "Get aggregated node-exporter metrics for the Swarm cluster, including resource totals, nodeCount, and nodesAvailable. Partial exporter failures may reduce nodesAvailable." + mcpMetricsResultDescription,
	}, func(ctx context.Context, _ *mcp.CallToolRequest, _ struct{}) (*mcp.CallToolResult, any, error) {
		return nil, queryClusterMetrics(ctx), nil
	})

	addMCPTool(server, &mcp.Tool{
		Name:        "get_node_metrics",
		Description: "Get node-exporter metrics for a Docker Swarm node by ID, exact node name, or hostname." + mcpMetricsResultDescription,
	}, func(ctx context.Context, _ *mcp.CallToolRequest, input mcpEntityInput) (*mcp.CallToolResult, any, error) {
		cli, err := getCli()
		if err != nil {
			return nil, nil, err
		}
		node, err := resolveNode(ctx, cli, input.Identifier)
		if err != nil {
			return nil, nil, err
		}
		return nil, queryNodeMetrics(ctx, node.ID), nil
	})

	addMCPTool(server, &mcp.Tool{
		Name:        "list_tasks",
		Description: "List Docker Swarm tasks, optionally filtered by service and/or node.",
	}, func(ctx context.Context, _ *mcp.CallToolRequest, input mcpListTasksInput) (*mcp.CallToolResult, any, error) {
		result, err := queryTasks(ctx, input.Service, input.Node)
		return nil, map[string]any{"tasks": result}, err
	})

	addMCPTool(server, &mcp.Tool{
		Name:        "get_task",
		Description: "Get one Docker Swarm task by task ID and its associated service/node names.",
	}, func(ctx context.Context, _ *mcp.CallToolRequest, input mcpEntityInput) (*mcp.CallToolResult, any, error) {
		result, err := queryTaskDetails(ctx, input.Identifier)
		return nil, result, err
	})

	addMCPTool(server, &mcp.Tool{
		Name:        "get_task_metrics",
		Description: "Get cAdvisor metrics for a Docker Swarm task by task ID. A stopped task or a task without metrics returns available=false with a message." + mcpMetricsResultDescription,
	}, func(ctx context.Context, _ *mcp.CallToolRequest, input mcpEntityInput) (*mcp.CallToolResult, any, error) {
		return nil, queryTaskMetrics(ctx, input.Identifier), nil
	})

	addMCPTool(server, &mcp.Tool{
		Name:        "list_stacks",
		Description: "List Docker stacks and their services as shown by the dashboard.",
	}, func(ctx context.Context, _ *mcp.CallToolRequest, _ struct{}) (*mcp.CallToolResult, any, error) {
		result, err := queryStacks(ctx)
		return nil, map[string]any{"stacks": result}, err
	})

	addMCPTool(server, &mcp.Tool{
		Name:        "list_published_ports",
		Description: "List published Docker Swarm service ports.",
	}, func(ctx context.Context, _ *mcp.CallToolRequest, _ struct{}) (*mcp.CallToolResult, any, error) {
		result, err := queryPublishedPorts(ctx)
		return nil, map[string]any{"ports": result}, err
	})

	addMCPTool(server, &mcp.Tool{
		Name:        "get_timeline",
		Description: "Get the service/task timeline data shown by the dashboard.",
	}, func(ctx context.Context, _ *mcp.CallToolRequest, _ struct{}) (*mcp.CallToolResult, any, error) {
		result, err := queryTimeline(ctx)
		return nil, map[string]any{"timeline": result}, err
	})

	addMCPTool(server, &mcp.Tool{
		Name:        "get_cluster_overview",
		Description: "Get the complete cluster overview as services, nodes, and tasks, including unassigned tasks. Results are independent of dashboard layout and respect DSD_MASK_ENV.",
	}, func(ctx context.Context, _ *mcp.CallToolRequest, _ struct{}) (*mcp.CallToolResult, any, error) {
		result, err := queryClusterOverview(ctx)
		return nil, result, err
	})

	addMCPTool(server, &mcp.Tool{
		Name:        "get_dashboard_settings",
		Description: "Get server-provided dashboard settings, capability flags, and configured defaults. mcpEnabled indicates MCP availability; showLogsButton indicates log availability. The logsForm fields provide log option defaults.",
	}, func(_ context.Context, _ *mcp.CallToolRequest, _ struct{}) (*mcp.CallToolResult, any, error) {
		return nil, currentDashboardSettings(), nil
	})

	addMCPTool(server, &mcp.Tool{
		Name:        "get_version",
		Description: "Get the Docker Swarm Dashboard version and update information.",
	}, func(_ context.Context, _ *mcp.CallToolRequest, _ struct{}) (*mcp.CallToolResult, any, error) {
		return nil, queryVersion(), nil
	})

	addMCPTool(server, &mcp.Tool{
		Name:        "get_health",
		Description: "Check whether Docker Swarm Dashboard can reach the Docker API.",
	}, func(ctx context.Context, _ *mcp.CallToolRequest, _ struct{}) (*mcp.CallToolResult, any, error) {
		if err := queryHealth(ctx); err != nil {
			return nil, nil, fmt.Errorf("docker API health check failed: %w", err)
		}
		return nil, map[string]string{"status": "OK"}, nil
	})

	if handlingLogs {
		registerMCPLogTools(server)
	}

	return server
}

func registerMCPLogTools(server *mcp.Server) {
	addMCPTool(server, &mcp.Tool{
		Name:        "list_log_services",
		Description: "List service IDs and names available in the dashboard log viewer. This tool is only registered when DSD_HANDLE_LOGS=true.",
	}, func(ctx context.Context, _ *mcp.CallToolRequest, _ struct{}) (*mcp.CallToolResult, any, error) {
		result, err := queryLogServices(ctx)
		return nil, map[string]any{"services": result}, err
	})

	addMCPTool(server, &mcp.Tool{
		Name:        "get_service_logs",
		Description: fmt.Sprintf("Get a finite service log snapshot by service ID or exact name. This tool is only registered when DSD_HANDLE_LOGS=true. Never follows logs; returns an error if the Docker log read does not finish within %g seconds or a frame is incomplete. Omitted options use the defaults described in the input schema; use get_dashboard_settings to inspect configured log defaults. Results contain serviceId, serviceName, tail, since, and lines.", mcpLogRequestTimeout.Seconds()),
	}, func(ctx context.Context, _ *mcp.CallToolRequest, input mcpServiceLogsInput) (*mcp.CallToolResult, any, error) {
		result, err := queryServiceLogs(ctx, input)
		return nil, result, err
	})
}

func newMCPHTTPHandler() http.Handler {
	server := newMCPServer()
	return mcp.NewStreamableHTTPHandler(
		func(*http.Request) *mcp.Server {
			return server
		},
		&mcp.StreamableHTTPOptions{
			Stateless:                    true,
			JSONResponse:                 true,
			PropagateRequestCancellation: true,
		},
	)
}

func mcpImplementationVersion() string {
	if configured := os.Getenv("DSD_VERSION"); configured != "" {
		return configured
	}
	if version.BuildVersion != "" {
		return version.BuildVersion
	}
	return "dev"
}

func queryServiceLogs(ctx context.Context, input mcpServiceLogsInput) (map[string]any, error) {
	if !handlingLogs {
		return nil, fmt.Errorf("service logs are disabled by DSD_HANDLE_LOGS")
	}
	cli, err := getCli()
	if err != nil {
		return nil, err
	}
	service, err := resolveService(ctx, cli, input.Service)
	if err != nil {
		return nil, err
	}

	tail := strings.TrimSpace(input.Tail)
	if tail == "" {
		tail = strings.TrimSpace(logsFormTail)
	}
	if tail == "" {
		tail = "20"
	}
	if strings.EqualFold(tail, "all") {
		tail = "all"
	} else {
		count, err := strconv.Atoi(tail)
		if err != nil || count < 0 {
			return nil, fmt.Errorf("tail must be a non-negative integer or %q", "all")
		}
		tail = strconv.Itoa(count)
	}

	timestamps := logsFormTimestamps
	if input.Timestamps != nil {
		timestamps = *input.Timestamps
	}
	stdout := logsFormStdout
	if input.Stdout != nil {
		stdout = *input.Stdout
	}
	stderr := logsFormStderr
	if input.Stderr != nil {
		stderr = *input.Stderr
	}
	details := logsFormDetails
	if input.Details != nil {
		details = *input.Details
	}

	logCtx, cancel := context.WithTimeout(ctx, mcpLogRequestTimeout)
	defer cancel()

	reader, err := openServiceLogStream(logCtx, cli, service.ID, container.LogsOptions{
		Tail:       tail,
		Since:      normalizeSince(input.Since),
		Follow:     false,
		Timestamps: timestamps,
		ShowStdout: stdout,
		ShowStderr: stderr,
		Details:    details,
	})
	if err != nil {
		return nil, err
	}
	if reader == nil {
		return nil, fmt.Errorf("docker returned no log stream for service %q", service.Spec.Name)
	}
	defer func() { _ = reader.Close() }()

	tty := service.Spec.TaskTemplate.ContainerSpec != nil && service.Spec.TaskTemplate.ContainerSpec.TTY
	lines, err := readServiceLogSnapshot(logCtx, reader, tty)
	if err != nil {
		return nil, err
	}

	return map[string]any{
		"serviceId":   service.ID,
		"serviceName": service.Spec.Name,
		"tail":        tail,
		"since":       input.Since,
		"lines":       lines,
	}, nil
}

// addMCPTool marks every registered operation as read-only. List outputs use
// named object fields so clients on earlier MCP protocol versions can consume
// structured content as well as the SDK's text fallback.
func addMCPTool[In, Out any](server *mcp.Server, tool *mcp.Tool, handler mcp.ToolHandlerFor[In, Out]) {
	tool.Annotations = &mcp.ToolAnnotations{ReadOnlyHint: true, IdempotentHint: true}
	mcp.AddTool(server, tool, handler)
}
