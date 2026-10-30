package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"reflect"
	"strings"
	"sync/atomic"
	"testing"
	"time"

	"github.com/docker/docker/api/types/swarm"
)

func managerFixture(count int) []swarm.Node {
	nodes := make([]swarm.Node, count)
	for i := range nodes {
		nodes[i] = swarm.Node{ID: fmt.Sprintf("m%d", i), Spec: swarm.NodeSpec{Role: swarm.NodeRoleManager, Availability: swarm.NodeAvailabilityActive}, ManagerStatus: &swarm.ManagerStatus{Leader: i == 0, Reachability: swarm.ReachabilityReachable}}
	}
	return nodes
}

func TestAssessClusterHealthTopology(t *testing.T) {
	for _, tc := range []struct {
		count, majority, reserve int
		warning                  string
	}{{1, 1, 0, "single_manager"}, {2, 2, 0, "even_managers"}, {3, 2, 1, ""}, {5, 3, 2, ""}} {
		t.Run(fmt.Sprint(tc.count), func(t *testing.T) {
			now := time.Now().UTC()
			result := assessClusterHealth(managerFixture(tc.count), now)
			if result.Managers != tc.count || result.Reachable != tc.count || result.Majority != tc.majority || result.RemainingFailures == nil || *result.RemainingFailures != tc.reserve || !result.ObservedAt.Equal(now) {
				t.Fatalf("unexpected assessment: %+v", result)
			}
			if tc.warning == "" && len(result.Warnings) != 0 {
				t.Fatalf("unexpected warnings: %v", result.Warnings)
			}
			if tc.warning != "" && (len(result.Warnings) != 1 || result.Warnings[0].Code != tc.warning) {
				t.Fatalf("unexpected warnings: %v", result.Warnings)
			}
		})
	}
}

func TestAssessClusterHealthPartialAndFailedManagers(t *testing.T) {
	tests := []struct {
		name                            string
		modify                          func([]swarm.Node) []swarm.Node
		reachable, unreachable, unknown int
		reserve                         *int
		codes                           []string
	}{
		{"one unreachable", func(n []swarm.Node) []swarm.Node {
			n[2].ManagerStatus.Reachability = swarm.ReachabilityUnreachable
			return n
		}, 2, 1, 0, intPointer(0), []string{"unreachable_managers"}},
		{"insufficient majority", func(n []swarm.Node) []swarm.Node {
			n[1].ManagerStatus.Reachability = swarm.ReachabilityUnreachable
			n[2].ManagerStatus.Reachability = swarm.ReachabilityUnreachable
			return n
		}, 1, 2, 0, intPointer(0), []string{"unreachable_managers", "insufficient_reachable"}},
		{"missing status", func(n []swarm.Node) []swarm.Node { n[2].ManagerStatus = nil; return n }, 2, 0, 1, nil, []string{"unknown_reachability"}},
		{"unknown reachability", func(n []swarm.Node) []swarm.Node {
			n[2].ManagerStatus.Reachability = swarm.ReachabilityUnknown
			return n
		}, 2, 0, 1, nil, []string{"unknown_reachability"}},
		{"empty reachability", func(n []swarm.Node) []swarm.Node { n[2].ManagerStatus.Reachability = ""; return n }, 2, 0, 1, nil, []string{"unknown_reachability"}},
		{"missing leader", func(n []swarm.Node) []swarm.Node { n[0].ManagerStatus.Leader = false; return n }, 3, 0, 0, nil, []string{"missing_leader"}},
		{"multiple leaders", func(n []swarm.Node) []swarm.Node { n[1].ManagerStatus.Leader = true; return n }, 3, 0, 0, nil, []string{"multiple_leaders"}},
		{"drained manager and worker", func(n []swarm.Node) []swarm.Node {
			n[1].Spec.Availability = swarm.NodeAvailabilityDrain
			n[1].Status.State = swarm.NodeStateDown
			return append(n, swarm.Node{ID: "worker", Spec: swarm.NodeSpec{Role: swarm.NodeRoleWorker}})
		}, 3, 0, 0, intPointer(1), nil},
		{"empty inventory", func(_ []swarm.Node) []swarm.Node { return nil }, 0, 0, 0, nil, []string{"no_managers", "missing_leader", "insufficient_reachable"}},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			result := assessClusterHealth(tc.modify(managerFixture(3)), time.Now())
			if result.Reachable != tc.reachable || result.Unreachable != tc.unreachable || result.Unknown != tc.unknown || !reflect.DeepEqual(result.RemainingFailures, tc.reserve) {
				t.Fatalf("unexpected assessment: %+v", result)
			}
			var codes []string
			for _, warning := range result.Warnings {
				codes = append(codes, warning.Code)
			}
			if !reflect.DeepEqual(codes, tc.codes) {
				t.Fatalf("warnings %v, want %v", codes, tc.codes)
			}
		})
	}
}

func intPointer(value int) *int { return &value }

func TestClusterHealthRESTAndMCP(t *testing.T) {
	session, _ := mcpFixture(t)
	nodes := managerFixture(3)
	nodes[0].Description = swarm.NodeDescription{Hostname: "manager", Engine: swarm.EngineDescription{EngineVersion: "28.5.2", Labels: map[string]string{"join-token": "sensitive-test-value"}}, Platform: swarm.Platform{OS: "linux", Architecture: "arm64"}}
	var fail atomic.Bool
	docker := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/v1.35/nodes" {
			t.Errorf("unexpected Docker request: %s", r.URL.Path)
			http.NotFound(w, r)
			return
		}
		if fail.Load() {
			http.Error(w, `{"message":"sensitive-test-value"}`, 500)
			return
		}
		_ = json.NewEncoder(w).Encode(nodes)
	}))
	defer docker.Close()
	SetCli(makeClientForServer(t, docker.URL))
	router := buildHandler()
	for _, unavailable := range []bool{false, true} {
		fail.Store(unavailable)
		response := httptest.NewRecorder()
		router.ServeHTTP(response, httptest.NewRequest(http.MethodGet, strings.TrimSuffix(pathPrefix, "/")+"/docker/cluster/health", nil))
		expected := 200
		if unavailable {
			expected = 503
		}
		if response.Code != expected {
			t.Fatalf("status %d, expected %d", response.Code, expected)
		}
		var rest map[string]any
		if err := json.Unmarshal(response.Body.Bytes(), &rest); err != nil {
			t.Fatal(err)
		}
		_, tool := callMCPTool(t, session, "get_cluster_health", nil)
		if strings.Contains(response.Body.String(), "sensitive-test-value") {
			t.Fatal("sensitive fields leaked")
		}
		if unavailable {
			if rest["observedAt"] != nil || rest["remainingFailures"] != nil || rest["state"] != "unavailable" {
				t.Fatalf("old observation reused: %v", rest)
			}
		} else {
			if rest["observedAt"] == nil || tool["observedAt"] == nil {
				t.Fatal("missing observation timestamps")
			}
			inventory := rest["nodes"].([]any)[0].(map[string]any)
			if inventory["engineVersion"] != "28.5.2" || inventory["os"] != "linux" || inventory["architecture"] != "arm64" {
				t.Fatalf("incorrect inventory: %v", inventory)
			}
		}
		delete(rest, "observedAt")
		delete(tool, "observedAt")
		if !reflect.DeepEqual(rest, tool) {
			t.Fatalf("REST/MCP differ: %v vs %v", rest, tool)
		}
	}
}

func TestClusterHealthHonorsCancellation(t *testing.T) {
	started := make(chan struct{})
	docker := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		close(started)
		<-r.Context().Done()
	}))
	defer docker.Close()
	SetCli(makeClientForServer(t, docker.URL))
	defer ResetCli()
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	done := make(chan clusterHealth, 1)
	go func() { done <- queryClusterHealth(ctx) }()
	select {
	case <-started:
	case <-time.After(time.Second):
		t.Fatal("Docker query never started")
	}
	cancel()
	select {
	case result := <-done:
		if result.Available || result.ObservedAt != nil || result.RemainingFailures != nil {
			t.Fatalf("canceled query produced observation: %+v", result)
		}
	case <-time.After(time.Second):
		t.Fatal("query ignored cancellation")
	}
}
