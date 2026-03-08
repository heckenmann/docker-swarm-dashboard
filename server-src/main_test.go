package main

import (
	"context"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	dockclient "github.com/docker/docker/client"
)

// TestBuildHandler_PathPrefixRedirect verifies that when a pathPrefix is set,
// the root path redirects to the prefixed root.
func TestBuildHandler_PathPrefixRedirect(t *testing.T) {
	// set path prefix and restore
	prev := pathPrefix
	pathPrefix = "/myprefix"
	defer func() { pathPrefix = prev }()

	h := buildHandler()
	srv := httptest.NewServer(h)
	defer srv.Close()

	// Use client that doesn't follow redirects so we can assert the redirect response
	client := &http.Client{CheckRedirect: func(req *http.Request, via []*http.Request) error {
		return http.ErrUseLastResponse
	}}
	res, err := client.Get(srv.URL + "/")
	if err != nil {
		t.Fatalf("get failed: %v", err)
	}
	if res.StatusCode != http.StatusTemporaryRedirect {
		t.Fatalf("expected redirect got %d", res.StatusCode)
	}
	// ensure Location header points to prefixed root
	if loc := res.Header.Get("Location"); loc != pathPrefix+"/" && loc != srv.URL+pathPrefix+"/" {
		t.Fatalf("unexpected Location header: %s", loc)
	}
}

// TestBuildHandler_DefaultNoPrefix ensures building handler with empty prefix does not error.
func TestBuildHandler_DefaultNoPrefix(t *testing.T) {
	prev := pathPrefix
	pathPrefix = ""
	defer func() { pathPrefix = prev }()
	_ = buildHandler()
}

// TestGetHTTPPort_Default verifies getHTTPPort returns the default port when
// the environment variable is not set.
func TestGetHTTPPort_Default(t *testing.T) {
	old := os.Getenv("DSD_HTTP_PORT")
	defer func() { _ = os.Setenv("DSD_HTTP_PORT", old) }()
	_ = os.Unsetenv("DSD_HTTP_PORT")

	p := getHTTPPort()
	if p != "8080" {
		t.Fatalf("expected default port 8080, got %s", p)
	}
}

// TestGetHTTPPort_FromEnv verifies getHTTPPort reads the port from the
// DSD_HTTP_PORT environment variable when present.
func TestGetHTTPPort_FromEnv(t *testing.T) {
	old := os.Getenv("DSD_HTTP_PORT")
	defer func() { _ = os.Setenv("DSD_HTTP_PORT", old) }()
	_ = os.Setenv("DSD_HTTP_PORT", "9090")

	p := getHTTPPort()
	if p != "9090" {
		t.Fatalf("expected port 9090 from env, got %s", p)
	}
}

// TestGetCli_Singleton verifies getCli returns the same injected client
// instance across multiple calls (singleton behavior for tests).
func TestGetCli_Singleton(t *testing.T) {
	defer ResetCli()
	// create a dummy client and inject it
	cNew, err := dockclient.NewClientWithOpts(dockclient.WithHost("http://127.0.0.1:1"), dockclient.WithVersion("1.35"))
	if err != nil {
		t.Fatalf("failed to create dummy docker client: %v", err)
	}
	SetCli(cNew)

	c1 := getCli()
	if c1 != cNew {
		t.Fatalf("expected getCli to return injected client instance")
	}
	c2 := getCli()
	if c1 != c2 {
		t.Fatalf("expected same client instance across calls")
	}
}

// TestHealthHandler_DockerUnreachable_Returns503 ensures the /health
// handler returns 503 when the Docker client cannot reach the Docker
// daemon.
func TestHealthHandler_DockerUnreachable_Returns503(t *testing.T) {
	defer ResetCli()
	// inject a client that points at a non-existing socket/port so Info() fails
	cBad, err := dockclient.NewClientWithOpts(dockclient.WithHost("unix:///nonexistent.sock"), dockclient.WithVersion("1.35"))
	if err != nil {
		// client creation could succeed even if host is unreachable; only fail test if creation itself errors
		t.Fatalf("failed to create docker client for unreachable host: %v", err)
	}
	SetCli(cBad)

	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	w := httptest.NewRecorder()

	healthHandler(w, req)
	resp := w.Result()
	if resp.StatusCode != http.StatusServiceUnavailable {
		t.Fatalf("expected 503 when docker unreachable, got %d", resp.StatusCode)
	}
}

// TestHealthHandler_MockedDockerServer_OK ensures the /health handler
// returns 200 OK when the injected Docker client points to a server
// that responds to Info requests.
func TestHealthHandler_MockedDockerServer_OK(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// docker client may call /v{version}/info
		if r.URL.Path == "/v1.35/info" || r.URL.Path == "/v1.35.0/info" || r.URL.Path == "/v1.35/" {
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte(`{"ID":"test"}`))
			return
		}
		http.NotFound(w, r)
	}))
	defer server.Close()

	defer ResetCli()
	// create a client that points to the test server and inject it
	cMock, err := dockclient.NewClientWithOpts(dockclient.WithHost(server.URL), dockclient.WithVersion("1.35"))
	if err != nil {
		t.Fatalf("failed to create docker client for mocked server: %v", err)
	}
	SetCli(cMock)

	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	w := httptest.NewRecorder()

	healthHandler(w, req)
	resp := w.Result()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200 OK from mocked docker server, got %d", resp.StatusCode)
	}

	// ensure client.Info also succeeds against the mocked server
	_, err = getCli().Info(context.Background())
	if err != nil {
		t.Fatalf("expected Info() to succeed against mocked server, got %v", err)
	}
}
