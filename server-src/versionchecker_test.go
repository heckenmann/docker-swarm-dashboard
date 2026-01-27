package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"
)

// TestGetLatestRemoteVersion_NoURL verifies an error when release URL not set.
func TestGetLatestRemoteVersion_NoURL(t *testing.T) {
	_ = os.Unsetenv("DSD_VERSION_RELEASE_URL")
	if _, err := getLatestRemoteVersion(); err == nil {
		t.Fatalf("expected error when release URL not set")
	}
}

// TestGetLatestRemoteVersion_Success verifies parsing of remote release tag.
func TestGetLatestRemoteVersion_Success(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte(`{"tag_name":"2.3.4"}`))
	}))
	defer srv.Close()
	_ = os.Setenv("DSD_VERSION_RELEASE_URL", srv.URL)
	tag, err := getLatestRemoteVersion()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if tag != "2.3.4" {
		t.Fatalf("expected tag 2.3.4, got %s", tag)
	}
}

// TestGetCacheTimeout_Invalid ensures invalid env values fall back to default.
func TestGetCacheTimeout_Invalid(t *testing.T) {
	_ = os.Setenv("DSD_VERSION_CHECK_CACHE_TIMEOUT_MINUTES", "not-a-number")
	if d := getCacheTimeout(); d <= 0 {
		t.Fatalf("expected positive duration on invalid env value")
	}
}

// TestGetCacheTimeout_Valid ensures a numeric environment value is parsed.
func TestGetCacheTimeout_Valid(t *testing.T) {
	_ = os.Setenv("DSD_VERSION_CHECK_CACHE_TIMEOUT_MINUTES", "5")
	d := getCacheTimeout()
	if d != 5*time.Minute {
		t.Fatalf("expected 5m, got %v", d)
	}
}

// TestGetLocalVersion_Success ensures getLocalVersion reads the env variable.
func TestGetLocalVersion_Success(t *testing.T) {
	_ = os.Setenv("DSD_VERSION", "3.2.1")
	defer func() { _ = os.Unsetenv("DSD_VERSION") }()
	v, err := getLocalVersion()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if v != "3.2.1" {
		t.Fatalf("expected 3.2.1, got %s", v)
	}
}

// TestGetLatestRemoteVersion_BadJSON ensures JSON decoding errors are handled
func TestGetLatestRemoteVersion_BadJSON(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte(`not-a-json`))
	}))
	defer srv.Close()
	_ = os.Setenv("DSD_VERSION_RELEASE_URL", srv.URL)
	if _, err := getLatestRemoteVersion(); err == nil {
		t.Fatalf("expected JSON decode error")
	}
}

// TestCheckVersion_RemoteNonSemver ensures checkVersion handles non-semver remote tag
func TestCheckVersion_RemoteNonSemver(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte(`{"tag_name":"not-a-semver"}`))
	}))
	defer srv.Close()
	_ = os.Setenv("DSD_VERSION_RELEASE_URL", srv.URL)
	_ = os.Setenv("DSD_VERSION", "1.0.0")
	_ = os.Setenv("DSD_VERSION_CHECK_ENABLED", "true")
	// force cache expiry
	lastCheckTime = time.Time{}
	_, _, ok := checkVersion()
	if ok {
		t.Fatalf("expected checkVersion to return false when remote tag is invalid semver")
	}
}

// TestCheckVersion_NoLocal ensures checkVersion returns false when no local version set.
func TestCheckVersion_NoLocal(t *testing.T) {
	os.Unsetenv("DSD_VERSION")
	_, _, ok := checkVersion()
	if ok {
		t.Fatalf("expected ok false when no local version")
	}
}

// TestCheckVersion_Disabled ensures when version check is disabled it returns local and no remote.
func TestCheckVersion_Disabled(t *testing.T) {
	os.Setenv("DSD_VERSION", "1.0.0")
	defer os.Unsetenv("DSD_VERSION")
	os.Unsetenv("DSD_VERSION_CHECK_ENABLED")

	// reset cache
	lastCheckTime = time.Time{}
	cachedRemoteVersion = ""
	local, remote, ok := checkVersion()
	if local != "1.0.0" {
		t.Fatalf("unexpected local %s", local)
	}
	if remote != "" || ok {
		t.Fatalf("expected no remote and ok false when disabled")
	}
}

// TestCheckVersion_CachePath exercises code path where cache is fresh and checkVersion returns cached data.
func TestCheckVersion_CachePath(t *testing.T) {
	os.Setenv("DSD_VERSION", "1.0.0")
	defer os.Unsetenv("DSD_VERSION")
	os.Setenv("DSD_VERSION_CHECK_ENABLED", "true")
	defer os.Unsetenv("DSD_VERSION_CHECK_ENABLED")

	// prime the cache
	lastCheckTime = time.Now()
	cachedRemoteVersion = "2.0.0"

	local, remote, ok := checkVersion()
	if local != "1.0.0" {
		t.Fatalf("unexpected local %s", local)
	}
	if remote != "2.0.0" {
		t.Fatalf("unexpected remote %s", remote)
	}
	if !ok {
		t.Fatalf("expected ok true when remote > local")
	}
}

// TestCheckVersion_FreshFetchSuccess simulates successful remote fetch and semver comparison.
func TestCheckVersion_FreshFetchSuccess(t *testing.T) {
	os.Setenv("DSD_VERSION", "1.0.0")
	defer os.Unsetenv("DSD_VERSION")
	os.Setenv("DSD_VERSION_CHECK_ENABLED", "true")
	defer os.Unsetenv("DSD_VERSION_CHECK_ENABLED")

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_ = json.NewEncoder(w).Encode(map[string]string{"tag_name": "2.0.0"})
	}))
	defer srv.Close()
	os.Setenv("DSD_VERSION_RELEASE_URL", srv.URL)
	defer os.Unsetenv("DSD_VERSION_RELEASE_URL")

	// invalidate cache
	lastCheckTime = time.Time{}
	cachedRemoteVersion = ""

	local, remote, ok := checkVersion()
	if local != "1.0.0" || remote != "2.0.0" || !ok {
		t.Fatalf("unexpected result %s %s %v", local, remote, ok)
	}
}

// TestCheckVersion_InvalidLocalSemver ensures invalid local semver returns false.
func TestCheckVersion_InvalidLocalSemver(t *testing.T) {
	os.Setenv("DSD_VERSION", "not-a-semver")
	defer os.Unsetenv("DSD_VERSION")
	_, _, ok := checkVersion()
	if ok {
		t.Fatalf("expected ok false for invalid local semver")
	}
}

// TestCheckVersion_CacheInvalidLocalSemver ensures that when the cache path is
// taken but the local version is invalid semver, checkVersion returns false
// without attempting a remote fetch.
func TestCheckVersion_CacheInvalidLocalSemver(t *testing.T) {
	os.Setenv("DSD_VERSION", "not-a-semver")
	defer os.Unsetenv("DSD_VERSION")
	os.Setenv("DSD_VERSION_CHECK_ENABLED", "true")
	defer os.Unsetenv("DSD_VERSION_CHECK_ENABLED")

	// prime cache and set lastCheckTime recent so cache path is used
	cachedRemoteVersion = "2.0.0"
	lastCheckTime = time.Now()

	local, remote, ok := checkVersion()
	if local != "" || remote != "" || ok {
		t.Fatalf("expected empty versions and ok=false when local semver invalid in cache path, got %v %v %v", local, remote, ok)
	}
}
