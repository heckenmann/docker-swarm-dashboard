package main

import (
	"context"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	"github.com/docker/docker/api/types/swarm"
)

func TestExporterEndpointConfiguration(t *testing.T) {
	for _, exporter := range []struct {
		name, env string
		port      int
	}{
		{"node-exporter", "NODE_EXPORTER", 9100}, {"cadvisor", "CADVISOR", 8080},
	} {
		t.Run(exporter.name, func(t *testing.T) {
			service := &swarm.Service{Spec: swarm.ServiceSpec{Annotations: swarm.Annotations{Name: "exporter"}}, Endpoint: swarm.Endpoint{Ports: []swarm.PortConfig{{TargetPort: 9999}}}}
			t.Setenv("DSD_"+exporter.env+"_PORT", "1234")
			t.Setenv("DSD_"+exporter.env+"_PATH", "/proxy/metrics?format=text")
			t.Setenv("DSD_"+exporter.env+"_SCHEME", "https")
			endpoint, err := resolveExporterEndpoint(context.Background(), nil, service, "", exporter.name, exporter.port)
			if err != nil || endpoint != "https://exporter:1234/proxy/metrics?format=text" {
				t.Fatalf("endpoint %q, error %v", endpoint, err)
			}
			service.Spec.Labels = map[string]string{"dsd." + exporter.name + ".port": "4321", "dsd." + exporter.name + ".path": "/custom", "dsd." + exporter.name + ".scheme": "http"}
			endpoint, err = resolveExporterEndpoint(context.Background(), nil, service, "", exporter.name, exporter.port)
			if err != nil || endpoint != "http://exporter:4321/custom" {
				t.Fatalf("label endpoint %q, error %v", endpoint, err)
			}
			if service.Endpoint.Ports[0].TargetPort != 9999 {
				t.Fatal("mutated service ports")
			}
			for key, values := range map[string][]string{"port": {"0", "65536", "no"}, "path": {"relative", "//other/metrics", "/bad#fragment"}, "scheme": {"ftp"}} {
				for _, value := range values {
					label := "dsd." + exporter.name + "." + key
					old := service.Spec.Labels[label]
					service.Spec.Labels[label] = value
					if _, err := resolveExporterEndpoint(context.Background(), nil, service, "", exporter.name, exporter.port); err == nil {
						t.Errorf("accepted invalid %s", key)
					}
					service.Spec.Labels[label] = old
				}
			}
		})
	}
}

func TestExporterHeadersAndTimeout(t *testing.T) {
	for _, exporter := range []struct {
		name  string
		fetch func(context.Context, string) (string, error)
	}{
		{"NODE_EXPORTER", fetchMetricsFromNodeExporter}, {"CADVISOR", fetchMetricsFromCAdvisor},
	} {
		t.Run(exporter.name, func(t *testing.T) {
			t.Setenv("DSD_"+exporter.name+"_HEADERS", `{"Host":"metrics.internal","X-Proxy-Key":"test"}`)
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if r.Host != "metrics.internal" || r.Header.Get("X-Proxy-Key") != "test" {
					t.Error("missing proxy headers")
				}
				<-r.Context().Done()
			}))
			defer server.Close()
			old := metricsHttpClient
			t.Setenv("DSD_METRICS_TIMEOUT", "20ms")
			metricsHttpClient = &http.Client{Timeout: metricsTimeout()}
			defer func() { metricsHttpClient = old }()
			if _, err := exporter.fetch(context.Background(), server.URL); err == nil {
				t.Fatal("request did not time out")
			}
			t.Setenv("DSD_"+exporter.name+"_HEADERS", "invalid secret")
			if _, err := exporter.fetch(context.Background(), server.URL); err == nil || err.Error() != "invalid metrics headers configuration" {
				t.Fatalf("unexpected configuration error: %v", err)
			}
		})
	}
}

func TestConfiguredExporterFetch(t *testing.T) {
	for _, exporter := range []struct {
		name  string
		fetch func(context.Context, string) (string, error)
	}{
		{"node-exporter", fetchMetricsFromNodeExporter}, {"cadvisor", fetchMetricsFromCAdvisor},
	} {
		t.Run(exporter.name, func(t *testing.T) {
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if r.URL.RequestURI() != "/proxy/metrics?tenant=test" {
					t.Errorf("unexpected request URI: %s", r.URL.RequestURI())
				}
				if _, err := w.Write([]byte("test_metric 1\n")); err != nil {
					t.Error(err)
				}
			}))
			defer server.Close()
			address, err := url.Parse(server.URL)
			if err != nil {
				t.Fatal(err)
			}
			service := &swarm.Service{Spec: swarm.ServiceSpec{Annotations: swarm.Annotations{
				Name: address.Hostname(), Labels: map[string]string{
					"dsd." + exporter.name + ".port": address.Port(),
					"dsd." + exporter.name + ".path": "/proxy/metrics?tenant=test",
				},
			}}}
			endpoint, err := resolveExporterEndpoint(context.Background(), nil, service, "", exporter.name, 1)
			if err != nil {
				t.Fatal(err)
			}
			body, err := exporter.fetch(context.Background(), endpoint)
			if err != nil || body != "test_metric 1\n" {
				t.Fatalf("body %q, error %v", body, err)
			}
		})
	}
}
