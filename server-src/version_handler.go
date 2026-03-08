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

// versionHandler handles the update check request
func versionHandler(w http.ResponseWriter, r *http.Request) {
	localVersion, remoteVersion, updateAvailable := version.CheckVersion()

	lastChecked := ""
	if t := version.LastCheckTime(); !t.IsZero() {
		lastChecked = t.UTC().Format("2006-01-02T15:04:05Z")
	}

	response := UpdateResponse{
		LocalVersion:    localVersion,
		RemoteVersion:   remoteVersion,
		UpdateAvailable: updateAvailable,
		LastChecked:     lastChecked,
	}

	_ = json.NewEncoder(w).Encode(response)
}
