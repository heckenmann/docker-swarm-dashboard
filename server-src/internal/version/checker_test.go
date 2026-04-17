package version

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

// TestLastCheckTime_InitiallyZero ensures LastCheckTime returns the zero value before any check.
func TestLastCheckTime_InitiallyZero(t *testing.T) {
	mu.Lock()
	lastCheckTime = time.Time{}
	mu.Unlock()
	if !LastCheckTime().IsZero() {
		t.Fatalf("expected zero time before any check")
	}
}

// TestGetLatestRemoteVersion_Success verifies parsing of remote release tag.
func TestGetLatestRemoteVersion_Success(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte(`{"tag_name":"2.3.4"}`))
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

// TestGetLocalVersion_BuildVersionFallback ensures getLocalVersion falls back to
// the compile-time BuildVersion when DSD_VERSION is not set.
func TestGetLocalVersion_BuildVersionFallback(t *testing.T) {
	_ = os.Unsetenv("DSD_VERSION")
	BuildVersion = "4.5.6"
	defer func() { BuildVersion = "" }()
	v, err := getLocalVersion()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if v != "4.5.6" {
		t.Fatalf("expected 4.5.6, got %s", v)
	}
}

// TestGetLocalVersion_EnvVarTakesPrecedence ensures DSD_VERSION takes precedence
// over the compile-time BuildVersion.
func TestGetLocalVersion_EnvVarTakesPrecedence(t *testing.T) {
	_ = os.Setenv("DSD_VERSION", "9.9.9")
	defer func() { _ = os.Unsetenv("DSD_VERSION") }()
	BuildVersion = "1.0.0"
	defer func() { BuildVersion = "" }()
	v, err := getLocalVersion()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if v != "9.9.9" {
		t.Fatalf("expected DSD_VERSION=9.9.9 to take precedence, got %s", v)
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
		_, _ = w.Write([]byte(`not-a-json`))
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
		_, _ = w.Write([]byte(`{"tag_name":"not-a-semver"}`))
	}))
	defer srv.Close()
	_ = os.Setenv("DSD_VERSION_RELEASE_URL", srv.URL)
	_ = os.Setenv("DSD_VERSION", "1.0.0")
	_ = os.Setenv("DSD_VERSION_CHECK_ENABLED", "true")
	// force cache expiry
	lastCheckTime = time.Time{}
	_, _, ok := CheckVersion()
	if ok {
		t.Fatalf("expected checkVersion to return false when remote tag is invalid semver")
	}
}

// TestCheckVersion_NoLocal ensures checkVersion returns false when no local version set.
func TestCheckVersion_NoLocal(t *testing.T) {
	_ = os.Unsetenv("DSD_VERSION")
	BuildVersion = ""
	defer func() { BuildVersion = "" }()
	_, _, ok := CheckVersion()
	if ok {
		t.Fatalf("expected ok false when no local version")
	}
}

// TestCheckVersion_Disabled ensures when version check is disabled it returns local and no remote.
func TestCheckVersion_Disabled(t *testing.T) {
	_ = os.Setenv("DSD_VERSION", "1.0.0")
	defer func() { _ = os.Unsetenv("DSD_VERSION") }()
	_ = os.Unsetenv("DSD_VERSION_CHECK_ENABLED")

	// reset cache
	lastCheckTime = time.Time{}
	cachedRemoteVersion = ""
	local, remote, ok := CheckVersion()
	if local != "1.0.0" {
		t.Fatalf("unexpected local %s", local)
	}
	if remote != "" || ok {
		t.Fatalf("expected no remote and ok false when disabled")
	}
}

// TestCheckVersion_CachePath exercises code path where cache is fresh and checkVersion returns cached data.
func TestCheckVersion_CachePath(t *testing.T) {
	_ = os.Setenv("DSD_VERSION", "1.0.0")
	defer func() { _ = os.Unsetenv("DSD_VERSION") }()
	_ = os.Setenv("DSD_VERSION_CHECK_ENABLED", "true")
	defer func() { _ = os.Unsetenv("DSD_VERSION_CHECK_ENABLED") }()

	// prime the cache
	lastCheckTime = time.Now()
	cachedRemoteVersion = "2.0.0"

	local, remote, ok := CheckVersion()
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
	_ = os.Setenv("DSD_VERSION", "1.0.0")
	defer func() { _ = os.Unsetenv("DSD_VERSION") }()
	_ = os.Setenv("DSD_VERSION_CHECK_ENABLED", "true")
	defer func() { _ = os.Unsetenv("DSD_VERSION_CHECK_ENABLED") }()

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_ = json.NewEncoder(w).Encode(map[string]string{"tag_name": "2.0.0"})
	}))
	defer srv.Close()
	_ = os.Setenv("DSD_VERSION_RELEASE_URL", srv.URL)
	defer func() { _ = os.Unsetenv("DSD_VERSION_RELEASE_URL") }()

	// invalidate cache
	lastCheckTime = time.Time{}
	cachedRemoteVersion = ""

	local, remote, ok := CheckVersion()
	if local != "1.0.0" || remote != "2.0.0" || !ok {
		t.Fatalf("unexpected result %s %s %v", local, remote, ok)
	}
}

// TestCheckVersion_InvalidLocalSemver ensures invalid local semver returns false.
func TestCheckVersion_InvalidLocalSemver(t *testing.T) {
	_ = os.Setenv("DSD_VERSION", "not-a-semver")
	defer func() { _ = os.Unsetenv("DSD_VERSION") }()
	_, _, ok := CheckVersion()
	if ok {
		t.Fatalf("expected ok false for invalid local semver")
	}
}

// TestCheckVersion_RaceCondition detects concurrent read/write races on the
// package-level cache variables (lastCheckTime, cachedRemoteVersion).
//
// The bug: both variables are plain package-level vars with no mutex. When
// multiple HTTP requests call CheckVersion() simultaneously – which is the
// normal production scenario – the Go race detector reports a data race on
// every concurrent read+write pair.
//
// Run with: go test -race ./internal/version/ -run TestCheckVersion_RaceCondition
func TestCheckVersion_RaceCondition(t *testing.T) {
	_ = os.Setenv("DSD_VERSION", "1.0.0")
	defer func() { _ = os.Unsetenv("DSD_VERSION") }()
	_ = os.Setenv("DSD_VERSION_CHECK_ENABLED", "true")
	defer func() { _ = os.Unsetenv("DSD_VERSION_CHECK_ENABLED") }()
	_ = os.Setenv("DSD_VERSION_CHECK_CACHE_TIMEOUT_MINUTES", "0") // always expire
	defer func() { _ = os.Unsetenv("DSD_VERSION_CHECK_CACHE_TIMEOUT_MINUTES") }()

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_ = json.NewEncoder(w).Encode(map[string]string{"tag_name": "2.0.0"})
	}))
	defer srv.Close()
	_ = os.Setenv("DSD_VERSION_RELEASE_URL", srv.URL)
	defer func() { _ = os.Unsetenv("DSD_VERSION_RELEASE_URL") }()

	// Reset cache so every goroutine triggers a real fetch + write cycle.
	lastCheckTime = time.Time{}
	cachedRemoteVersion = ""

	// Launch several goroutines that all call CheckVersion concurrently.
	// Without a mutex, the race detector will report a DATA RACE on
	// lastCheckTime / cachedRemoteVersion.
	const goroutines = 10
	done := make(chan struct{}, goroutines)
	for i := 0; i < goroutines; i++ {
		go func() {
			_, _, _ = CheckVersion()
			done <- struct{}{}
		}()
	}
	for i := 0; i < goroutines; i++ {
		<-done
	}
}

// TestCheckVersion_CachePanicWithInvalidRemoteSemver reproduces the panic that
// occurs when the cache is primed with a non-semver remote version string and
// CheckVersion is called again within the cache window.
//
// The bug: after a successful fetch that returned a non-semver remote tag,
// lastCheckTime is updated and cachedRemoteVersion holds the invalid string.
// The next call within the cache timeout enters the cache path and calls
// semver.MustParse(cachedRemoteVersion), which panics on invalid input.
func TestCheckVersion_CachePanicWithInvalidRemoteSemver(t *testing.T) {
	_ = os.Setenv("DSD_VERSION", "1.0.0")
	defer func() { _ = os.Unsetenv("DSD_VERSION") }()
	_ = os.Setenv("DSD_VERSION_CHECK_ENABLED", "true")
	defer func() { _ = os.Unsetenv("DSD_VERSION_CHECK_ENABLED") }()

	// Simulate a previously cached non-semver remote version with a fresh cache.
	// This state is reachable: a prior call fetched "not-a-semver" from the remote,
	// set lastCheckTime = time.Now() and cachedRemoteVersion = "not-a-semver".
	lastCheckTime = time.Now()
	cachedRemoteVersion = "not-a-semver"

	// Before the fix, this panics inside the cache path via semver.MustParse.
	defer func() {
		if r := recover(); r != nil {
			t.Fatalf("CheckVersion panicked with cached invalid remote semver: %v", r)
		}
	}()

	_, _, _ = CheckVersion()
}

// TestCheckVersion_CacheInvalidLocalSemver ensures that when the cache path is
// taken but the local version is invalid semver, checkVersion returns the local
// version string and cached remote version, but no update flag.
func TestCheckVersion_CacheInvalidLocalSemver(t *testing.T) {
	_ = os.Setenv("DSD_VERSION", "not-a-semver")
	defer func() { _ = os.Unsetenv("DSD_VERSION") }()
	_ = os.Setenv("DSD_VERSION_CHECK_ENABLED", "true")
	defer func() { _ = os.Unsetenv("DSD_VERSION_CHECK_ENABLED") }()

	// prime cache and set lastCheckTime recent so cache path is used
	cachedRemoteVersion = "2.0.0"
	lastCheckTime = time.Now()

	local, remote, ok := CheckVersion()
	if local != "not-a-semver" || remote != "2.0.0" || ok {
		t.Fatalf("expected local=not-a-semver, remote=2.0.0, ok=false in cache path, got %v %v %v", local, remote, ok)
	}
}
