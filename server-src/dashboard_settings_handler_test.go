package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"
)

// TestDashboardSettingsHandler_EnvOverrides validates the handler returns expected defaults and respects env overrides.
func TestDashboardSettingsHandler_EnvOverrides(t *testing.T) {
	// set package-level variables directly (package init already ran)
	prevLayout := dashboardLayout
	prevHandleLogs := handlingLogs
	dashboardLayout = "column"
	handlingLogs = false
	defer func() {
		dashboardLayout = prevLayout
		handlingLogs = prevHandleLogs
	}()
	req := httptest.NewRequest(http.MethodGet, "/ui/dashboard-settings", nil)
	w := httptest.NewRecorder()
	dashboardSettingsHandler(w, req)
	resp := w.Result()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200 got %d", resp.StatusCode)
	}
	var out dashboardSettings
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		t.Fatalf("decode failed: %v", err)
	}
	if out.DefaultLayout != "column" {
		t.Fatalf("expected layout column, got %s", out.DefaultLayout)
	}
	if out.ShowLogsButton {
		t.Fatalf("expected ShowLogsButton false when DSD_HANDLE_LOGS=false")
	}
}

// Moved from more_helpers_test.go: TestLoadDashboardSettingsFromEnv
func TestLoadDashboardSettingsFromEnv(t *testing.T) {
	// set package-level variables directly (package init already ran)
	prevLayout := dashboardLayout
	prevHandleLogs := handlingLogs
	dashboardLayout = "column"
	handlingLogs = false
	defer func() {
		dashboardLayout = prevLayout
		handlingLogs = prevHandleLogs
	}()

	req := httptest.NewRequest(http.MethodGet, "/ui/dashboard-settings", nil)
	w := httptest.NewRecorder()
	dashboardSettingsHandler(w, req)
	resp := w.Result()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200 got %d", resp.StatusCode)
	}
}

// Moved from more_helpers_test.go: TestLoadDashboardSettings_Advanced
func TestLoadDashboardSettings_Advanced(t *testing.T) {
	_ = os.Setenv("DSD_HIDE_SERVICE_STATES", "running, paused")
	_ = os.Setenv("DSD_WELCOME_MESSAGE", "hi")
	_ = os.Setenv("TZ", "Europe/Berlin")
	_ = os.Setenv("LOCALE", "de-DE")
	_ = os.Setenv("DSD_VERSION_CHECK_CACHE_TIMEOUT_MINUTES", "7")
	defer func() {
		_ = os.Unsetenv("DSD_HIDE_SERVICE_STATES")
		_ = os.Unsetenv("DSD_WELCOME_MESSAGE")
		_ = os.Unsetenv("TZ")
		_ = os.Unsetenv("LOCALE")
		_ = os.Unsetenv("DSD_VERSION_CHECK_CACHE_TIMEOUT_MINUTES")
	}()

	// reset then load
	hiddenServiceStates = make([]string, 0)
	welcomeMessage = new(string)
	loadDashboardSettingsFromEnv()

	if len(hiddenServiceStates) == 0 {
		t.Fatalf("expected hiddenServiceStates set")
	}
	if welcomeMessage == nil || *welcomeMessage != "hi" {
		t.Fatalf("unexpected welcomeMessage %v", welcomeMessage)
	}
	if time.Duration(7)*time.Minute != versionCheckCacheDurationMinutes {
		t.Fatalf("expected 7 minutes cache, got %v", versionCheckCacheDurationMinutes)
	}
}
