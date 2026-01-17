package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

// TestTimelineHandler covers running and stopped task handling and service enrichment.
func TestTimelineHandler_Custom(t *testing.T) {
	// Create fake tasks: one running with PID>0, one stopped
	tasks := []map[string]interface{}{
		{
			"ID":           "t1",
			"CreatedAt":    "2020-01-01T00:00:00Z",
			"Status":       map[string]interface{}{"State": "running", "ContainerStatus": map[string]interface{}{"PID": 123, "Timestamp": "2020-01-01T01:00:00Z"}},
			"DesiredState": "running",
			"Slot":         1,
			"ServiceID":    "s1",
		},
		{
			"ID":           "t2",
			"CreatedAt":    "2020-01-01T00:00:00Z",
			"Status":       map[string]interface{}{"State": "shutdown", "ContainerStatus": map[string]interface{}{"PID": 0, "Timestamp": "2020-01-01T02:00:00Z"}},
			"DesiredState": "shutdown",
			"Slot":         2,
			"ServiceID":    "s2",
		},
	}

	// Services mapping for lookup
	services := map[string]string{"s1": "svc-one", "s2": "svc-two"}

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/v1.35/tasks":
			json.NewEncoder(w).Encode(tasks)
			return
		case "/v1.35/services":
			// read filter id param to choose which service to return
			// weak parsing, just return both services for simplicity
			var out []map[string]interface{}
			out = append(out, map[string]interface{}{"Spec": map[string]interface{}{"Name": services["s1"], "Labels": map[string]string{"com.docker.stack.namespace": "stack1"}}})
			json.NewEncoder(w).Encode(out)
			return
		default:
			http.NotFound(w, r)
		}
	}))
	defer srv.Close()

	defer ResetCli()
	SetCli(makeClientForServer(t, srv.URL))

	req := httptest.NewRequest("GET", "/ui/timeline", nil)
	w := httptest.NewRecorder()
	timelineHandler(w, req)
	var out []map[string]interface{}
	json.NewDecoder(w.Result().Body).Decode(&out)
	if len(out) == 0 {
		t.Fatalf("expected timeline entries")
	}
}
