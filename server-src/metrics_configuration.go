package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"

	"github.com/docker/docker/api/types/swarm"
	"github.com/docker/docker/client"
)

// resolveExporterEndpoint applies service-specific overrides before discovery.
func resolveExporterEndpoint(ctx context.Context, cli *client.Client, service *swarm.Service, nodeID, exporter string, defaultPort int) (string, error) {
	if service == nil {
		return "", fmt.Errorf("service is nil")
	}
	prefix := "DSD_" + strings.ToUpper(strings.ReplaceAll(exporter, "-", "_")) + "_"
	setting := func(name, fallback string) string {
		if value, exists := service.Spec.Labels["dsd."+exporter+"."+strings.ToLower(name)]; exists {
			return value
		}
		if value, exists := os.LookupEnv(prefix + name); exists {
			return value
		}
		return fallback
	}
	path := setting("PATH", "/metrics")
	parsedPath, err := url.Parse(path)
	if err != nil || !strings.HasPrefix(path, "/") || strings.HasPrefix(path, "//") || parsedPath.Host != "" || parsedPath.Fragment != "" {
		return "", fmt.Errorf("invalid %s metrics path", exporter)
	}
	scheme := setting("SCHEME", "http")
	if scheme != "http" && scheme != "https" {
		return "", fmt.Errorf("invalid %s metrics scheme", exporter)
	}
	configured := *service
	if value := setting("PORT", ""); value != "" {
		port, err := strconv.Atoi(value)
		if err != nil || port < 1 || port > 65535 {
			return "", fmt.Errorf("invalid %s metrics port", exporter)
		}
		defaultPort = port
		configured.Endpoint.Ports = nil
	}
	endpoint, err := resolveServiceEndpoint(ctx, cli, &configured, nodeID, defaultPort)
	if err != nil {
		return "", err
	}
	parsed, err := url.Parse(endpoint)
	if err != nil {
		return "", err
	}
	parsed.Scheme = scheme
	parsed.Path, parsed.RawPath, parsed.RawQuery = parsedPath.Path, parsedPath.RawPath, parsedPath.RawQuery
	return parsed.String(), nil
}

// applyMetricsHeaders configures exporter-specific reverse proxy headers.
func applyMetricsHeaders(request *http.Request, exporter string) error {
	value := os.Getenv("DSD_" + exporter + "_HEADERS")
	if value == "" {
		return nil
	}
	var headers map[string]string
	if err := json.Unmarshal([]byte(value), &headers); err != nil {
		return fmt.Errorf("invalid metrics headers configuration")
	}
	for name, value := range headers {
		if strings.EqualFold(name, "Host") {
			request.Host = value
		} else {
			request.Header.Set(name, value)
		}
	}
	return nil
}

// metricsEndpointURL handles IPv6 task addresses as well as service DNS names.
func metricsEndpointURL(host string, port int) string {
	return "http://" + net.JoinHostPort(host, strconv.Itoa(port)) + "/metrics"
}
