package main

import (
	"os"
	"testing"
	"time"
)

// TestLoadDashboardSettingsFromEnv_AllVars sets various environment variables
// and verifies that loadDashboardSettingsFromEnv updates the package-level
// configuration values accordingly. This covers branches handling layout,
// hidden states, TZ/LOCALE, version check flags and cache duration, and the
// welcome message.
func TestLoadDashboardSettingsFromEnv_AllVars(t *testing.T) {
	// backup originals to restore after test
	origs := map[string]string{}
	keys := []string{
		"DSD_HANDLE_LOGS",
		"DSD_DASHBOARD_LAYOUT",
		"DSD_HIDE_SERVICE_STATES",
		"TZ",
		"LOCALE",
		"DSD_VERSION_CHECK_ENABLED",
		"DSD_VERSION_CHECK_CACHE_TIMEOUT_MINUTES",
		"DSD_WELCOME_MESSAGE",
	}
	for _, k := range keys {
		if v, ok := os.LookupEnv(k); ok {
			origs[k] = v
		} else {
			origs[k] = ""
		}
	}
	// restore env after test
	defer func() {
		for k, v := range origs {
			if v == "" {
				os.Unsetenv(k)
			} else {
				os.Setenv(k, v)
			}
		}
		// reset package vars to defaults to avoid polluting other tests
		handlingLogs = true
		dashboardLayout = "row"
		hiddenServiceStates = make([]string, 0)
		timeZone = new(string)
		locale = new(string)
		versionCheckEnabled = false
		versionCheckCacheDurationMinutes = 30 * time.Minute
		welcomeMessage = new(string)
	}()

	// set test env values
	os.Setenv("DSD_HANDLE_LOGS", "false")
	os.Setenv("DSD_DASHBOARD_LAYOUT", "column")
	os.Setenv("DSD_HIDE_SERVICE_STATES", "running, PAUSED")
	os.Setenv("TZ", "UTC")
	os.Setenv("LOCALE", "de")
	os.Setenv("DSD_VERSION_CHECK_ENABLED", "true")
	os.Setenv("DSD_VERSION_CHECK_CACHE_TIMEOUT_MINUTES", "15")
	os.Setenv("DSD_WELCOME_MESSAGE", "hello")

	// call loader
	loadDashboardSettingsFromEnv()

	if handlingLogs != false {
		t.Fatalf("expected handlingLogs=false got %v", handlingLogs)
	}
	if dashboardLayout != "column" {
		t.Fatalf("expected dashboardLayout=column got %s", dashboardLayout)
	}
	// hiddenServiceStates should be lowercased and trimmed
	if len(hiddenServiceStates) != 2 || hiddenServiceStates[0] != "running" || hiddenServiceStates[1] != "paused" {
		t.Fatalf("unexpected hiddenServiceStates: %#v", hiddenServiceStates)
	}
	if timeZone == nil || *timeZone != "UTC" {
		t.Fatalf("expected TZ=UTC got %v", timeZone)
	}
	if locale == nil || *locale != "de" {
		t.Fatalf("expected LOCALE=de got %v", locale)
	}
	if versionCheckEnabled != true {
		t.Fatalf("expected versionCheckEnabled=true got %v", versionCheckEnabled)
	}
	if versionCheckCacheDurationMinutes != 15*time.Minute {
		t.Fatalf("expected cache duration 15m got %v", versionCheckCacheDurationMinutes)
	}
	if welcomeMessage == nil || *welcomeMessage != "hello" {
		t.Fatalf("expected welcomeMessage=hello got %v", welcomeMessage)
	}
}
