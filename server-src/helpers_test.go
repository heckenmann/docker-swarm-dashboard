package main

import (
	"os"
	"testing"
	"time"

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

// TestVersionHelpers covers getLocalVersion, getCacheTimeout and checkVersion cache path.
func TestVersionHelpers(t *testing.T) {
	// ensure DSD_VERSION empty returns error
	_ = os.Unsetenv("DSD_VERSION")
	if _, err := getLocalVersion(); err == nil {
		t.Fatalf("expected error when DSD_VERSION unset")
	}

	// cache timeout when unset
	_ = os.Unsetenv("DSD_VERSION_CHECK_CACHE_TIMEOUT_MINUTES")
	if d := getCacheTimeout(); d <= 0 {
		t.Fatalf("expected positive timeout, got %v", d)
	}

	// checkVersion when DSD_VERSION not set should return false
	_ = os.Unsetenv("DSD_VERSION")
	_, _, ok := checkVersion()
	if ok {
		t.Fatalf("expected checkVersion to return false when local version missing")
	}

	// set local version and disable remote check
	_ = os.Setenv("DSD_VERSION", "1.0.0")
	_ = os.Setenv("DSD_VERSION_CHECK_ENABLED", "false")
	lv, rv, ok := checkVersion()
	if lv != "1.0.0" || rv != "" || ok {
		t.Fatalf("unexpected checkVersion result when disabled: %v %v %v", lv, rv, ok)
	}

	// set cache to be valid path: set lastCheckTime to now and cachedRemoteVersion
	cachedRemoteVersion = "1.2.3"
	lastCheckTime = time.Now()
	_ = os.Setenv("DSD_VERSION_CHECK_ENABLED", "true")
	_ = os.Setenv("DSD_VERSION", "1.0.0")
	lv, rv, ok = checkVersion()
	if lv != "1.0.0" {
		t.Fatalf("expected local version preserved")
	}
	if rv != "1.2.3" {
		t.Fatalf("expected cached remote version returned")
	}
	// version comparison result should be true since 1.0.0 < 1.2.3
	if !ok {
		t.Fatalf("expected update available due to cached remote > local")
	}
}
