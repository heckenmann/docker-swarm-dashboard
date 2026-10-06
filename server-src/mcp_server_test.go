package main

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"slices"
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
	for _, protocol := range []string{"2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"} {
		t.Run(protocol, func(t *testing.T) {
			recorder := httptest.NewRecorder()
			request := newMCPInitializeRequest("/mcp")
			payload := strings.Replace(mcpInitializePayload, "2025-06-18", protocol, 1)
			request.Body = io.NopCloser(strings.NewReader(payload))
			request.ContentLength = int64(len(payload))
			newMCPHTTPHandler().ServeHTTP(recorder, request)
			if recorder.Code != http.StatusOK {
				t.Fatalf("expected 200 from MCP initialize, got %d: %s", recorder.Code, recorder.Body.String())
			}
			if !strings.Contains(recorder.Body.String(), "docker-swarm-dashboard") {
				t.Fatalf("expected MCP server name: %s", recorder.Body.String())
			}
			var response struct {
				Result struct {
					ProtocolVersion string `json:"protocolVersion"`
				} `json:"result"`
			}
			if err := json.Unmarshal(recorder.Body.Bytes(), &response); err != nil {
				t.Fatal(err)
			}
			if response.Result.ProtocolVersion != protocol {
				t.Fatalf("negotiated %q, want %q", response.Result.ProtocolVersion, protocol)
			}

		})
	}
}

// Current clients use discovery; legacy clients retain initialize negotiation.
func TestMCPHTTPHandler_Discover(t *testing.T) {
	request := newMCPInitializeRequest("/mcp")
	payload := `{"jsonrpc":"2.0","id":1,"method":"server/discover","params":{"_meta":{"io.modelcontextprotocol/protocolVersion":"2026-07-28","io.modelcontextprotocol/clientInfo":{"name":"dashboard-test","version":"1.0.0"},"io.modelcontextprotocol/clientCapabilities":{}}}}`
	request.Body = io.NopCloser(strings.NewReader(payload))
	request.ContentLength = int64(len(payload))
	request.Header.Set("Mcp-Protocol-Version", "2026-07-28")
	request.Header.Set("Mcp-Method", "server/discover")
	recorder := httptest.NewRecorder()
	newMCPHTTPHandler().ServeHTTP(recorder, request)
	if recorder.Code != http.StatusOK {
		t.Fatalf("discovery returned %d: %s", recorder.Code, recorder.Body.String())
	}
	var response struct {
		Result struct {
			SupportedVersions []string `json:"supportedVersions"`
		} `json:"result"`
	}
	if err := json.Unmarshal(recorder.Body.Bytes(), &response); err != nil {
		t.Fatal(err)
	}
	if !slices.Contains(response.Result.SupportedVersions, "2026-07-28") || !strings.Contains(recorder.Body.String(), "docker-swarm-dashboard") {
		t.Fatalf("missing current protocol or server identity: %s", recorder.Body.String())
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

func TestMCPHTTPHandler_CORSPreflight(t *testing.T) {
	t.Setenv(allowedOriginsEnv, "https://agent.example.com")
	previousPrefix, previousEnabled := pathPrefix, mcpEnabled
	pathPrefix, mcpEnabled = "/dashboard", true
	t.Cleanup(func() { pathPrefix, mcpEnabled = previousPrefix, previousEnabled })
	for _, headers := range []string{
		"Content-Type, Mcp-Protocol-Version",
		"Content-Type, Mcp-Protocol-Version, Mcp-Method, Mcp-Name",
	} {
		t.Run(headers, func(t *testing.T) {
			request := httptest.NewRequest(http.MethodOptions, "/dashboard/mcp", nil)
			request.Header.Set("Origin", "https://agent.example.com")
			request.Header.Set("Access-Control-Request-Method", http.MethodPost)
			request.Header.Set("Access-Control-Request-Headers", headers)
			recorder := httptest.NewRecorder()
			buildHandler().ServeHTTP(recorder, request)
			if recorder.Code < 200 || recorder.Code >= 300 {
				t.Fatalf("preflight returned %d: %s", recorder.Code, recorder.Body.String())
			}
			if recorder.Header().Get("Access-Control-Allow-Origin") != "https://agent.example.com" {
				t.Fatal("missing allowed origin")
			}
			allowed := strings.ToLower(recorder.Header().Get("Access-Control-Allow-Headers"))
			for _, header := range strings.Split(headers, ",") {
				if !strings.Contains(allowed, strings.ToLower(strings.TrimSpace(header))) {
					t.Fatalf("header %q not allowed: %q", header, allowed)
				}
			}
		})
	}
}
