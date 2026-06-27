package main

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestIsCORSOriginAllowed(t *testing.T) {
	t.Setenv(allowedOriginsEnv, "https://dashboard.example.com, https://admin.example.com")

	if !isCORSOriginAllowed("https://dashboard.example.com") {
		t.Fatal("expected configured CORS origin to be allowed")
	}
	if isCORSOriginAllowed("https://evil.example.com") {
		t.Fatal("expected unconfigured CORS origin to be rejected")
	}
}

func TestIsCORSOriginAllowedWildcard(t *testing.T) {
	t.Setenv(allowedOriginsEnv, "*")

	if !isCORSOriginAllowed("https://any.example.com") {
		t.Fatal("expected wildcard CORS origin to be allowed")
	}
}

func TestIsWebSocketOriginAllowedDefaultAllowsAllOrigins(t *testing.T) {
	t.Setenv(allowedOriginsEnv, "")

	req := httptest.NewRequest(http.MethodGet, "http://dashboard.local/docker/logs/svc", nil)
	req.Header.Set("Origin", "http://dashboard.local")
	if !isWebSocketOriginAllowed(req) {
		t.Fatal("expected same-origin websocket request to be allowed by default")
	}

	req.Header.Set("Origin", "https://evil.example.com")
	if !isWebSocketOriginAllowed(req) {
		t.Fatal("expected cross-origin websocket request to remain allowed by default")
	}
}

func TestIsWebSocketOriginAllowedConfiguredOrigin(t *testing.T) {
	t.Setenv(allowedOriginsEnv, "https://dashboard.example.com")

	req := httptest.NewRequest(http.MethodGet, "http://dashboard.local/docker/logs/svc", nil)
	req.Header.Set("Origin", "https://dashboard.example.com")
	if !isWebSocketOriginAllowed(req) {
		t.Fatal("expected configured websocket origin to be allowed")
	}

	req.Header.Set("Origin", "http://dashboard.local")
	if isWebSocketOriginAllowed(req) {
		t.Fatal("expected unconfigured websocket origin to be rejected when allow-list is set")
	}
}

func TestBuildHandlerCORSAllowedOrigin(t *testing.T) {
	t.Setenv(allowedOriginsEnv, "https://dashboard.example.com")

	req := httptest.NewRequest(http.MethodOptions, "/health", nil)
	req.Header.Set("Origin", "https://dashboard.example.com")
	req.Header.Set("Access-Control-Request-Method", http.MethodGet)
	w := httptest.NewRecorder()

	buildHandler().ServeHTTP(w, req)

	if got := w.Result().Header.Get("Access-Control-Allow-Origin"); got != "https://dashboard.example.com" {
		t.Fatalf("expected configured CORS origin header, got %q", got)
	}
}

func TestBuildHandlerCORSDefaultAllowsAllOrigins(t *testing.T) {
	t.Setenv(allowedOriginsEnv, "")

	req := httptest.NewRequest(http.MethodOptions, "/health", nil)
	req.Header.Set("Origin", "https://any.example.com")
	req.Header.Set("Access-Control-Request-Method", http.MethodGet)
	w := httptest.NewRecorder()

	buildHandler().ServeHTTP(w, req)

	if got := w.Result().Header.Get("Access-Control-Allow-Origin"); got != "https://any.example.com" {
		t.Fatalf("expected default CORS origin header to allow request origin, got %q", got)
	}
}

func TestBuildHandlerCORSDeniedOrigin(t *testing.T) {
	t.Setenv(allowedOriginsEnv, "https://dashboard.example.com")

	req := httptest.NewRequest(http.MethodOptions, "/health", nil)
	req.Header.Set("Origin", "https://evil.example.com")
	req.Header.Set("Access-Control-Request-Method", http.MethodGet)
	w := httptest.NewRecorder()

	buildHandler().ServeHTTP(w, req)

	if got := w.Result().Header.Get("Access-Control-Allow-Origin"); got != "" {
		t.Fatalf("expected no CORS origin header for denied origin, got %q", got)
	}
}
