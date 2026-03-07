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
	"time"

	"github.com/blang/semver"
)

// gitHubRelease represents a release entry from the GitHub Releases API.
type gitHubRelease struct {
	TagName string `json:"tag_name"`
}

var (
	lastCheckTime       time.Time
	cachedRemoteVersion string
)

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
func CheckVersion() (string, string, bool) {
	localVersion, err := getLocalVersion()
	if err != nil {
		return "", "", false
	}

	if enabled, _ := strconv.ParseBool(os.Getenv("DSD_VERSION_CHECK_ENABLED")); !enabled {
		return localVersion, "", false
	}

	// Return cached result if still fresh
	if time.Since(lastCheckTime) < getCacheTimeout() {
		localSemver, err := semver.Make(localVersion)
		if err != nil {
			return "", "", false
		}
		return localVersion, cachedRemoteVersion, localSemver.LT(semver.MustParse(cachedRemoteVersion))
	}

	remoteVersion, err := getLatestRemoteVersion()
	if err != nil {
		return localVersion, "", false
	}

	lastCheckTime = time.Now()
	cachedRemoteVersion = remoteVersion

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
