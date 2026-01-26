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

// TestDockerServiceLogsHandler_ClosesSlowClient ensures that when the
// server-side buffer fills because the client is not reading fast
// enough, the handler closes the websocket connection to free resources.
func TestDockerServiceLogsHandler_ClosesSlowClient(t *testing.T) {
	// Number of messages greater than the internal buffer (512)
	const N = 700

	done := make(chan struct{})
	dockerSrv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.Contains(r.URL.Path, "/services/") && strings.Contains(r.URL.Path, "/logs") {
			// Rapidly write N frames to overflow the server buffer
			for i := 0; i < N; i++ {
				_, _ = w.Write([]byte("12345678msg\n"))
				if f, ok := w.(http.Flusher); ok {
					f.Flush()
				}
			}
			// block until test signals done
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

	// Start a slow reader: read messages but sleep between reads so the
	// server cannot keep up. We expect the server to close the
	// connection when its internal buffer fills.
	readErrCh := make(chan error, 1)
	go func() {
		for {
			_, _, rerr := conn.ReadMessage()
			if rerr != nil {
				readErrCh <- rerr
				return
			}
			// slow down consumption
			time.Sleep(20 * time.Millisecond)
		}
	}()

	// Wait for the reader to observe a close/error, or timeout the test.
	select {
	case err := <-readErrCh:
		// success: server closed connection due to slow client
		_ = err
	case <-time.After(5 * time.Second):
		close(done)
		t.Fatalf("expected connection to be closed due to slow client, but it remained open")
	}

	// allow docker fake server handler to complete
	close(done)
}
