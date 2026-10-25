package docker

import (
	"context"
	"net"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

// Exercise the shared, unmodified SDK client against a socket that disappears
// and is recreated, without restarting the dashboard or resetting its client.
func TestClientRecoversAfterSocketOutage(t *testing.T) {
	for _, initiallyAvailable := range []bool{false, true} {
		name := "unavailable_at_startup"
		if initiallyAvailable {
			name = "established_connection"
		}
		t.Run(name, func(t *testing.T) {
			dir, err := os.MkdirTemp("", "dsd-reconnect-")
			if err != nil {
				t.Fatal(err)
			}
			t.Cleanup(func() {
				if err := os.RemoveAll(dir); err != nil {
					t.Error(err)
				}
			})
			socket := filepath.Join(dir, "docker.sock")
			t.Setenv("DOCKER_HOST", "unix://"+socket)
			t.Setenv("DOCKER_API_VERSION", "")
			t.Setenv("DOCKER_TLS_VERIFY", "")
			t.Setenv("DOCKER_CERT_PATH", "")
			ResetCli()
			t.Cleanup(ResetCli)
			cli, err := GetCli()
			if err != nil {
				t.Fatal(err)
			}
			t.Cleanup(func() {
				if err := cli.Close(); err != nil {
					t.Error(err)
				}
			})
			start := func() *httptest.Server {
				t.Helper()
				listener, err := net.Listen("unix", socket)
				if err != nil {
					t.Fatal(err)
				}
				server := httptest.NewUnstartedServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					w.Header().Set("API-Version", "1.47")
					w.Header().Set("Content-Type", "application/json")
					if r.URL.Path == "/_ping" {
						w.WriteHeader(http.StatusOK)
						return
					}
					if !strings.HasSuffix(r.URL.Path, "/info") {
						http.NotFound(w, r)
						return
					}
					if _, err := w.Write([]byte(`{"ID":"recovered-daemon"}`)); err != nil {
						t.Error(err)
					}
				}))
				if err := server.Listener.Close(); err != nil {
					t.Fatal(err)
				}
				server.Listener = listener
				server.Start()
				t.Cleanup(server.Close)
				return server
			}
			ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
			defer cancel()
			if initiallyAvailable {
				server := start()
				if _, err := cli.Info(ctx); err != nil {
					t.Fatal(err)
				}
				server.Close()
			}
			if _, err := cli.Info(ctx); err == nil {
				t.Fatal("expected a connection error while the socket is unavailable")
			}
			start()
			shared, err := GetCli()
			if err != nil {
				t.Fatal(err)
			}
			if shared != cli {
				t.Fatal("recovery must use the original cached client")
			}
			info, err := shared.Info(ctx)
			if err != nil {
				t.Fatalf("client did not recover: %v", err)
			}
			if info.ID != "recovered-daemon" {
				t.Fatalf("unexpected recovered response: %q", info.ID)
			}
		})
	}
}
