package main

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/docker/docker/api/types/network"
	"github.com/docker/docker/client"
	"github.com/gorilla/mux"
	"github.com/modelcontextprotocol/go-sdk/mcp"
)

func TestNetworkInventory(t *testing.T) {
	failure := ""
	inspectCalls := 0
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "GET" {
			t.Errorf("unexpected mutation %s", r.Method)
		}
		if failure != "" && strings.HasSuffix(r.URL.Path, failure) {
			http.Error(w, "private-error", 500)
			return
		}
		switch {
		case strings.HasSuffix(r.URL.Path, "/networks"):
			_, _ = w.Write([]byte(`[{"Id":"shared","Name":"demo_shared","Driver":"overlay","Scope":"swarm","Attachable":true,"Labels":{"com.docker.stack.namespace":"demo","password":"private-label"},"Options":{"encrypted":"","password":"private-option"},"IPAM":{"Config":[{"Subnet":"10.0.0.0/24","Gateway":"10.0.0.1"}]}},{"Id":"ingress","Name":"ingress","Driver":"overlay","Scope":"swarm","Ingress":true},{"Id":"local","Name":"bridge","Driver":"bridge","Scope":"local"}]`))
		case strings.HasSuffix(r.URL.Path, "/services"):
			_, _ = w.Write([]byte(`[{"ID":"s1","Spec":{"Name":"web","Labels":{"com.docker.stack.namespace":"demo"},"TaskTemplate":{"Networks":[{"Target":"shared","Aliases":["api"]},{"Target":"gone"}]},"EndpointSpec":{"Mode":"vip","Ports":[{"PublishedPort":8080,"TargetPort":80}]}},"Endpoint":{"Ports":[{"PublishedPort":9090,"TargetPort":80}],"VirtualIPs":[{"NetworkID":"shared","Addr":"10.0.0.2/24"},{"NetworkID":"ingress","Addr":"10.1.0.2/24"}]}},{"ID":"s2","Spec":{"Name":"worker","Networks":[{"Target":"shared"}],"EndpointSpec":{"Mode":"dnsrr"}}}]`))
		case strings.HasSuffix(r.URL.Path, "/networks/shared"):
			inspectCalls++
			if r.URL.Query().Get("verbose") != "true" {
				t.Error("verbose inspection missing")
			}
			_, _ = w.Write([]byte(`{"Id":"shared","Name":"demo_shared","Driver":"overlay","Scope":"swarm","Containers":{"endpoint":{"Name":"web.1","IPv4Address":"10.0.0.3/24"}},"Peers":[{"Name":"node1","IP":"192.0.2.1"}]}`))
		case strings.HasSuffix(r.URL.Path, "/networks/ingress"):
			http.NotFound(w, r)
		default:
			http.NotFound(w, r)
		}
	}))
	t.Cleanup(srv.Close)
	SetCli(makeClientForServer(t, srv.URL))
	t.Cleanup(ResetCli)
	ctx := context.Background()
	for _, mask := range []string{"true", "false"} {
		t.Setenv("DSD_MASK_ENV", mask)
		inv, err := queryNetworkInventory(ctx, networkFilter{})
		if err != nil || len(inv.Networks) != 4 || inspectCalls != 0 {
			t.Fatalf("inventory: %+v %v inspect=%d", inv, err, inspectCalls)
		}
		var shared networkEntry
		for _, entry := range inv.Networks {
			if entry.Network.ID == "shared" {
				shared = entry
			}
			if entry.Network.ID == "gone" && (!entry.Missing || entry.Network.Ingress != nil || entry.Network.Internal != nil || entry.Network.Attachable != nil) {
				t.Error("missing reference not marked")
			}
		}
		if len(shared.Services) != 2 || shared.Services[0].Aliases[0] != "api" || shared.Services[0].VirtualIPs[0] != "10.0.0.2/24" || shared.Services[1].EndpointMode != "dnsrr" || shared.Services[0].Ports[0].PublishedPort != 9090 || shared.Network.IPAM.Config[0].Gateway != "10.0.0.1" {
			t.Fatalf("attachments: %+v", shared)
		}
		raw, _ := json.Marshal(inv)
		var wire networkInventory
		if err := json.Unmarshal(raw, &wire); err != nil {
			t.Fatal(err)
		}
		for _, entry := range wire.Networks {
			if entry.Missing && (entry.Network.Ingress != nil || entry.Network.Internal != nil || entry.Network.Attachable != nil) {
				t.Fatal("missing network flags must remain unknown")
			}
			if entry.Network.ID == "ingress" && (entry.Network.Ingress == nil || !*entry.Network.Ingress) {
				t.Fatal("known ingress flag lost")
			}
		}
		if mask == "true" && (strings.Contains(string(raw), "private-label") || strings.Contains(string(raw), "private-option")) {
			t.Fatal("metadata leaked")
		}
	}
	for _, filter := range []networkFilter{{Name: "SHARED"}, {Stack: "demo", Name: "shared"}, {Driver: "bridge"}, {Scope: "local"}} {
		inv, err := queryNetworkInventory(ctx, filter)
		if err != nil || len(inv.Networks) != 1 {
			t.Fatalf("filter %+v: %+v %v", filter, inv, err)
		}
	}
	detail, err := queryNetworkDetail(ctx, "shared")
	if err != nil || len(detail.Network.Containers) != 1 || len(detail.Network.Peers) != 1 || inspectCalls != 1 {
		t.Fatalf("detail %+v %v", detail, err)
	}
	detail, err = queryNetworkDetail(ctx, "ingress")
	if err != nil || !detail.Missing {
		t.Fatalf("deleted %+v %v", detail, err)
	}
	detail, err = queryNetworkDetail(ctx, "gone")
	if err != nil || !detail.Missing {
		t.Fatalf("missing %+v %v", detail, err)
	}
	_, err = queryNetworkDetail(ctx, "unknown")
	if !errors.Is(err, errDashboardEntityNotFound) {
		t.Fatal(err)
	}
	for _, path := range []string{"networks", "services", "networks/shared"} {
		failure = path
		req := mux.SetURLVars(httptest.NewRequest("GET", "/docker/networks/shared", nil), map[string]string{"id": "shared"})
		w := httptest.NewRecorder()
		networkInventoryHandler(w, req)
		if w.Code != 503 || strings.Contains(w.Body.String(), "private-error") {
			t.Fatalf("error %s: %d %s", path, w.Code, w.Body.String())
		}
	}
	failure = ""
	for _, id := range []string{"", "shared", "unknown"} {
		req := mux.SetURLVars(httptest.NewRequest("GET", "/docker/networks?driver=overlay", nil), map[string]string{"id": id})
		w := httptest.NewRecorder()
		networkInventoryHandler(w, req)
		expected := 200
		if id == "unknown" {
			expected = 404
		}
		if w.Code != expected {
			t.Fatalf("REST %s: %d", id, w.Code)
		}
	}
	// Compare the actual REST and MCP transports, including path prefixes.
	t.Setenv("DSD_MASK_ENV", "true")
	mcpHTTP := httptest.NewServer(newMCPHTTPHandler())
	defer mcpHTTP.Close()
	session, err := mcp.NewClient(&mcp.Implementation{Name: "network-test", Version: "1"}, nil).Connect(ctx, &mcp.StreamableClientTransport{Endpoint: mcpHTTP.URL}, nil)
	if err != nil {
		t.Fatal(err)
	}
	defer func() {
		if err := session.Close(); err != nil {
			t.Error(err)
		}
	}()
	previousPrefix := pathPrefix
	defer func() { pathPrefix = previousPrefix }()
	for _, prefix := range []string{"", "/dashboard"} {
		pathPrefix = prefix
		router := buildHandler()
		for _, id := range []string{"", "shared"} {
			path := prefix + "/docker/networks"
			tool := "list_networks"
			args := map[string]any{}
			if id != "" {
				path += "/" + id
				tool = "get_network"
				args["identifier"] = id
			}
			response := httptest.NewRecorder()
			router.ServeHTTP(response, httptest.NewRequest("GET", path, nil))
			if response.Code != 200 {
				t.Fatalf("route %s: %d", path, response.Code)
			}
			var rest map[string]any
			if err := json.Unmarshal(response.Body.Bytes(), &rest); err != nil {
				t.Fatal(err)
			}
			_, output := callMCPTool(t, session, tool, args)
			restJSON, _ := json.Marshal(rest)
			mcpJSON, _ := json.Marshal(output)
			if string(restJSON) != string(mcpJSON) {
				t.Fatalf("REST and MCP differ for %s", tool)
			}
		}
	}
	failure = "networks"
	response, err := session.CallTool(ctx, &mcp.CallToolParams{Name: "list_networks"})
	if err != nil || !response.IsError {
		t.Fatalf("MCP error: %+v %v", response, err)
	}
	raw, _ := json.Marshal(response)
	if strings.Contains(string(raw), "private-error") {
		t.Fatal("MCP error leaked Docker response")
	}
	failure = ""
	oldGetCli := getCli
	getCli = func() (*client.Client, error) { return nil, errors.New("private-client-error") }
	defer func() { getCli = oldGetCli }()
	_, err = queryNetworkInventory(ctx, networkFilter{})
	if err == nil || strings.Contains(err.Error(), "private") {
		t.Fatal(err)
	}
}

func TestNetworkOptionMasking(t *testing.T) {
	for _, driver := range []string{"macvlan", "ipvlan", "overlay", "plugin"} {
		for _, enabled := range []string{"true", "false"} {
			t.Setenv("DSD_MASK_ENV", enabled)
			options := map[string]string{"parent": "eth0.100", "encrypted": "", "password": "private-value", "com.docker.plugin.password": "private-value"}
			result := sanitizeNetwork(network.Inspect{Driver: driver, Options: options})
			if enabled == "true" {
				for _, key := range []string{"password", "com.docker.plugin.password"} {
					if result.Options[key] == "private-value" {
						t.Fatal("unmasked option", driver, key)
					}
				}
				if driver == "macvlan" || driver == "ipvlan" {
					if result.Options["parent"] != "eth0.100" {
						t.Fatal("parent masked")
					}
				} else if result.Options["parent"] == "eth0.100" {
					t.Fatal("unknown driver option exposed")
				}
			} else if result.Options["password"] != "private-value" {
				t.Fatal("masking disabled")
			}
			if options["password"] != "private-value" || options["parent"] != "eth0.100" {
				t.Fatal("source mutated")
			}
		}
	}
}
