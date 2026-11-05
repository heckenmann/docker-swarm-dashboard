package main

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"github.com/modelcontextprotocol/go-sdk/mcp"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync/atomic"
	"testing"

	"github.com/gorilla/mux"
)

// Docker fixtures include payloads deliberately: no outward projection may
// expose them, even when metadata masking is explicitly disabled.
func resourceFixture(t *testing.T) (*atomic.Bool, *atomic.Bool, *atomic.Bool, *atomic.Bool) {
	t.Helper()
	serviceError, resourceError, removed, changed := &atomic.Bool{}, &atomic.Bool{}, &atomic.Bool{}, &atomic.Bool{}
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case strings.HasSuffix(r.URL.Path, "/configs"), strings.HasSuffix(r.URL.Path, "/secrets"):
			if resourceError.Load() {
				http.Error(w, "sensitive-error-payload", 500)
				return
			}
			_, _ = w.Write([]byte(`[{"ID":"shared","Version":{"Index":7},"CreatedAt":"2026-01-01T00:00:00Z","UpdatedAt":"2026-02-01T00:00:00Z","Spec":{"Name":"resource-v2","Labels":{"com.docker.stack.namespace":"demo","password":"private-label"},"Data":"cGF5bG9hZC1zZW50aW5lbA=="}},{"ID":"unused","Spec":{"Name":"old-version"}}]`))
		case strings.HasSuffix(r.URL.Path, "/services"):
			if serviceError.Load() {
				http.Error(w, "sensitive-error-payload", 500)
				return
			}
			if removed.Load() {
				_, _ = w.Write([]byte(`[]`))
				return
			}
			if changed.Load() {
				_, _ = w.Write([]byte(`[{"ID":"s1","Spec":{"Name":"web","TaskTemplate":{"ContainerSpec":{"Configs":[{"ConfigID":"unused","File":{"Name":"/new-target"}}],"Secrets":[{"SecretID":"unused","File":{"Name":"/new-target"}}]}}}}]`))
				return
			}
			_, _ = w.Write([]byte(`[{"ID":"s1","Spec":{"Name":"web","Labels":{"com.docker.stack.namespace":"demo"},"TaskTemplate":{"ContainerSpec":{"Configs":[{"ConfigID":"shared","ConfigName":"stale-name","File":{"Name":"/etc/web","UID":"1000","GID":"1001","Mode":288}},{"ConfigID":"gone","ConfigName":"removed","Runtime":{}}],"Secrets":[{"SecretID":"shared","SecretName":"stale-name","File":{"Name":"password","UID":"1000","GID":"1001","Mode":256}},{"SecretID":"gone","SecretName":"removed"}]}}}},{"ID":"s2","Spec":{"Name":"worker","TaskTemplate":{"ContainerSpec":{"Configs":[{"ConfigID":"shared","File":{"Name":"/etc/worker"}}],"Secrets":[{"SecretID":"shared","File":{"Name":"token"}}]}}}}]`))
		default:
			http.NotFound(w, r)
		}
	}))
	t.Cleanup(srv.Close)
	SetCli(makeClientForServer(t, srv.URL))
	t.Cleanup(ResetCli)
	return serviceError, resourceError, removed, changed
}

func TestResourceInventories(t *testing.T) {
	for _, kind := range []string{"configs", "secrets"} {
		t.Run(kind, func(t *testing.T) {
			serviceError, resourceError, removed, changed := resourceFixture(t)
			for _, mask := range []string{"true", "false"} {
				t.Run(mask, func(t *testing.T) {
					t.Setenv("DSD_MASK_ENV", mask)
					result, err := queryResourceInventory(context.Background(), kind, resourceFilter{})
					if err != nil || !result.UsageKnown || len(result.Resources) != 3 {
						t.Fatalf("inventory: %+v %v", result, err)
					}
					shared, err := findResource(result, "shared")
					if err != nil || shared.Name != "resource-v2" || shared.Version != 7 || shared.Stack != "demo" || shared.Usage != "referenced" || len(shared.Consumers) != 2 {
						t.Fatalf("shared: %+v %v", shared, err)
					}
					if shared.Consumers[0].ServiceID != "s1" || shared.Consumers[0].UID != "1000" || shared.Consumers[0].GID != "1001" {
						t.Fatalf("mount: %+v", shared.Consumers)
					}
					if kind == "configs" && shared.Consumers[0].Mode != "0440" {
						t.Fatal(shared.Consumers)
					}
					if kind == "secrets" && shared.Consumers[0].Mode != "0400" {
						t.Fatal(shared.Consumers)
					}
					missing, _ := findResource(result, "gone")
					if !missing.Missing || missing.Usage != "referenced" {
						t.Fatal(missing)
					}
					unused, _ := findResource(result, "unused")
					if unused.Usage != "unreferenced" || len(unused.Consumers) != 0 {
						t.Fatal(unused)
					}
					body, _ := json.Marshal(result)
					for _, secret := range []string{"cGF5bG9hZC1zZW50aW5lbA==", "payload-sentinel", "\"Data\""} {
						if strings.Contains(string(body), secret) {
							t.Fatalf("leaked payload: %s", body)
						}
					}
					if (shared.Labels["password"] == "private-label") != (mask == "false") {
						t.Fatal("incorrect metadata masking")
					}
				})
			}
			for _, filter := range []resourceFilter{{Name: "RESOURCE-V2"}, {Stack: "demo", Usage: "referenced"}, {Usage: "unreferenced"}} {
				result, err := queryResourceInventory(context.Background(), kind, filter)
				want := 1
				if filter.Stack != "" {
					want = 2
				}
				if err != nil || len(result.Resources) != want {
					t.Fatalf("filter %+v: %+v %v", filter, result, err)
				}
			}
			changed.Store(true)
			changedInventory, err := queryResourceInventory(context.Background(), kind, resourceFilter{})
			changedOld, _ := findResource(changedInventory, "shared")
			changedNew, _ := findResource(changedInventory, "unused")
			if err != nil || changedOld.Usage != "unreferenced" || changedNew.Usage != "referenced" || len(changedNew.Consumers) != 1 || changedNew.Consumers[0].Target != "/new-target" {
				t.Fatal("reference change was not reflected on refresh")
			}
			removed.Store(true)
			result, _ := queryResourceInventory(context.Background(), kind, resourceFilter{})
			shared, _ := findResource(result, "shared")
			if len(result.Resources) != 2 || shared.Usage != "unreferenced" || len(shared.Consumers) != 0 {
				t.Fatal("stale usage after refresh")
			}
			serviceError.Store(true)
			result, err = queryResourceInventory(context.Background(), kind, resourceFilter{})
			if err != nil || result.UsageKnown || result.Message == "" {
				t.Fatal("usage must be unknown")
			}
			for _, resource := range result.Resources {
				if resource.Usage != "unknown" {
					t.Fatal(resource)
				}
			}
			result, _ = queryResourceInventory(context.Background(), kind, resourceFilter{Usage: "unreferenced"})
			if len(result.Resources) != 0 {
				t.Fatal("unknown usage marked unused")
			}
			resourceError.Store(true)
			_, err = queryResourceInventory(context.Background(), kind, resourceFilter{})
			if err == nil || strings.Contains(err.Error(), "sensitive-error-payload") {
				t.Fatal("resource query error not sanitized")
			}
		})
	}
}

func TestResourceInventoryREST(t *testing.T) {
	_, resourceError, _, _ := resourceFixture(t)
	for _, kind := range []string{"configs", "secrets"} {
		router := mux.NewRouter()
		router.HandleFunc("/docker/"+kind, resourceInventoryHandler(kind))
		router.HandleFunc("/docker/"+kind+"/{id}", resourceInventoryHandler(kind))
		for _, path := range []string{"", "/shared", "?name=resource-v2&usage=referenced&stack=demo"} {
			w := httptest.NewRecorder()
			router.ServeHTTP(w, httptest.NewRequest("GET", "/docker/"+kind+path, nil))
			if w.Code != 200 || strings.Contains(w.Body.String(), "cGF5bG9hZC1zZW50aW5lbA==") || strings.Contains(w.Body.String(), "private-label") {
				t.Fatalf("REST: %d %s", w.Code, w.Body)
			}
		}
		w := httptest.NewRecorder()
		router.ServeHTTP(w, httptest.NewRequest("GET", "/docker/"+kind+"/absent", nil))
		if w.Code != 404 {
			t.Fatal(w.Code)
		}
		resourceError.Store(true)
		w = httptest.NewRecorder()
		router.ServeHTTP(w, httptest.NewRequest("GET", "/docker/"+kind, nil))
		if w.Code != 503 || strings.Contains(w.Body.String(), "sensitive-error-payload") {
			t.Fatal(w.Body)
		}
		resourceError.Store(false)
	}
}

func TestResourceInventoryMCP(t *testing.T) {
	serviceError, resourceError, _, _ := resourceFixture(t)
	server := httptest.NewServer(newMCPHTTPHandler())
	defer server.Close()
	session, err := mcp.NewClient(&mcp.Implementation{Name: "resource-test", Version: "1"}, nil).Connect(context.Background(), &mcp.StreamableClientTransport{Endpoint: server.URL}, nil)
	if err != nil {
		t.Fatal(err)
	}
	defer func() {
		if err := session.Close(); err != nil {
			t.Errorf("close MCP session: %v", err)
		}
	}()
	for _, kind := range []string{"configs", "secrets"} {
		for _, mask := range []string{"true", "false"} {
			t.Run(kind+mask, func(t *testing.T) {
				t.Setenv("DSD_MASK_ENV", mask)
				for _, tool := range []string{"list_" + kind, "get_" + strings.TrimSuffix(kind, "s")} {
					args := map[string]any{"identifier": "shared"}
					if strings.HasPrefix(tool, "list_") {
						args = map[string]any{"name": "resource-v2", "stack": "demo", "usage": "referenced"}
					}
					response, output := callMCPTool(t, session, tool, args)
					raw, _ := json.Marshal(response)
					if strings.Contains(string(raw), "cGF5bG9hZC1zZW50aW5lbA==") || strings.Contains(string(raw), "payload-sentinel") {
						t.Fatal("payload exposed via MCP")
					}
					if mask == "true" && strings.Contains(string(raw), "private-label") {
						t.Fatal("unmasked metadata")
					}
					if strings.HasPrefix(tool, "get_") && output["id"] != "shared" {
						t.Fatal(output)
					}
				}
			})
		}
		serviceError.Store(true)
		_, output := callMCPTool(t, session, "list_"+kind, nil)
		if output["usageKnown"] != false {
			t.Fatal(output)
		}
		resourceError.Store(true)
		result, err := session.CallTool(context.Background(), &mcp.CallToolParams{Name: "list_" + kind})
		if err != nil || !result.IsError {
			t.Fatalf("expected sanitized tool error: %v %v", result, err)
		}
		raw, _ := json.Marshal(result)
		if strings.Contains(string(raw), "sensitive-error-payload") {
			t.Fatal("error exposed sensitive content")
		}
		serviceError.Store(false)
		resourceError.Store(false)
	}
}

func TestResourceRoutesRegistered(t *testing.T) {
	resourceFixture(t)
	previous := pathPrefix
	defer func() { pathPrefix = previous }()
	for _, prefix := range []string{"", "/dashboard"} {
		pathPrefix = prefix
		handler := buildHandler()
		for _, kind := range []string{"configs", "secrets"} {
			for _, suffix := range []string{"", "/shared"} {
				w := httptest.NewRecorder()
				handler.ServeHTTP(w, httptest.NewRequest("GET", prefix+"/docker/"+kind+suffix, nil))
				if w.Code != 200 || !strings.Contains(w.Body.String(), "resource-v2") || strings.Contains(w.Body.String(), "cGF5bG9hZC1zZW50aW5lbA==") {
					t.Fatalf("route %s/%s: %d %s", prefix, kind, w.Code, w.Body)
				}
			}
		}
	}
}

func TestConfigContentVisibility(t *testing.T) {
	for _, tc := range []struct {
		name, flag, mask, status, encoding string
		data                               []byte
		inspectError                       bool
		wantInspects                       int
	}{
		{name: "default", mask: "false", status: "hidden"},
		{name: "explicitly hidden", flag: "true", mask: "false", status: "hidden"},
		{name: "invalid", flag: "invalid", mask: "false", status: "hidden"},
		{name: "text independent of masking", flag: "false", mask: "true", status: "available", encoding: "utf-8", data: []byte("PASSWORD=test-value\nsecond line\n"), wantInspects: 1},
		{name: "text without metadata masking", flag: "false", mask: "false", status: "available", encoding: "utf-8", data: []byte("test content"), wantInspects: 1},
		{name: "binary", flag: "false", mask: "true", status: "available", encoding: "base64", data: []byte{255, 0, 1}, wantInspects: 1},
		{name: "empty", flag: "false", mask: "true", status: "available", encoding: "utf-8", data: []byte{}, wantInspects: 1},
		{name: "removed", flag: "false", mask: "true", status: "unavailable", inspectError: true, wantInspects: 1},
	} {
		t.Run(tc.name, func(t *testing.T) {
			t.Setenv("DSD_HIDE_CONFIG_CONTENT", tc.flag)
			t.Setenv("DSD_MASK_ENV", tc.mask)
			var inspects atomic.Int32
			docker := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				switch {
				case strings.HasSuffix(r.URL.Path, "/services"):
					_, _ = w.Write([]byte(`[]`))
				case strings.HasSuffix(r.URL.Path, "/configs"), strings.HasSuffix(r.URL.Path, "/secrets"):
					_ = json.NewEncoder(w).Encode([]map[string]any{{"ID": "c1", "Spec": map[string]any{"Name": "example", "Data": []byte("list-only-sentinel")}}})
				case strings.HasSuffix(r.URL.Path, "/configs/c1"):
					inspects.Add(1)
					if tc.inspectError {
						http.Error(w, "sensitive-upstream-error", 404)
						return
					}
					_ = json.NewEncoder(w).Encode(map[string]any{"ID": "c1", "Spec": map[string]any{"Name": "example", "Data": tc.data}})
				default:
					t.Errorf("unexpected Docker request %s", r.URL.Path)
					http.NotFound(w, r)
				}
			}))
			defer docker.Close()
			SetCli(makeClientForServer(t, docker.URL))
			defer ResetCli()
			router := mux.NewRouter()
			for _, kind := range []string{"configs", "secrets"} {
				router.HandleFunc("/"+kind, resourceInventoryHandler(kind))
				router.HandleFunc("/"+kind+"/{id}", resourceInventoryHandler(kind))
			}
			// Listing never exposes content, regardless of the independent visibility flag.
			w := httptest.NewRecorder()
			router.ServeHTTP(w, httptest.NewRequest("GET", "/configs", nil))
			if strings.Contains(w.Body.String(), "content") || strings.Contains(w.Body.String(), "list-only-sentinel") {
				t.Fatal("payload in list")
			}
			w = httptest.NewRecorder()
			router.ServeHTTP(w, httptest.NewRequest("GET", "/configs/c1", nil))
			var detail resourceDetail
			if err := json.Unmarshal(w.Body.Bytes(), &detail); err != nil {
				t.Fatal(err)
			}
			check := func(content *resourceContent) {
				t.Helper()
				if content == nil || content.Status != tc.status || content.Encoding != tc.encoding {
					t.Fatalf("unexpected content status: %+v", content)
				}
				want := ""
				if tc.status == "available" {
					want = string(tc.data)
					if tc.encoding == "base64" {
						want = base64.StdEncoding.EncodeToString(tc.data)
					}
				}
				if content.Value != want {
					t.Fatal("config content did not match expected visibility and encoding")
				}
			}
			check(detail.Content)
			if w.Header().Get("Cache-Control") != "no-store" {
				t.Fatal("detail content can be cached")
			}
			if strings.Contains(w.Body.String(), "sensitive-upstream-error") {
				t.Fatal("Docker error leaked")
			}
			if int(inspects.Load()) != tc.wantInspects {
				t.Fatal("unexpected inspect count")
			}
			w = httptest.NewRecorder()
			router.ServeHTTP(w, httptest.NewRequest("GET", "/secrets/c1", nil))
			if strings.Contains(w.Body.String(), "content") || strings.Contains(w.Body.String(), "list-only-sentinel") {
				t.Fatal("secret payload exposed")
			}
			server := httptest.NewServer(newMCPHTTPHandler())
			defer server.Close()
			session, err := mcp.NewClient(&mcp.Implementation{Name: "content-test", Version: "1"}, nil).Connect(context.Background(), &mcp.StreamableClientTransport{Endpoint: server.URL}, nil)
			if err != nil {
				t.Fatal(err)
			}
			defer func() {
				if err := session.Close(); err != nil {
					t.Errorf("close MCP session: %v", err)
				}
			}()
			_, output := callMCPTool(t, session, "get_config", map[string]any{"identifier": "c1"})
			raw, _ := json.Marshal(output)
			var mcpDetail resourceDetail
			if err := json.Unmarshal(raw, &mcpDetail); err != nil {
				t.Fatal(err)
			}
			check(mcpDetail.Content)
			_, output = callMCPTool(t, session, "get_secret", map[string]any{"identifier": "c1"})
			if _, present := output["content"]; present {
				t.Fatal("secret content field exposed via MCP")
			}
		})
	}
}
