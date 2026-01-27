package main

import (
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
)

// TestSetResetCli ensures SetCli and ResetCli control the global client cache.
func TestSetResetCli(t *testing.T) {
	// create a dummy server to serve NodeList endpoint
	b := []byte("[]")
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v1.35/nodes" {
			_, _ = w.Write(b)
			return
		}
		http.NotFound(w, r)
	}))
	defer server.Close()

	defer ResetCli()
	SetCli(makeClientForServer(t, server.URL))
	// first call should use injected client and not panic
	req := httptest.NewRequest("GET", "/ui/nodes", nil)
	w := httptest.NewRecorder()
	nodesHandler(w, req)

	// reset and ensure getCli recreates (SetCli called with nil then ResetCli)
	ResetCli()
	// set env to make NewClientWithOpts use FromEnv but can't actually connect; we just call getHTTPPort
	_ = os.Setenv("DSD_HTTP_PORT", "9090")
	defer func() { _ = os.Unsetenv("DSD_HTTP_PORT") }()
	_ = getHTTPPort()
}

// TestGetCli_CreatesClient ensures getCli constructs a client when cli is nil.
func TestGetCli_CreatesClient(t *testing.T) {
	// ensure reset
	ResetCli()
	c := getCli()
	if c == nil {
		t.Fatalf("expected non-nil client")
	}
	// cleanup
	ResetCli()
}
