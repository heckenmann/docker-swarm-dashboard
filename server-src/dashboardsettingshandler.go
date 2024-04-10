package main

import (
	"encoding/json"
	"net/http"
	"os"
	"strconv"
	"strings"
)

type dashboardSettings struct {
	ShowLogsButton bool   `json:"showLogsButton"`
	DefaultLayout  string `json:"defaultLayout"`
}

var (
	handlingLogs    = true
	dashboardLayout = "row"
)

func init() {
	if handleLogsEnvValue, handleLogsSet := os.LookupEnv("DSD_HANDLE_LOGS"); handleLogsSet {
		handlingLogs, _ = strconv.ParseBool(handleLogsEnvValue)
	}

	if dashboardLayoutEnvValue, dashboardLayoutSet := os.LookupEnv("DSD_DASHBOARD_LAYOUT"); dashboardLayoutSet {
		if strings.HasPrefix(strings.ToLower(dashboardLayoutEnvValue), "col") {
			dashboardLayout = "column"
		}
	}
}

func dashboardSettingsHandler(w http.ResponseWriter, _ *http.Request) {
	jsonString, _ := json.Marshal(dashboardSettings{
		handlingLogs,
		dashboardLayout})
	w.Header().Set("Content-Type", "application/json")
	w.Write(jsonString)
}
