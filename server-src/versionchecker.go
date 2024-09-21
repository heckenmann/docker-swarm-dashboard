package main

import (
	"encoding/json"
	"fmt"
	"github.com/blang/semver"
	"net/http"
	"os"
	"strconv"
	"time"
)

// GitHubRelease represents a release in GitHub
type GitHubRelease struct {
	TagName string `json:"tag_name"`
}

// getLocalVersion reads the local version from the environment variable `VERSION`
func getLocalVersion() (string, error) {
	version := os.Getenv("DSD_VERSION")
	if version == "" {
		return "", fmt.Errorf("local version not set")
	}
	return version, nil
}

// getLatestRemoteVersion fetches the latest version of the release from the GitHub repository
func getLatestRemoteVersion() (string, error) {
	url := os.Getenv("DSD_VERSION_RELEASE_URL")
	if url == "" {
		fmt.Println("Warning: DSD_VERSION_RELEASE_URL is not set")
		return "", fmt.Errorf("release URL not set")
	}

	resp, err := http.Get(url)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var release GitHubRelease
	if err := json.NewDecoder(resp.Body).Decode(&release); err != nil {
		return "", err
	}

	return release.TagName, nil
}

var (
	lastCheckTime       time.Time
	cachedRemoteVersion string
)

// getCacheTimeout reads the environment variable DSD_VERSION_CHECK_CACHE_TIMEOUT_MINUTES and converts it to a time.Duration
func getCacheTimeout() time.Duration {
	timeoutStr := os.Getenv("DSD_VERSION_CHECK_CACHE_TIMEOUT_MINUTES")
	if timeoutStr == "" {
		// Set default value to 60 minutes if the environment variable is not set
		return 30 * time.Minute
	}

	timeoutMinutes, err := strconv.Atoi(timeoutStr)
	if err != nil {
		fmt.Println("Error converting DSD_VERSION_CHECK_CACHE_TIMEOUT_MINUTES:", err)
		// Set default value to 60 minutes if the conversion fails
		return 30 * time.Minute
	}

	return time.Duration(timeoutMinutes) * time.Minute
}

// checkVersion checks if an update is available
func checkVersion() (string, string, bool) {
	// Get local version
	// Get local version
	localVersion, err := getLocalVersion()
	if err != nil {
		fmt.Println("Error getting local version:", err)
		return "", "", false
	}

	// Check if version check is enabled
	if enabled, _ := strconv.ParseBool(os.Getenv("DSD_VERSION_CHECK_ENABLED")); !enabled {
		return localVersion, "", false
	}

	// Check if cached version is still valid
	if time.Since(lastCheckTime) < getCacheTimeout() {
		localSemver, err := semver.Make(localVersion)
		if err != nil {
			fmt.Println("Error parsing local version:", err)
			return "", "", false
		}
		return localVersion, cachedRemoteVersion, localSemver.LT(semver.MustParse(cachedRemoteVersion))
	}

	// Get latest remote version
	remoteVersion, err := getLatestRemoteVersion()
	if err != nil {
		fmt.Println("Error getting remote version:", err)
		return localVersion, "", false
	}

	// Update cache
	lastCheckTime = time.Now()
	cachedRemoteVersion = remoteVersion
	if err != nil {
		fmt.Println("Error getting remote version:", err)
		return localVersion, remoteVersion, false
	}

	// Parse versions
	localSemver, err := semver.Make(localVersion)
	if err != nil {
		fmt.Println("Error parsing local version:", err)
		return localVersion, remoteVersion, false
	}

	remoteSemver, err := semver.Make(remoteVersion)
	if err != nil {
		fmt.Println("Error parsing remote version:", err)
		return localVersion, remoteVersion, false
	}

	// Compare versions
	updateAvailable := localSemver.LT(remoteSemver)

	return localVersion, remoteVersion, updateAvailable
}
