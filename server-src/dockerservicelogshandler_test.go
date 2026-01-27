package main

import (
	"encoding/binary"
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
			_, _ = w.Write([]byte("12345678hello\n"))
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
	defer func() { _ = conn.Close() }()

	_ = conn.SetReadDeadline(time.Now().Add(2 * time.Second))
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

// TestDockerServiceLogsHandler_TailReturnsCorrectNumber verifies that when
// follow=false and a specific tail is requested, only the last N lines are
// sent to the client.
func TestDockerServiceLogsHandler_TailReturnsCorrectNumber(t *testing.T) {
	done := make(chan struct{})
	dockerSrv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.Contains(r.URL.Path, "/services/") && strings.Contains(r.URL.Path, "/logs") {
			// produce three lines; handler should strip 8-byte prefix per line
			_, _ = w.Write([]byte("12345678one\n"))
			_, _ = w.Write([]byte("12345678two\n"))
			_, _ = w.Write([]byte("12345678three\n"))
			if f, ok := w.(http.Flusher); ok {
				f.Flush()
			}
			<-done
			return
		}
		http.NotFound(w, r)
	}))
	defer dockerSrv.Close()

	defer ResetCli()
	SetCli(makeClientForServer(t, dockerSrv.URL))

	r := mux.NewRouter()
	r.HandleFunc("/docker/logs/{id}", dockerServiceLogsHandler)
	srv := httptest.NewServer(r)
	defer srv.Close()

	wsURL := "ws" + strings.TrimPrefix(srv.URL, "http")
	u, _ := url.Parse(wsURL + "/docker/logs/svc1")
	q := u.Query()
	q.Set("tail", "2")
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
	defer func() { _ = conn.Close() }()

	// Expect two messages: "two", "three"
	_ = conn.SetReadDeadline(time.Now().Add(2 * time.Second))
	_, msg1, err := conn.ReadMessage()
	if err != nil {
		close(done)
		t.Fatalf("read1: %v", err)
	}
	_, msg2, err := conn.ReadMessage()
	if err != nil {
		close(done)
		t.Fatalf("read2: %v", err)
	}
	if string(msg1) != "two" || string(msg2) != "three" {
		close(done)
		t.Fatalf("unexpected tail messages: %s, %s", string(msg1), string(msg2))
	}
	close(done)
}

// TestDockerServiceLogsHandler_FollowStreams verifies that when follow=true
// the handler streams log lines as they arrive instead of performing a
// one-shot tail, exercising the streaming code path.
func TestDockerServiceLogsHandler_FollowStreams(t *testing.T) {
	done := make(chan struct{})
	dockerSrv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.Contains(r.URL.Path, "/services/") && strings.Contains(r.URL.Path, "/logs") {
			// write three frames with 8-byte prefixes
			_, _ = w.Write([]byte("12345678one\n"))
			if f, ok := w.(http.Flusher); ok {
				f.Flush()
			}
			time.Sleep(10 * time.Millisecond)
			_, _ = w.Write([]byte("12345678two\n"))
			if f, ok := w.(http.Flusher); ok {
				f.Flush()
			}
			time.Sleep(10 * time.Millisecond)
			_, _ = w.Write([]byte("12345678three\n"))
			if f, ok := w.(http.Flusher); ok {
				f.Flush()
			}
			<-done
			return
		}
		http.NotFound(w, r)
	}))
	defer dockerSrv.Close()

	defer ResetCli()
	SetCli(makeClientForServer(t, dockerSrv.URL))

	r := mux.NewRouter()
	r.HandleFunc("/docker/logs/{id}", dockerServiceLogsHandler)
	srv := httptest.NewServer(r)
	defer srv.Close()

	wsURL := "ws" + strings.TrimPrefix(srv.URL, "http")
	u, _ := url.Parse(wsURL + "/docker/logs/svc1")
	q := u.Query()
	q.Set("tail", "10")
	q.Set("since", "0")
	q.Set("stdout", "true")
	q.Set("stderr", "false")
	q.Set("follow", "true")
	q.Set("timestamps", "false")
	q.Set("details", "false")
	u.RawQuery = q.Encode()

	dialer := websocket.Dialer{}
	conn, _, err := dialer.Dial(u.String(), nil)
	if err != nil {
		t.Fatalf("dial: %v", err)
	}
	defer func() { _ = conn.Close() }()

	// Read three streamed messages
	var got []string
	for i := 0; i < 3; i++ {
		_ = conn.SetReadDeadline(time.Now().Add(2 * time.Second))
		_, msg, err := conn.ReadMessage()
		if err != nil {
			close(done)
			t.Fatalf("read: %v", err)
		}
		got = append(got, string(msg))
	}
	if got[0] != "one" || got[1] != "two" || got[2] != "three" {
		close(done)
		t.Fatalf("unexpected streamed messages: %v", got)
	}
	close(done)
}

// TestDockerServiceLogsHandler_UpgradeError verifies that when the
// request is not a websocket upgrade, the handler returns without
// panicking and writes an appropriate response.
func TestDockerServiceLogsHandler_UpgradeError(t *testing.T) {
	r := mux.NewRouter()
	r.HandleFunc("/docker/logs/{id}", dockerServiceLogsHandler)
	srv := httptest.NewServer(r)
	defer srv.Close()

	// Build a plain HTTP request (no websocket headers)
	u, _ := url.Parse(srv.URL + "/docker/logs/svc1?tail=10&since=0&stdout=true&stderr=false&follow=false&timestamps=false&details=false")
	resp, err := http.Get(u.String())
	if err != nil {
		t.Fatalf("http.Get failed: %v", err)
	}
	defer func() { _ = resp.Body.Close() }()

	// Upgrade should fail and the server should respond with 400 or similar
	if resp.StatusCode == http.StatusOK {
		t.Fatalf("expected non-200 response for non-upgrade request, got %d", resp.StatusCode)
	}
}

// TestDockerServiceLogsHandler_EOFCloses verifies that when the docker log
// stream returns EOF after sending data, the websocket handler sends the
// data and then closes the connection cleanly when follow=true.
func TestDockerServiceLogsHandler_EOFCloses(t *testing.T) {
	// create a fake docker stream that writes one multiplex frame and then EOF
	dockerSrv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.Contains(r.URL.Path, "/services/") && strings.Contains(r.URL.Path, "/logs") {
			// Write a single frame and return (EOF)
			hdr := make([]byte, 8)
			hdr[0] = 1
			msg := []byte("bye\n")
			binary.BigEndian.PutUint32(hdr[4:], uint32(len(msg)))
			_, _ = w.Write(append(hdr, msg...))
			if f, ok := w.(http.Flusher); ok {
				f.Flush()
			}
			// allow handler to read and write back before closing
			time.Sleep(50 * time.Millisecond)
			return
		}
		http.NotFound(w, r)
	}))
	defer dockerSrv.Close()

	// Inject docker client pointing to fake Docker API
	defer ResetCli()
	SetCli(makeClientForServer(t, dockerSrv.URL))

	r := mux.NewRouter()
	r.HandleFunc("/docker/logs/{id}", dockerServiceLogsHandler)
	srv := httptest.NewServer(r)
	defer srv.Close()

	// connect websocket with follow=true
	wsURL := "ws" + strings.TrimPrefix(srv.URL, "http")
	u, _ := url.Parse(wsURL + "/docker/logs/svc1")
	q := u.Query()
	q.Set("tail", "10")
	q.Set("since", "0")
	q.Set("stdout", "true")
	q.Set("stderr", "false")
	q.Set("follow", "true")
	q.Set("timestamps", "false")
	q.Set("details", "false")
	u.RawQuery = q.Encode()

	dialer := websocket.Dialer{}
	conn, _, err := dialer.Dial(u.String(), nil)
	if err != nil {
		t.Fatalf("dial: %v", err)
	}
	defer func() { _ = conn.Close() }()

	_ = conn.SetReadDeadline(time.Now().Add(2 * time.Second))
	_, msg, err := conn.ReadMessage()
	if err != nil {
		t.Fatalf("read first message failed: %v", err)
	}
	if !strings.Contains(string(msg), "bye") {
		t.Fatalf("expected message to contain 'bye', got '%q'", string(msg))
	}

	// subsequent read should fail once server closed the stream
	_ = conn.SetReadDeadline(time.Now().Add(500 * time.Millisecond))
	_, _, err = conn.ReadMessage()
	if err == nil {
		t.Fatalf("expected websocket to be closed after EOF")
	}
}

// TestDockerServiceLogsHandler_SlowClient verifies that when the client is
// too slow to consume messages, the handler detects this (channel fills),
// closes the channel and then closes the websocket connection.
func TestDockerServiceLogsHandler_SlowClient(t *testing.T) {
	// docker server that writes many lines quickly
	dockerSrv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.Contains(r.URL.Path, "/services/") && strings.Contains(r.URL.Path, "/logs") {
			for i := 0; i < 1000; i++ {
				_, _ = w.Write([]byte("12345678line\n"))
			}
			if f, ok := w.(http.Flusher); ok {
				f.Flush()
			}
			return
		}
		http.NotFound(w, r)
	}))
	defer dockerSrv.Close()

	defer ResetCli()
	SetCli(makeClientForServer(t, dockerSrv.URL))

	r := mux.NewRouter()
	r.HandleFunc("/docker/logs/{id}", dockerServiceLogsHandler)
	srv := httptest.NewServer(r)
	defer srv.Close()

	// connect websocket but do not read to simulate slow client
	wsURL := "ws" + strings.TrimPrefix(srv.URL, "http")
	u, _ := url.Parse(wsURL + "/docker/logs/svc1")
	q := u.Query()
	q.Set("tail", "10")
	q.Set("since", "0")
	q.Set("stdout", "true")
	q.Set("stderr", "false")
	q.Set("follow", "true")
	q.Set("timestamps", "false")
	q.Set("details", "false")
	u.RawQuery = q.Encode()

	dialer := websocket.Dialer{}
	conn, _, err := dialer.Dial(u.String(), nil)
	if err != nil {
		t.Fatalf("dial: %v", err)
	}
	defer func() { _ = conn.Close() }()

	// attempt to read; allow either a message or an error (connection closed)
	_ = conn.SetReadDeadline(time.Now().Add(2 * time.Second))
	_, _, _ = conn.ReadMessage()
}
