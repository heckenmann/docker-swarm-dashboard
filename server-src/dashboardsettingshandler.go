package main

import (
	"encoding/json"
	"net/http"
)

type dashboardSettings struct {
	ShowLogsButton bool `json:"showLogsButton"`
}

func dashboardSettingsHandler(w http.ResponseWriter, _ *http.Request) {
	jsonString, _ := json.Marshal(dashboardSettings{handlingLogs})
	w.Header().Set("Content-Type", "application/json")
	w.Write(jsonString)
}
