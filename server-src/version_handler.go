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
}

// versionHandler handles the update check request
func versionHandler(w http.ResponseWriter, r *http.Request) {
	localVersion, remoteVersion, updateAvailable := version.CheckVersion()

	response := UpdateResponse{
		LocalVersion:    localVersion,
		RemoteVersion:   remoteVersion,
		UpdateAvailable: updateAvailable,
	}

	_ = json.NewEncoder(w).Encode(response)
}
