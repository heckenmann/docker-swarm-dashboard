package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/docker/docker/api/types/swarm"
)

func TestFindNodeExporterService_Advanced(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v1.35/services" {
			services := []swarm.Service{
				{
					ID: "s-node-exp",
					Spec: swarm.ServiceSpec{
						Annotations: swarm.Annotations{
							Labels: map[string]string{nodeExporterLabel: "true"},
						},
					},
				},
			}
			json.NewEncoder(w).Encode(services)
			return
		}
	}))
	defer server.Close()

	defer ResetCli()
	SetCli(makeClientForServer(t, server.URL))
	cli := getCli()

	svc, err := findNodeExporterService(cli)
	if err != nil {
		t.Errorf("unexpected error: %v", err)
	}
	if svc == nil || svc.ID != "s-node-exp" {
		t.Errorf("expected service s-node-exp, got %v", svc)
	}
}

func TestFindCAdvisorService_Advanced(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v1.35/services" {
			services := []swarm.Service{
				{
					ID: "s-cadvisor",
					Spec: swarm.ServiceSpec{
						Annotations: swarm.Annotations{
							Labels: map[string]string{cadvisorLabel: "true"},
						},
					},
				},
			}
			json.NewEncoder(w).Encode(services)
			return
		}
	}))
	defer server.Close()

	defer ResetCli()
	SetCli(makeClientForServer(t, server.URL))
	cli := getCli()

	svc, err := findCAdvisorService(cli)
	if err != nil {
		t.Errorf("unexpected error: %v", err)
	}
	if svc == nil || svc.ID != "s-cadvisor" {
		t.Errorf("expected service s-cadvisor, got %v", svc)
	}
}

func TestResolveServiceEndpoint_NoTasksFallback(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v1.35/tasks" {
			json.NewEncoder(w).Encode([]swarm.Task{})
			return
		}
	}))
	defer server.Close()

	defer ResetCli()
	SetCli(makeClientForServer(t, server.URL))
	cli := getCli()

	service := &swarm.Service{
		Spec: swarm.ServiceSpec{
			Annotations: swarm.Annotations{Name: "fallback-svc"},
		},
	}

	endpoint, err := resolveServiceEndpoint(cli, service, "node1", 8080)
	if err != nil {
		t.Errorf("unexpected error: %v", err)
	}
	if endpoint != "http://fallback-svc:8080/metrics" {
		t.Errorf("expected fallback to service name, got %s", endpoint)
	}
}

func TestResolveServiceEndpoint_NilService(t *testing.T) {
	_, err := resolveServiceEndpoint(nil, nil, "node1", 8080)
	if err == nil {
		t.Error("expected error for nil service")
	}
}
