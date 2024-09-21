package main

import (
	"encoding/json"
	"net/http"
	"os"
	"strconv"
	"strings"
)

type dashboardSettings struct {
	ShowLogsButton      bool     `json:"showLogsButton"`
	DefaultLayout       string   `json:"defaultLayout"`
	HiddenServiceStates []string `json:"hiddenServiceStates"`
	TimeZone            *string  `json:"timeZone"`
	Locale              *string  `json:"locale"`
	Version             *string  `json:"version"`
	VersionCheckEnabled bool     `json:"versionCheckEnabled"`
}

var (
	handlingLogs        = true
	dashboardLayout     = "row"
	hiddenServiceStates = make([]string, 0)
	timeZone            = new(string)
	locale              = new(string)
	version             = new(string)
	versionCheckEnabled = false
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

	if hiddenServiceStatesEnvValue, hiddenServiceStatesSet := os.LookupEnv("DSD_HIDE_SERVICE_STATES"); hiddenServiceStatesSet {
		for _, state := range strings.Split(hiddenServiceStatesEnvValue, ",") {
			hiddenServiceStates = append(hiddenServiceStates, strings.ToLower(strings.TrimSpace(state)))
		}
	}

	if timeZoneEnvValue, timeZoneSet := os.LookupEnv("TZ"); timeZoneSet {
		timeZone = &timeZoneEnvValue
	}

	if localeEnvValue, localeSet := os.LookupEnv("LOCALE"); localeSet {
		locale = &localeEnvValue
	}

	if versionEnvValue, versionSet := os.LookupEnv("VERSION"); versionSet {
		version = &versionEnvValue
	}

	if versionCheckEnabledEnvValue, versionCheckEnabledSet := os.LookupEnv("VERSION_CHECK_ENABLED"); versionCheckEnabledSet {
		versionCheckEnabled, _ = strconv.ParseBool(versionCheckEnabledEnvValue)
	}
}

func dashboardSettingsHandler(w http.ResponseWriter, _ *http.Request) {
	jsonString, _ := json.Marshal(dashboardSettings{
		ShowLogsButton:      handlingLogs,
		DefaultLayout:       dashboardLayout,
		HiddenServiceStates: hiddenServiceStates,
		TimeZone:            timeZone,
		Locale:              locale,
		Version:             version,
		VersionCheckEnabled: versionCheckEnabled,
	})
	w.Header().Set("Content-Type", "application/json")
	w.Write(jsonString)
}
