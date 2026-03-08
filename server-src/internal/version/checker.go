// Package version provides Docker Swarm Dashboard version-checking logic.
// It compares the locally configured version against the latest GitHub release
// and caches the result to avoid excessive remote calls.
package version

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"sync"
	"time"

	"github.com/blang/semver"
)

// gitHubRelease represents a release entry from the GitHub Releases API.
type gitHubRelease struct {
	TagName string `json:"tag_name"`
}

var (
	mu                  sync.RWMutex
	lastCheckTime       time.Time
	cachedRemoteVersion string
)

// LastCheckTime returns the time of the most recent successful remote version fetch.
// Returns the zero value if no check has been performed yet.
func LastCheckTime() time.Time {
	mu.RLock()
	defer mu.RUnlock()
	return lastCheckTime
}

// getLocalVersion reads the running version from the DSD_VERSION environment variable.
func getLocalVersion() (string, error) {
	version := os.Getenv("DSD_VERSION")
	if version == "" {
		return "", fmt.Errorf("local version not set")
	}
	return version, nil
}

// getLatestRemoteVersion fetches the latest release tag from the GitHub Releases API
// configured via DSD_VERSION_RELEASE_URL.
func getLatestRemoteVersion() (string, error) {
	url := os.Getenv("DSD_VERSION_RELEASE_URL")
	if url == "" {
		return "", fmt.Errorf("release URL not set")
	}

	resp, err := http.Get(url) //nolint:gosec // URL comes from a trusted env var
	if err != nil {
		return "", err
	}
	defer func() { _ = resp.Body.Close() }()

	var release gitHubRelease
	if err := json.NewDecoder(resp.Body).Decode(&release); err != nil {
		return "", err
	}

	return release.TagName, nil
}

// getCacheTimeout reads the cache timeout from DSD_VERSION_CHECK_CACHE_TIMEOUT_MINUTES.
// Defaults to 30 minutes on parse errors or missing values.
func getCacheTimeout() time.Duration {
	timeoutStr := os.Getenv("DSD_VERSION_CHECK_CACHE_TIMEOUT_MINUTES")
	if timeoutStr == "" {
		return 30 * time.Minute
	}

	timeoutMinutes, err := strconv.Atoi(timeoutStr)
	if err != nil {
		return 30 * time.Minute
	}

	return time.Duration(timeoutMinutes) * time.Minute
}

// CheckVersion returns (localVersion, remoteVersion, updateAvailable).
// It respects the DSD_VERSION_CHECK_ENABLED flag and caches remote lookups.
// Safe for concurrent use.
func CheckVersion() (string, string, bool) {
	localVersion, err := getLocalVersion()
	if err != nil {
		return "", "", false
	}

	if enabled, _ := strconv.ParseBool(os.Getenv("DSD_VERSION_CHECK_ENABLED")); !enabled {
		return localVersion, "", false
	}

	// Check whether the cached result is still fresh (read-locked).
	mu.RLock()
	cacheAge := time.Since(lastCheckTime)
	cachedRemote := cachedRemoteVersion
	mu.RUnlock()

	if cacheAge < getCacheTimeout() {
		localSemver, err := semver.Make(localVersion)
		if err != nil {
			return "", "", false
		}
		remoteSemver, err := semver.Make(cachedRemote)
		if err != nil {
			// cachedRemote is not valid semver (e.g. a pre-release tag):
			// return the cached string but do not claim an update is available.
			return localVersion, cachedRemote, false
		}
		return localVersion, cachedRemote, localSemver.LT(remoteSemver)
	}

	remoteVersion, err := getLatestRemoteVersion()
	if err != nil {
		return localVersion, "", false
	}

	// Write-lock only for the cache update.
	mu.Lock()
	lastCheckTime = time.Now()
	cachedRemoteVersion = remoteVersion
	mu.Unlock()

	localSemver, err := semver.Make(localVersion)
	if err != nil {
		return localVersion, remoteVersion, false
	}

	remoteSemver, err := semver.Make(remoteVersion)
	if err != nil {
		return localVersion, remoteVersion, false
	}

	return localVersion, remoteVersion, localSemver.LT(remoteSemver)
}
