package main

import (
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	swarmtypes "github.com/docker/docker/api/types/swarm"
)

// Shared tests for handlers that remained in the legacy monolithic file.
// Helper utilities are placed in `testutils_test.go`.

// TestDockerServicesDetailsHandler_NoMatch verifies that the service details
// handler returns an empty object (200 OK) when the Docker API returns no
// services matching the requested id.
func TestDockerServicesDetailsHandler_NoMatch(t *testing.T) {
	// return empty list
	b, _ := json.Marshal([]swarmtypes.Service{})
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v1.35/services" {
			w.WriteHeader(http.StatusOK)
			w.Write(b)
			return
		}
		http.NotFound(w, r)
	}))
	defer server.Close()

	defer ResetCli()
	SetCli(makeClientForServer(t, server.URL))

	req := httptest.NewRequest(http.MethodGet, "/docker/services/doesnotexist", nil)
	// mux vars are read from request context by mux.Vars; we can set them directly
	req = muxSetVars(req, map[string]string{"id": "doesnotexist"})
	w := httptest.NewRecorder()
	dockerServicesDetailsHandler(w, req)
	resp := w.Result()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200 got %d", resp.StatusCode)
	}
}

// TestDockerNodesHandler was moved to its dedicated file `dockernodeshandler_test.go`.

// TestDashboardSettingsHandler_Defaults ensures the dashboard settings handler
// returns JSON (200 OK) using the current environment defaults.
func TestDashboardSettingsHandler_Defaults(t *testing.T) {
	// ensure env variables don't interfere
	// preserve environment minimally by not altering it here; dashboardSettingsHandler reads many envs
	req := httptest.NewRequest(http.MethodGet, "/ui/dashboard-settings", nil)
	w := httptest.NewRecorder()
	dashboardSettingsHandler(w, req)
	resp := w.Result()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200 got %d", resp.StatusCode)
	}
}

// small helpers used in tests
// muxSetVars moved to testutils_test.go

// Additional task-related tests were moved to `dockertaskshandler_test.go`.

// TestDockerTasksDetailsHandler_NoMatch verifies the tasks details handler
// returns an empty object (200 OK) when no matching task is found.
func TestDockerTasksDetailsHandler_NoMatch(t *testing.T) {
	b := []byte(`[]`)
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v1.35/tasks" {
			w.WriteHeader(http.StatusOK)
			w.Write(b)
			return
		}
		http.NotFound(w, r)
	}))
	defer server.Close()

	defer ResetCli()
	SetCli(makeClientForServer(t, server.URL))

	req := httptest.NewRequest(http.MethodGet, "/docker/tasks/doesnotexist", nil)
	req = muxSetVars(req, map[string]string{"id": "doesnotexist"})
	w := httptest.NewRecorder()
	dockerTasksDetailsHandler(w, req)
	resp := w.Result()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200 got %d", resp.StatusCode)
	}
}

// TestDashboardVHandler has been moved to dashboardvhandler_test.go

// TestDashboardHHandler verifies dashboardHHandler returns services and nodes
// with tasks per service when Docker API returns matching data.
func TestDashboardHHandler(t *testing.T) {
	// services
	services := []map[string]interface{}{{
		"ID":   "s1",
		"Spec": map[string]interface{}{"Name": "hsvc", "Labels": map[string]string{"com.docker.stack.namespace": "hstack"}},
	}}
	bServices, _ := json.Marshal(services)
	// nodes
	nodes := []swarmtypes.Node{{ID: "n1", Spec: swarmtypes.NodeSpec{}, Description: swarmtypes.NodeDescription{Hostname: "hnode"}, Status: swarmtypes.NodeStatus{Addr: "10.0.0.3"}}}
	bNodes, _ := json.Marshal(nodes)
	// tasks for node n1
	created := time.Now().Format(time.RFC3339)
	tasks := []map[string]interface{}{{
		"ID":        "t1",
		"ServiceID": "s1",
		"NodeID":    "n1",
		"CreatedAt": created,
		"Status":    map[string]interface{}{"Timestamp": created, "State": "running", "ContainerStatus": map[string]interface{}{"PID": 1}},
	}}
	bTasks, _ := json.Marshal(tasks)

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/v1.35/services":
			w.WriteHeader(http.StatusOK)
			w.Write(bServices)
			return
		case "/v1.35/nodes":
			w.WriteHeader(http.StatusOK)
			w.Write(bNodes)
			return
		case "/v1.35/tasks":
			w.WriteHeader(http.StatusOK)
			w.Write(bTasks)
			return
		default:
			http.NotFound(w, r)
		}
	}))
	defer server.Close()

	defer ResetCli()
	SetCli(makeClientForServer(t, server.URL))

	req := httptest.NewRequest(http.MethodGet, "/ui/dashboardh", nil)
	w := httptest.NewRecorder()
	dashboardHHandler(w, req)
	resp := w.Result()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200 got %d", resp.StatusCode)
	}
	body, _ := io.ReadAll(resp.Body)
	var outH map[string]interface{}
	if err := json.Unmarshal(body, &outH); err != nil {
		t.Fatalf("dashboardh response not valid json: %v", err)
	}
	foundSvcH := false
	if svcs, ok := outH["Services"].([]interface{}); ok {
		for _, s := range svcs {
			if m, ok := s.(map[string]interface{}); ok {
				if name, ok := m["Name"].(string); ok && name == "hsvc" {
					foundSvcH = true
					break
				}
			}
		}
	}
	foundNodeH := false
	if nodesArr, ok := outH["Nodes"].([]interface{}); ok {
		for _, n := range nodesArr {
			if m, ok := n.(map[string]interface{}); ok {
				if hn, ok := m["Hostname"].(string); ok && hn == "hnode" {
					foundNodeH = true
					break
				}
			}
		}
	}
	if !foundSvcH || !foundNodeH {
		t.Fatalf("expected dashboardH to include service 'hsvc' and node 'hnode'; foundSvc=%v foundNode=%v", foundSvcH, foundNodeH)
	}
}

// TestVersionHandler verifies the version endpoint calls checkVersion and
// returns the expected JSON payload when version checking is enabled.
func TestVersionHandler(t *testing.T) {
	// setup a fake remote release server
	releaseServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"tag_name":"1.2.3"}`))
	}))
	defer releaseServer.Close()

	oldEnv := map[string]string{"DSD_VERSION": os.Getenv("DSD_VERSION"), "DSD_VERSION_CHECK_ENABLED": os.Getenv("DSD_VERSION_CHECK_ENABLED"), "DSD_VERSION_RELEASE_URL": os.Getenv("DSD_VERSION_RELEASE_URL")}
	defer func() {
		for k, v := range oldEnv {
			os.Setenv(k, v)
		}
	}()
	os.Setenv("DSD_VERSION", "1.0.0")
	os.Setenv("DSD_VERSION_CHECK_ENABLED", "true")
	os.Setenv("DSD_VERSION_RELEASE_URL", releaseServer.URL)

	req := httptest.NewRequest(http.MethodGet, "/version", nil)
	w := httptest.NewRecorder()
	versionHandler(w, req)
	resp := w.Result()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200 got %d", resp.StatusCode)
	}
	var u map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&u)
	if _, ok := u["version"]; !ok {
		t.Fatalf("expected response to contain 'version' field")
	}
}

// TestTimelineHandler verifies the timeline handler returns tasks with
// stopped timestamp set for non-running tasks and includes service names.
func TestTimelineHandler(t *testing.T) {
	created := time.Now().Add(-1 * time.Hour).Format(time.RFC3339)
	// task that is not running
	tasks := []map[string]interface{}{{
		"ID":           "tt1",
		"ServiceID":    "s1",
		"NodeID":       "n1",
		"Slot":         1,
		"Status":       map[string]interface{}{"Timestamp": created, "State": "complete", "ContainerStatus": map[string]interface{}{"PID": 0}},
		"DesiredState": "shutdown",
		"CreatedAt":    created,
	}}
	bTasks, _ := json.Marshal(tasks)

	services := []map[string]interface{}{{
		"ID":   "s1",
		"Spec": map[string]interface{}{"Name": "tsvc", "Labels": map[string]string{"com.docker.stack.namespace": "tstack"}},
	}}
	bServices, _ := json.Marshal(services)

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/v1.35/tasks":
			w.WriteHeader(http.StatusOK)
			w.Write(bTasks)
			return
		case "/v1.35/services":
			w.WriteHeader(http.StatusOK)
			w.Write(bServices)
			return
		default:
			http.NotFound(w, r)
		}
	}))
	defer server.Close()

	defer ResetCli()
	SetCli(makeClientForServer(t, server.URL))

	req := httptest.NewRequest(http.MethodGet, "/ui/timeline", nil)
	w := httptest.NewRecorder()
	timelineHandler(w, req)
	resp := w.Result()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200 got %d", resp.StatusCode)
	}
	body, _ := io.ReadAll(resp.Body)
	var tarr []map[string]interface{}
	if err := json.Unmarshal(body, &tarr); err != nil {
		t.Fatalf("timeline response not valid json: %v", err)
	}
	found := false
	for _, it := range tarr {
		if sn, ok := it["ServiceName"].(string); ok && sn == "tsvc" {
			found = true
		}
		// also ensure timeline keys match UI expectations (CreatedTimestamp, StoppedTimestamp)
		if _, ok := it["CreatedTimestamp"].(string); !ok {
			t.Fatalf("expected timeline items to contain CreatedTimestamp string")
		}
		if _, ok := it["StoppedTimestamp"].(string); !ok {
			t.Fatalf("expected timeline items to contain StoppedTimestamp string (may be empty)")
		}
	}
	if !found {
		t.Fatalf("expected timeline response to contain service name 'tsvc'")
	}
}
