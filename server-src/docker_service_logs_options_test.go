package main

import (
	"net/http"
	"net/http/httptest"
	"net/url"
	"strconv"
	"strings"
	"testing"
	"time"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
)

// TestNormalizeSince verifies that day-based durations are rewritten into
// hours, since Go's time.ParseDuration — used by the Docker client to resolve
// a relative `since` — does not understand days.
func TestNormalizeSince(t *testing.T) {
	cases := []struct {
		in   string
		want string
	}{
		{"1d", "24h"},
		{"2d", "48h"},
		{" 7d ", "168h"},
		{"5m", "5m"},
		{"6h", "6h"},
		{"30s", "30s"},
		{"0", "0"},
		{"", ""},
		{"2023-01-01T12:00:00Z", "2023-01-01T12:00:00Z"},
	}
	for _, tc := range cases {
		if got := normalizeSince(tc.in); got != tc.want {
			t.Errorf("normalizeSince(%q) = %q, want %q", tc.in, got, tc.want)
		}
	}
}

// TestParseLogsOptionsDefaults verifies that missing query parameters do not
// break the request.
func TestParseLogsOptionsDefaults(t *testing.T) {
	r := httptest.NewRequest(http.MethodGet, "/docker/logs/svc1", nil)
	opts := parseLogsOptions(r)

	if opts.tail != "all" {
		t.Errorf("expected tail default 'all', got %q", opts.tail)
	}
	if opts.follow || opts.stdout || opts.stderr || opts.timestamps || opts.details {
		t.Errorf("expected all boolean options to default to false, got %+v", opts)
	}
}

// TestTailCount verifies the fallback used for one-shot requests.
func TestTailCount(t *testing.T) {
	cases := map[string]int{"10": 10, "1": 1, "all": defaultTail, "": defaultTail, "0": defaultTail, "-5": defaultTail}
	for in, want := range cases {
		if got := tailCount(in); got != want {
			t.Errorf("tailCount(%q) = %d, want %d", in, got, want)
		}
	}
}

// TestDockerServiceLogsHandler_SinceInDays verifies end-to-end that a `since`
// expressed in days reaches the Docker daemon as a timestamp instead of
// failing the request and leaving the client without any logs.
func TestDockerServiceLogsHandler_SinceInDays(t *testing.T) {
	done := make(chan struct{})
	sinceCh := make(chan string, 1)
	dockerSrv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.Contains(r.URL.Path, "/services/") && strings.Contains(r.URL.Path, "/logs") {
			select {
			case sinceCh <- r.URL.Query().Get("since"):
			default:
			}
			_, _ = w.Write([]byte("12345678hello\n"))
			if f, ok := w.(http.Flusher); ok {
				f.Flush()
			}
			<-done
			return
		}
		http.NotFound(w, r)
	}))
	defer dockerSrv.Close()
	defer close(done)

	defer ResetCli()
	SetCli(makeClientForServer(t, dockerSrv.URL))

	r := mux.NewRouter()
	r.HandleFunc("/docker/logs/{id}", dockerServiceLogsHandler)
	srv := httptest.NewServer(r)
	defer srv.Close()

	u, _ := url.Parse("ws" + strings.TrimPrefix(srv.URL, "http") + "/docker/logs/svc1")
	q := u.Query()
	q.Set("tail", "20")
	q.Set("since", "2d")
	q.Set("stdout", "true")
	q.Set("stderr", "true")
	q.Set("follow", "false")
	q.Set("timestamps", "false")
	q.Set("details", "false")
	u.RawQuery = q.Encode()

	conn, _, err := websocket.DefaultDialer.Dial(u.String(), nil)
	if err != nil {
		t.Fatalf("dial: %v", err)
	}
	defer func() { _ = conn.Close() }()

	_ = conn.SetReadDeadline(time.Now().Add(2 * time.Second))
	_, msg, err := conn.ReadMessage()
	if err != nil {
		t.Fatalf("expected a log line for since=2d, got error: %v", err)
	}
	if string(msg) != "hello" {
		t.Fatalf("expected 'hello', got %q", string(msg))
	}

	select {
	case since := <-sinceCh:
		ts, convErr := strconv.ParseInt(since, 10, 64)
		if convErr != nil {
			t.Fatalf("expected a unix timestamp for since, got %q", since)
		}
		age := time.Since(time.Unix(ts, 0))
		if age < 47*time.Hour || age > 49*time.Hour {
			t.Fatalf("expected since to be ~48h ago, got %s", age)
		}
	case <-time.After(time.Second):
		t.Fatal("docker daemon was never called")
	}
}
