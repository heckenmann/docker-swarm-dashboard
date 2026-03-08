package main

import (
	"testing"

	swarmtypes "github.com/docker/docker/api/types/swarm"
)

// TestExtractReplicationFromService verifies replicated/global/unknown modes.
func TestExtractReplicationFromService(t *testing.T) {
	// replicated mode
	var replicas uint64 = 3
	svc1 := swarmtypes.Service{Spec: swarmtypes.ServiceSpec{Mode: swarmtypes.ServiceMode{Replicated: &swarmtypes.ReplicatedService{Replicas: &replicas}}}}
	if extractReplicationFromService(svc1) != "3" {
		t.Fatalf("expected '3' for replicated service")
	}
	// global mode
	svc2 := swarmtypes.Service{Spec: swarmtypes.ServiceSpec{Mode: swarmtypes.ServiceMode{Global: &swarmtypes.GlobalService{}}}}
	if extractReplicationFromService(svc2) != "global" {
		t.Fatalf("expected 'global' for global service")
	}
	// unknown
	svc3 := swarmtypes.Service{}
	if extractReplicationFromService(svc3) != "unknown" {
		t.Fatalf("expected 'unknown' for empty service")
	}
}
