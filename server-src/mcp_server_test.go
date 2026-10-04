package main

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
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
