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

	// UI Settings defaults
	TableSize           string `json:"tableSize"`
	ServiceNameFilter   string `json:"serviceNameFilter"`
	StackNameFilter     string `json:"stackNameFilter"`
	FilterType          string `json:"filterType"`
	LogsNumberOfLines   int    `json:"logsNumberOfLines"`
	LogsMessageMaxLen   int    `json:"logsMessageMaxLen"`
	LogsFormTail        string `json:"logsFormTail"`
	LogsFormSince       string `json:"logsFormSince"`
	LogsFormSinceAmount string `json:"logsFormSinceAmount"`
	LogsFormSinceUnit   string `json:"logsFormSinceUnit"`
	LogsFormFollow      bool   `json:"logsFormFollow"`
	LogsFormTimestamps  bool   `json:"logsFormTimestamps"`
	LogsFormStdout      bool   `json:"logsFormStdout"`
	LogsFormStderr      bool   `json:"logsFormStderr"`
	LogsFormDetails     bool   `json:"logsFormDetails"`
	LogsSearchKeyword   string `json:"logsSearchKeyword"`
	IsDarkMode          bool   `json:"isDarkMode"`
	ShowNamesButtons    bool   `json:"showNamesButtons"`
	ShowNavLabels       bool   `json:"showNavLabels"`
	MaxContentWidth     string `json:"maxContentWidth"`
	RefreshInterval     *int   `json:"refreshInterval"`
}

var (
	handlingLogs                     = true
	dashboardLayout                  = "row"
	hiddenServiceStates              = make([]string, 0)
	timeZone                         = new(string)
	locale                           = new(string)
	versionCheckEnabled              = false
	versionCheckCacheDurationMinutes = 30 * time.Minute
	welcomeMessage                   *string

	// UI Settings defaults
	tableSize           = "sm"
	serviceNameFilter   = ""
	stackNameFilter     = ""
	filterType          = "service"
	logsNumberOfLines   = 20
	logsMessageMaxLen   = 10000
	logsFormTail        = "20"
	logsFormSince       = "1h"
	logsFormSinceAmount = "1"
	logsFormSinceUnit   = "h"
	logsFormFollow      = false
	logsFormTimestamps  = false
	logsFormStdout      = true
	logsFormStderr      = true
	logsFormDetails     = false
	logsSearchKeyword   = ""
	isDarkMode          = false
	showNamesButtons    = true
	showNavLabels       = false
	maxContentWidth     = "fluid"
	refreshInterval     = (*int)(nil)
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
	} else {
		// Use server's timezone if no env var is set
		timeZone = new(string)
		*timeZone = time.Now().Location().String()
	}

	if localeEnvValue, localeSet := os.LookupEnv("LOCALE"); localeSet {
		locale = &localeEnvValue
	} else {
		// Use server's locale if no env var is set
		locale = new(string)
		*locale = "en-US"
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

	// UI Settings with hash-based defaults
	if tableSizeEnvValue, tableSizeSet := os.LookupEnv("DSD_TABLE_SIZE"); tableSizeSet {
		tableSize = tableSizeEnvValue
	}

	if serviceNameFilterEnvValue, serviceNameFilterSet := os.LookupEnv("DSD_SERVICE_NAME_FILTER"); serviceNameFilterSet {
		serviceNameFilter = serviceNameFilterEnvValue
	}

	if stackNameFilterEnvValue, stackNameFilterSet := os.LookupEnv("DSD_STACK_NAME_FILTER"); stackNameFilterSet {
		stackNameFilter = stackNameFilterEnvValue
	}

	if filterTypeEnvValue, filterTypeSet := os.LookupEnv("DSD_FILTER_TYPE"); filterTypeSet {
		filterType = filterTypeEnvValue
	}

	if logsNumberOfLinesEnvValue, logsNumberOfLinesSet := os.LookupEnv("DSD_LOGS_NUMBER_OF_LINES"); logsNumberOfLinesSet {
		if lines, err := strconv.Atoi(logsNumberOfLinesEnvValue); err == nil {
			logsNumberOfLines = lines
		}
	}

	if logsMessageMaxLenEnvValue, logsMessageMaxLenSet := os.LookupEnv("DSD_LOGS_MESSAGE_MAX_LEN"); logsMessageMaxLenSet {
		if maxLen, err := strconv.Atoi(logsMessageMaxLenEnvValue); err == nil {
			logsMessageMaxLen = maxLen
		}
	}

	if logsFormTailEnvValue, logsFormTailSet := os.LookupEnv("DSD_LOGS_FORM_TAIL"); logsFormTailSet {
		logsFormTail = logsFormTailEnvValue
	}

	if logsFormSinceEnvValue, logsFormSinceSet := os.LookupEnv("DSD_LOGS_FORM_SINCE"); logsFormSinceSet {
		logsFormSince = logsFormSinceEnvValue
	}

	if logsFormSinceAmountEnvValue, logsFormSinceAmountSet := os.LookupEnv("DSD_LOGS_FORM_SINCE_AMOUNT"); logsFormSinceAmountSet {
		logsFormSinceAmount = logsFormSinceAmountEnvValue
	}

	if logsFormSinceUnitEnvValue, logsFormSinceUnitSet := os.LookupEnv("DSD_LOGS_FORM_SINCE_UNIT"); logsFormSinceUnitSet {
		logsFormSinceUnit = logsFormSinceUnitEnvValue
	}

	if logsFormFollowEnvValue, logsFormFollowSet := os.LookupEnv("DSD_LOGS_FORM_FOLLOW"); logsFormFollowSet {
		logsFormFollow, _ = strconv.ParseBool(logsFormFollowEnvValue)
	}

	if logsFormTimestampsEnvValue, logsFormTimestampsSet := os.LookupEnv("DSD_LOGS_FORM_TIMESTAMPS"); logsFormTimestampsSet {
		logsFormTimestamps, _ = strconv.ParseBool(logsFormTimestampsEnvValue)
	}

	if logsFormStdoutEnvValue, logsFormStdoutSet := os.LookupEnv("DSD_LOGS_FORM_STDOUT"); logsFormStdoutSet {
		logsFormStdout, _ = strconv.ParseBool(logsFormStdoutEnvValue)
	}

	if logsFormStderrEnvValue, logsFormStderrSet := os.LookupEnv("DSD_LOGS_FORM_STDERR"); logsFormStderrSet {
		logsFormStderr, _ = strconv.ParseBool(logsFormStderrEnvValue)
	}

	if logsFormDetailsEnvValue, logsFormDetailsSet := os.LookupEnv("DSD_LOGS_FORM_DETAILS"); logsFormDetailsSet {
		logsFormDetails, _ = strconv.ParseBool(logsFormDetailsEnvValue)
	}

	if logsSearchKeywordEnvValue, logsSearchKeywordSet := os.LookupEnv("DSD_LOGS_SEARCH_KEYWORD"); logsSearchKeywordSet {
		logsSearchKeyword = logsSearchKeywordEnvValue
	}

	if isDarkModeEnvValue, isDarkModeSet := os.LookupEnv("DSD_DARK_MODE"); isDarkModeSet {
		isDarkMode, _ = strconv.ParseBool(isDarkModeEnvValue)
	}

	if showNamesButtonsEnvValue, showNamesButtonsSet := os.LookupEnv("DSD_SHOW_NAMES_BUTTONS"); showNamesButtonsSet {
		showNamesButtons, _ = strconv.ParseBool(showNamesButtonsEnvValue)
	}

	if showNavLabelsEnvValue, showNavLabelsSet := os.LookupEnv("DSD_SHOW_NAV_LABELS"); showNavLabelsSet {
		showNavLabels, _ = strconv.ParseBool(showNavLabelsEnvValue)
	}

	if maxContentWidthEnvValue, maxContentWidthSet := os.LookupEnv("DSD_MAX_CONTENT_WIDTH"); maxContentWidthSet {
		maxContentWidth = maxContentWidthEnvValue
	}

	if refreshIntervalEnvValue, refreshIntervalSet := os.LookupEnv("DSD_REFRESH_INTERVAL"); refreshIntervalSet {
		if interval, err := strconv.Atoi(refreshIntervalEnvValue); err == nil {
			refreshInterval = &interval
		}
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
		TableSize:                        tableSize,
		ServiceNameFilter:                serviceNameFilter,
		StackNameFilter:                  stackNameFilter,
		FilterType:                       filterType,
		LogsNumberOfLines:                logsNumberOfLines,
		LogsMessageMaxLen:                logsMessageMaxLen,
		LogsFormTail:                     logsFormTail,
		LogsFormSince:                    logsFormSince,
		LogsFormSinceAmount:              logsFormSinceAmount,
		LogsFormSinceUnit:                logsFormSinceUnit,
		LogsFormFollow:                   logsFormFollow,
		LogsFormTimestamps:               logsFormTimestamps,
		LogsFormStdout:                   logsFormStdout,
		LogsFormStderr:                   logsFormStderr,
		LogsFormDetails:                  logsFormDetails,
		LogsSearchKeyword:                logsSearchKeyword,
		IsDarkMode:                       isDarkMode,
		ShowNamesButtons:                 showNamesButtons,
		ShowNavLabels:                    showNavLabels,
		MaxContentWidth:                  maxContentWidth,
		RefreshInterval:                  refreshInterval,
	})
	w.Header().Set("Content-Type", "application/json")
	_, _ = w.Write(jsonString)
}
