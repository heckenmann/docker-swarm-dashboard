package main

import (
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
	"time"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
)

// Writer-level tests for writeLogPipeToClient live in `write_log_pipe_test.go`.
// The handler-level websocket test below verifies that the handler integrates
// with the writer; keep writer unit tests centralized in the dedicated file.

// TestDockerServiceLogsHandler_StreamsToWebsocket sets up a fake Docker API
// that serves log bytes prefixed with 8 bytes and verifies the websocket
// client receives trimmed payloads. This was previously an integration test
// and is included here as a deterministic unit-style test using httptest.
func TestDockerServiceLogsHandler_StreamsToWebsocket(t *testing.T) {
	// Fake Docker API that returns a single log line prefixed with 8 bytes.
	// Use a channel to keep the connection open until the test has read
	// the websocket message to avoid racing/EOFs.
	done := make(chan struct{})
	dockerSrv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.Contains(r.URL.Path, "/services/") && strings.Contains(r.URL.Path, "/logs") {
			// Write a single log frame; the handler strips first 8 bytes
			w.Write([]byte("12345678hello\n"))
			// flush so the client receives the bytes immediately
			if f, ok := w.(http.Flusher); ok {
				f.Flush()
			}
			// block until test signals done
			<-done
			return
		}
		http.NotFound(w, r)
	}))
	defer dockerSrv.Close()

	// Inject docker client pointing to fake Docker API
	defer ResetCli()
	SetCli(makeClientForServer(t, dockerSrv.URL))

	// Start handler server with mux so mux.Vars works
	r := mux.NewRouter()
	r.HandleFunc("/docker/logs/{id}", dockerServiceLogsHandler)
	srv := httptest.NewServer(r)
	defer srv.Close()

	// Connect as websocket client
	wsURL := "ws" + strings.TrimPrefix(srv.URL, "http")
	// Build URL with required query params expected by handler
	u, _ := url.Parse(wsURL + "/docker/logs/svc1")
	q := u.Query()
	q.Set("tail", "10")
	q.Set("since", "0")
	q.Set("stdout", "true")
	q.Set("stderr", "false")
	q.Set("follow", "false")
	q.Set("timestamps", "false")
	q.Set("details", "false")
	u.RawQuery = q.Encode()

	dialer := websocket.Dialer{}
	conn, _, err := dialer.Dial(u.String(), nil)
	if err != nil {
		t.Fatalf("dial: %v", err)
	}
	defer conn.Close()

	conn.SetReadDeadline(time.Now().Add(2 * time.Second))
	_, msg, err := conn.ReadMessage()
	if err != nil {
		// signal server to finish before failing so it doesn't leak goroutine
		close(done)
		t.Fatalf("read: %v", err)
	}
	if string(msg) != "hello" {
		close(done)
		t.Fatalf("expected 'hello', got '%s'", string(msg))
	}
	// allow docker fake server handler to complete
	close(done)
}
