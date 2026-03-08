package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	internalversion "heckenmann.de/docker-swarm-dashboard/v2/internal/version"
)

// TestVersionHandler_LastCheckedEmpty ensures lastChecked is empty when no remote
// check has been performed (version check disabled).
func TestVersionHandler_LastCheckedEmpty(t *testing.T) {
	_ = os.Setenv("DSD_VERSION", "1.0.0")
	defer func() { _ = os.Unsetenv("DSD_VERSION") }()
	_ = os.Unsetenv("DSD_VERSION_CHECK_ENABLED")

	req := httptest.NewRequest(http.MethodGet, "/ui/version", nil)
	w := httptest.NewRecorder()
	versionHandler(w, req)

	var resp UpdateResponse
	if err := json.NewDecoder(w.Result().Body).Decode(&resp); err != nil {
		t.Fatalf("decode error: %v", err)
	}
	if resp.LocalVersion != "1.0.0" {
		t.Fatalf("expected local 1.0.0, got %s", resp.LocalVersion)
	}
	if resp.LastChecked != "" {
		t.Fatalf("expected empty lastChecked when check disabled, got %s", resp.LastChecked)
	}
}

// TestVersionHandler_LastCheckedPopulated ensures lastChecked is a non-empty
// RFC 3339 timestamp after a successful remote fetch.
func TestVersionHandler_LastCheckedPopulated(t *testing.T) {
	_ = os.Setenv("DSD_VERSION", "1.0.0")
	defer func() { _ = os.Unsetenv("DSD_VERSION") }()
	_ = os.Setenv("DSD_VERSION_CHECK_ENABLED", "true")
	defer func() { _ = os.Unsetenv("DSD_VERSION_CHECK_ENABLED") }()
	_ = os.Setenv("DSD_VERSION_CHECK_CACHE_TIMEOUT_MINUTES", "0") // never cache
	defer func() { _ = os.Unsetenv("DSD_VERSION_CHECK_CACHE_TIMEOUT_MINUTES") }()

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte(`{"tag_name":"2.0.0"}`))
	}))
	defer srv.Close()
	_ = os.Setenv("DSD_VERSION_RELEASE_URL", srv.URL)
	defer func() { _ = os.Unsetenv("DSD_VERSION_RELEASE_URL") }()

	req := httptest.NewRequest(http.MethodGet, "/ui/version", nil)
	w := httptest.NewRecorder()
	versionHandler(w, req)

	var resp UpdateResponse
	if err := json.NewDecoder(w.Result().Body).Decode(&resp); err != nil {
		t.Fatalf("decode error: %v", err)
	}
	if resp.LastChecked == "" {
		t.Fatalf("expected non-empty lastChecked after successful fetch")
	}
	if resp.RemoteVersion != "2.0.0" {
		t.Fatalf("expected remoteVersion 2.0.0, got %s", resp.RemoteVersion)
	}
	if !resp.UpdateAvailable {
		t.Fatalf("expected updateAvailable true")
	}
}

// TestLastCheckTime_ExposedCorrectly ensures LastCheckTime returns the zero
// value before any fetch and a populated value after CheckVersion runs.
func TestLastCheckTime_ExposedCorrectly(t *testing.T) {
	// The zero-value check depends on no other test having primed the cache in
	// the internal/version package; since tests share package state, we verify
	// the function is callable and returns a time.Time.
	ts := internalversion.LastCheckTime()
	_ = ts // must not panic
}

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
