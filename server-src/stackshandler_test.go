package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

// TestStacksHandler verifies that the stacks UI handler aggregates services
// by stack label and returns 200 OK.
func TestStacksHandler(t *testing.T) {
	svc1 := map[string]interface{}{
		"ID":        "s1",
		"Spec":      map[string]interface{}{"Name": "mystack_service1", "Labels": map[string]string{"com.docker.stack.namespace": "mystack"}},
		"CreatedAt": time.Now().Format(time.RFC3339),
		"UpdatedAt": time.Now().Format(time.RFC3339),
	}
	svc2 := map[string]interface{}{
		"ID":        "s2",
		"Spec":      map[string]interface{}{"Name": "othersvc", "Labels": map[string]string{"com.docker.stack.namespace": ""}},
		"CreatedAt": time.Now().Format(time.RFC3339),
		"UpdatedAt": time.Now().Format(time.RFC3339),
	}
	arr, _ := json.Marshal([]interface{}{svc1, svc2})
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v1.35/services" {
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write(arr)
			return
		}
		http.NotFound(w, r)
	}))
	defer server.Close()

	defer ResetCli()
	SetCli(makeClientForServer(t, server.URL))

	req := httptest.NewRequest(http.MethodGet, "/ui/stacks", nil)
	w := httptest.NewRecorder()
	stacksHandler(w, req)
	resp := w.Result()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200 got %d", resp.StatusCode)
	}
}
