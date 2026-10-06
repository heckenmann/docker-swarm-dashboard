package main

import (
	"encoding/json"
	"net/http"

	"heckenmann.de/docker-swarm-dashboard/v2/internal/version"
)

// UpdateResponse represents the response structure for the update check
type UpdateResponse struct {
	LocalVersion    string `json:"version"`
	RemoteVersion   string `json:"remoteVersion"`
	UpdateAvailable bool   `json:"updateAvailable"`
	// LastChecked is the RFC 3339 timestamp of the last successful remote fetch,
	// or an empty string when no check has been performed yet.
	LastChecked string `json:"lastChecked"`
}

func queryVersion() UpdateResponse {
	localVersion, remoteVersion, updateAvailable := version.CheckVersion()

	lastChecked := ""
	if checkedAt := version.LastCheckTime(); !checkedAt.IsZero() {
		lastChecked = checkedAt.UTC().Format("2006-01-02T15:04:05Z")
	}

	return UpdateResponse{
		LocalVersion:    localVersion,
		RemoteVersion:   remoteVersion,
		UpdateAvailable: updateAvailable,
		LastChecked:     lastChecked,
	}
}

// versionHandler handles the update check request.
func versionHandler(w http.ResponseWriter, _ *http.Request) {
	if err := json.NewEncoder(w).Encode(queryVersion()); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}
