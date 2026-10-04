package main

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"heckenmann.de/docker-swarm-dashboard/v2/internal/version"
)

const mcpInitializePayload = `{
	"jsonrpc":"2.0",
	"id":1,
	"method":"initialize",
	"params":{
		"protocolVersion":"2025-06-18",
		"capabilities":{},
		"clientInfo":{"name":"dashboard-test","version":"1.0.0"}
	}
}`

func newMCPInitializeRequest(path string) *http.Request {
	req := httptest.NewRequest(http.MethodPost, path, bytes.NewBufferString(mcpInitializePayload))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json, text/event-stream")
	return req
}

func TestMCPHTTPHandler_Initialize(t *testing.T) {
	recorder := httptest.NewRecorder()
	newMCPHTTPHandler().ServeHTTP(recorder, newMCPInitializeRequest("/mcp"))

	if recorder.Code != http.StatusOK {
		t.Fatalf("expected 200 from MCP initialize, got %d: %s", recorder.Code, recorder.Body.String())
	}
	if !strings.Contains(recorder.Body.String(), "docker-swarm-dashboard") {
		t.Fatalf("expected MCP server name in initialize response: %s", recorder.Body.String())
	}
}

func TestBuildHandler_MCPRouteHonorsPathPrefix(t *testing.T) {
	previousPrefix := pathPrefix
	previousEnabled := mcpEnabled
	pathPrefix = "/dashboard"
	mcpEnabled = true
	defer func() {
		pathPrefix = previousPrefix
		mcpEnabled = previousEnabled
	}()

	recorder := httptest.NewRecorder()
	buildHandler().ServeHTTP(recorder, newMCPInitializeRequest("/dashboard/mcp"))

	if recorder.Code != http.StatusOK {
		t.Fatalf("expected prefixed MCP endpoint to initialize, got %d: %s", recorder.Code, recorder.Body.String())
	}
}

func TestBuildHandler_MCPRouteDisabled(t *testing.T) {
	previousPrefix := pathPrefix
	previousEnabled := mcpEnabled
	pathPrefix = ""
	mcpEnabled = false
	defer func() {
		pathPrefix = previousPrefix
		mcpEnabled = previousEnabled
	}()

	recorder := httptest.NewRecorder()
	buildHandler().ServeHTTP(recorder, newMCPInitializeRequest("/mcp"))

	if recorder.Code == http.StatusOK {
		t.Fatal("expected MCP endpoint to be unavailable when disabled")
	}
}

func TestMCPImplementationVersion(t *testing.T) {
	t.Setenv("DSD_VERSION", "1.2.3")
	if version := mcpImplementationVersion(); version != "1.2.3" {
		t.Fatalf("expected configured MCP version, got %q", version)
	}
}

func TestMCPImplementationVersion_Fallbacks(t *testing.T) {
	t.Setenv("DSD_VERSION", "")
	previous := version.BuildVersion
	t.Cleanup(func() { version.BuildVersion = previous })
	version.BuildVersion = "build-test"
	if got := mcpImplementationVersion(); got != "build-test" {
		t.Fatalf("got %q", got)
	}
	version.BuildVersion = ""
	if got := mcpImplementationVersion(); got != "dev" {
		t.Fatalf("got %q", got)
	}
}

func TestMCPRoute_ConfigurationMatrix(t *testing.T) {
	previousPrefix, previousEnabled := pathPrefix, mcpEnabled
	t.Cleanup(func() { pathPrefix = previousPrefix; mcpEnabled = previousEnabled })
	for _, prefix := range []string{"", "/", "/docker-dashboard"} {
		for _, enabled := range []bool{true, false} {
			pathPrefix, mcpEnabled = prefix, enabled
			path := strings.TrimRight(prefix, "/") + "/mcp"
			recorder := httptest.NewRecorder()
			buildHandler().ServeHTTP(recorder, newMCPInitializeRequest(path))
			if (recorder.Code == http.StatusOK) != enabled {
				t.Fatalf("prefix %q enabled %v returned HTTP %d", prefix, enabled, recorder.Code)
			}
		}
	}
}
