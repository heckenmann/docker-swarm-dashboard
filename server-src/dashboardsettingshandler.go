package main

import (
	"encoding/json"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"
)

type dashboardSettings struct {
	ShowLogsButton                   bool          `json:"showLogsButton"`
	DefaultLayout                    string        `json:"defaultLayout"`
	HiddenServiceStates              []string      `json:"hiddenServiceStates"`
	TimeZone                         *string       `json:"timeZone"`
	Locale                           *string       `json:"locale"`
	VersionCheckEnabled              bool          `json:"versionCheckEnabled"`
	VersionCheckCacheDurationMinutes time.Duration `json:"versionCheckCacheDurationMinutes"`
	WelcomeMessage                   *string       `json:"welcomeMessage"`
}

var (
	handlingLogs                     = true
	dashboardLayout                  = "row"
	hiddenServiceStates              = make([]string, 0)
	timeZone                         = new(string)
	locale                           = new(string)
	versionCheckEnabled              = false
	versionCheckCacheDurationMinutes = 30 * time.Minute
	welcomeMessage                   = new(string)
)

func init() {
	loadDashboardSettingsFromEnv()
}

// loadDashboardSettingsFromEnv reads environment variables and updates
// package-level dashboard settings; exported to be testable.
func loadDashboardSettingsFromEnv() {
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

	if versionCheckEnabledEnvValue, versionCheckEnabledSet := os.LookupEnv("DSD_VERSION_CHECK_ENABLED"); versionCheckEnabledSet {
		versionCheckEnabled, _ = strconv.ParseBool(versionCheckEnabledEnvValue)
	}

	if versionCheckCacheDurationEnvValue, versionCheckCacheDurationSet := os.LookupEnv("DSD_VERSION_CHECK_CACHE_TIMEOUT_MINUTES"); versionCheckCacheDurationSet {
		if minutes, err := strconv.Atoi(versionCheckCacheDurationEnvValue); err == nil {
			versionCheckCacheDurationMinutes = time.Duration(minutes) * time.Minute
		}
	}

	if welcomeMessageEnvValue, welcomeMessageSet := os.LookupEnv("DSD_WELCOME_MESSAGE"); welcomeMessageSet {
		welcomeMessage = &welcomeMessageEnvValue
	}
}

func dashboardSettingsHandler(w http.ResponseWriter, _ *http.Request) {
	jsonString, _ := json.Marshal(dashboardSettings{
		ShowLogsButton:                   handlingLogs,
		DefaultLayout:                    dashboardLayout,
		HiddenServiceStates:              hiddenServiceStates,
		TimeZone:                         timeZone,
		Locale:                           locale,
		VersionCheckEnabled:              versionCheckEnabled,
		VersionCheckCacheDurationMinutes: versionCheckCacheDurationMinutes,
		WelcomeMessage:                   welcomeMessage,
	})
	w.Header().Set("Content-Type", "application/json")
	w.Write(jsonString)
}
