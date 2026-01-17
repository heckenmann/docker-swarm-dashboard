package main

import (
	"net/http"
	"testing"

	dockclient "github.com/docker/docker/client"
	"github.com/gorilla/mux"
)

// helper to create a docker client that points at serverURL
func makeClientForServer(t *testing.T, serverURL string) *dockclient.Client {
	c, err := dockclient.NewClientWithOpts(dockclient.WithHost(serverURL), dockclient.WithVersion("1.35"))
	if err != nil {
		t.Fatalf("failed to create docker client: %v", err)
	}
	return c
}

// muxSetVars sets mux URL vars on a request
func muxSetVars(r *http.Request, vars map[string]string) *http.Request {
	return mux.SetURLVars(r, vars)
}
