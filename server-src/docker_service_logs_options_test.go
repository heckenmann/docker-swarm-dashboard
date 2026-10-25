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
	cases := map[string]int{"10": 10, "1": 1, "all": -1, "": -1, "0": 0, "-5": defaultTail, "invalid": defaultTail, "9999999999999999999999": defaultTail}
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
		if strings.Contains(r.URL.Path, "/services/") && !strings.Contains(r.URL.Path, "/logs") {
			_, _ = w.Write([]byte(`{"Spec":{"TaskTemplate":{"ContainerSpec":{"TTY":false}}}}`))
			return
		}
		if strings.Contains(r.URL.Path, "/services/") && strings.Contains(r.URL.Path, "/logs") {
			select {
			case sinceCh <- r.URL.Query().Get("since"):
			default:
			}
			_, _ = w.Write(logTestFrame("hello\n"))
			if f, ok := w.(http.Flusher); ok {
				f.Flush()
			}
			if r.URL.Query().Get("follow") == "1" || r.URL.Query().Get("follow") == "true" {
				<-done
			}
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

func TestDockerServiceLogsHandler_TailSemantics(t *testing.T) {
	for _, tc := range []struct {
		name, tail, dockerTail string
		count                  int
	}{
		{"omitted", "", "all", 25}, {"all", "all", "all", 25}, {"zero", "0", "0", 0},
		{"positive", "5", "5", 5}, {"larger than history", "30", "30", 25},
		{"invalid", "invalid", "20", 20}, {"negative", "-5", "20", 20},
		{"overflow", "9999999999999999999999", "20", 20},
	} {
		t.Run(tc.name, func(t *testing.T) {
			observed := make(chan string, 1)
			dockerSrv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if !strings.HasSuffix(r.URL.Path, "/logs") {
					_, _ = w.Write([]byte(`{"Spec":{"TaskTemplate":{"ContainerSpec":{"TTY":false}}}}`))
					return
				}
				observed <- r.URL.Query().Get("tail")
				for i := 1; i <= 25; i++ {
					_, _ = w.Write(logTestFrame("line-" + strconv.Itoa(i) + "\n"))
				}
			}))
			defer dockerSrv.Close()
			defer ResetCli()
			SetCli(makeClientForServer(t, dockerSrv.URL))
			router := mux.NewRouter()
			router.HandleFunc("/docker/logs/{id}", dockerServiceLogsHandler)
			server := httptest.NewServer(router)
			defer server.Close()
			address := "ws" + strings.TrimPrefix(server.URL, "http") + "/docker/logs/svc1?stdout=true&follow=false"
			if tc.tail != "" {
				address += "&tail=" + url.QueryEscape(tc.tail)
			}
			conn, _, err := websocket.DefaultDialer.Dial(address, nil)
			if err != nil {
				t.Fatal(err)
			}
			defer func() { _ = conn.Close() }()
			_ = conn.SetReadDeadline(time.Now().Add(2 * time.Second))
			var got []string
			for {
				_, msg, err := conn.ReadMessage()
				if err != nil {
					if !websocket.IsCloseError(err, websocket.CloseNormalClosure) {
						t.Fatalf("unexpected close: %v", err)
					}
					break
				}
				got = append(got, string(msg))
			}
			if len(got) != tc.count {
				t.Fatalf("got %d lines, want %d", len(got), tc.count)
			}
			for i, line := range got {
				want := "line-" + strconv.Itoa(26-tc.count+i)
				if line != want {
					t.Fatalf("got %q, want %q", line, want)
				}
			}
			if tail := <-observed; tail != tc.dockerTail {
				t.Fatalf("Docker tail=%q, want %q", tail, tc.dockerTail)
			}
		})
	}
}
