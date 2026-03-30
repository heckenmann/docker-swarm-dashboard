package main

import (
	"os"
	"testing"
)

func TestLoadDashboardSettingsFromEnv_UISettings(t *testing.T) {
	origs := map[string]string{}
	keys := []string{
		"DSD_TABLE_SIZE",
		"DSD_SERVICE_NAME_FILTER",
		"DSD_STACK_NAME_FILTER",
		"DSD_FILTER_TYPE",
		"DSD_LOGS_NUMBER_OF_LINES",
		"DSD_LOGS_MESSAGE_MAX_LEN",
		"DSD_LOGS_FORM_TAIL",
		"DSD_LOGS_FORM_SINCE",
		"DSD_LOGS_FORM_SINCE_AMOUNT",
		"DSD_LOGS_FORM_SINCE_UNIT",
		"DSD_LOGS_FORM_FOLLOW",
		"DSD_LOGS_FORM_TIMESTAMPS",
		"DSD_LOGS_FORM_STDOUT",
		"DSD_LOGS_FORM_STDERR",
		"DSD_LOGS_FORM_DETAILS",
		"DSD_LOGS_SEARCH_KEYWORD",
		"DSD_DARK_MODE",
		"DSD_SHOW_NAMES_BUTTONS",
		"DSD_SHOW_NAV_LABELS",
		"DSD_MAX_CONTENT_WIDTH",
		"DSD_REFRESH_INTERVAL",
	}
	for _, k := range keys {
		if v, ok := os.LookupEnv(k); ok {
			origs[k] = v
		} else {
			origs[k] = ""
		}
	}

	defer func() {
		for k, v := range origs {
			if v == "" {
				_ = os.Unsetenv(k)
			} else {
				_ = os.Setenv(k, v)
			}
		}
		resetUISettingsToDefaults()
	}()

	_ = os.Setenv("DSD_TABLE_SIZE", "lg")
	_ = os.Setenv("DSD_SERVICE_NAME_FILTER", "my-service")
	_ = os.Setenv("DSD_STACK_NAME_FILTER", "my-stack")
	_ = os.Setenv("DSD_FILTER_TYPE", "stack")
	_ = os.Setenv("DSD_LOGS_NUMBER_OF_LINES", "50")
	_ = os.Setenv("DSD_LOGS_MESSAGE_MAX_LEN", "5000")
	_ = os.Setenv("DSD_LOGS_FORM_TAIL", "100")
	_ = os.Setenv("DSD_LOGS_FORM_SINCE", "2h")
	_ = os.Setenv("DSD_LOGS_FORM_SINCE_AMOUNT", "2")
	_ = os.Setenv("DSD_LOGS_FORM_SINCE_UNIT", "hours")
	_ = os.Setenv("DSD_LOGS_FORM_FOLLOW", "true")
	_ = os.Setenv("DSD_LOGS_FORM_TIMESTAMPS", "true")
	_ = os.Setenv("DSD_LOGS_FORM_STDOUT", "false")
	_ = os.Setenv("DSD_LOGS_FORM_STDERR", "false")
	_ = os.Setenv("DSD_LOGS_FORM_DETAILS", "true")
	_ = os.Setenv("DSD_LOGS_SEARCH_KEYWORD", "error")
	_ = os.Setenv("DSD_DARK_MODE", "true")
	_ = os.Setenv("DSD_SHOW_NAMES_BUTTONS", "false")
	_ = os.Setenv("DSD_SHOW_NAV_LABELS", "true")
	_ = os.Setenv("DSD_MAX_CONTENT_WIDTH", "fixed")
	_ = os.Setenv("DSD_REFRESH_INTERVAL", "10000")

	loadDashboardSettingsFromEnv()

	if tableSize != "lg" {
		t.Fatalf("expected tableSize=lg got %s", tableSize)
	}
	if serviceNameFilter != "my-service" {
		t.Fatalf("expected serviceNameFilter=my-service got %s", serviceNameFilter)
	}
	if stackNameFilter != "my-stack" {
		t.Fatalf("expected stackNameFilter=my-stack got %s", stackNameFilter)
	}
	if filterType != "stack" {
		t.Fatalf("expected filterType=stack got %s", filterType)
	}
	if logsNumberOfLines != 50 {
		t.Fatalf("expected logsNumberOfLines=50 got %d", logsNumberOfLines)
	}
	if logsMessageMaxLen != 5000 {
		t.Fatalf("expected logsMessageMaxLen=5000 got %d", logsMessageMaxLen)
	}
	if logsFormTail != "100" {
		t.Fatalf("expected logsFormTail=100 got %s", logsFormTail)
	}
	if logsFormSince != "2h" {
		t.Fatalf("expected logsFormSince=2h got %s", logsFormSince)
	}
	if logsFormSinceAmount != "2" {
		t.Fatalf("expected logsFormSinceAmount=2 got %s", logsFormSinceAmount)
	}
	if logsFormSinceUnit != "hours" {
		t.Fatalf("expected logsFormSinceUnit=hours got %s", logsFormSinceUnit)
	}
	if !logsFormFollow {
		t.Fatalf("expected logsFormFollow=true got %v", logsFormFollow)
	}
	if !logsFormTimestamps {
		t.Fatalf("expected logsFormTimestamps=true got %v", logsFormTimestamps)
	}
	if logsFormStdout {
		t.Fatalf("expected logsFormStdout=false got %v", logsFormStdout)
	}
	if logsFormStderr {
		t.Fatalf("expected logsFormStderr=false got %v", logsFormStderr)
	}
	if !logsFormDetails {
		t.Fatalf("expected logsFormDetails=true got %v", logsFormDetails)
	}
	if logsSearchKeyword != "error" {
		t.Fatalf("expected logsSearchKeyword=error got %s", logsSearchKeyword)
	}
	if !isDarkMode {
		t.Fatalf("expected isDarkMode=true got %v", isDarkMode)
	}
	if showNamesButtons {
		t.Fatalf("expected showNamesButtons=false got %v", showNamesButtons)
	}
	if !showNavLabels {
		t.Fatalf("expected showNavLabels=true got %v", showNavLabels)
	}
	if maxContentWidth != "fixed" {
		t.Fatalf("expected maxContentWidth=fixed got %s", maxContentWidth)
	}
	if refreshInterval == nil || *refreshInterval != 10000 {
		t.Fatalf("expected refreshInterval=10000 got %v", refreshInterval)
	}
}

func TestLoadDashboardSettingsFromEnv_UISettingsDefaults(t *testing.T) {
	origs := map[string]string{}
	keys := []string{
		"DSD_TABLE_SIZE",
		"DSD_SERVICE_NAME_FILTER",
		"DSD_STACK_NAME_FILTER",
		"DSD_FILTER_TYPE",
		"DSD_LOGS_NUMBER_OF_LINES",
		"DSD_LOGS_MESSAGE_MAX_LEN",
		"DSD_LOGS_FORM_TAIL",
		"DSD_LOGS_FORM_SINCE",
		"DSD_LOGS_FORM_SINCE_AMOUNT",
		"DSD_LOGS_FORM_SINCE_UNIT",
		"DSD_LOGS_FORM_FOLLOW",
		"DSD_LOGS_FORM_TIMESTAMPS",
		"DSD_LOGS_FORM_STDOUT",
		"DSD_LOGS_FORM_STDERR",
		"DSD_LOGS_FORM_DETAILS",
		"DSD_LOGS_SEARCH_KEYWORD",
		"DSD_DARK_MODE",
		"DSD_SHOW_NAMES_BUTTONS",
		"DSD_SHOW_NAV_LABELS",
		"DSD_MAX_CONTENT_WIDTH",
		"DSD_REFRESH_INTERVAL",
	}
	for _, k := range keys {
		if v, ok := os.LookupEnv(k); ok {
			origs[k] = v
		} else {
			origs[k] = ""
		}
	}

	defer func() {
		for k, v := range origs {
			if v == "" {
				_ = os.Unsetenv(k)
			} else {
				_ = os.Setenv(k, v)
			}
		}
		resetUISettingsToDefaults()
	}()

	for _, k := range keys {
		_ = os.Unsetenv(k)
	}

	loadDashboardSettingsFromEnv()

	if tableSize != "sm" {
		t.Fatalf("expected tableSize default=sm got %s", tableSize)
	}
	if serviceNameFilter != "" {
		t.Fatalf("expected serviceNameFilter default='' got %s", serviceNameFilter)
	}
	if stackNameFilter != "" {
		t.Fatalf("expected stackNameFilter default='' got %s", stackNameFilter)
	}
	if filterType != "service" {
		t.Fatalf("expected filterType default=service got %s", filterType)
	}
	if logsNumberOfLines != 20 {
		t.Fatalf("expected logsNumberOfLines default=20 got %d", logsNumberOfLines)
	}
	if logsMessageMaxLen != 10000 {
		t.Fatalf("expected logsMessageMaxLen default=10000 got %d", logsMessageMaxLen)
	}
	if logsFormTail != "20" {
		t.Fatalf("expected logsFormTail default=20 got %s", logsFormTail)
	}
	if logsFormSince != "1h" {
		t.Fatalf("expected logsFormSince default=1h got %s", logsFormSince)
	}
	if logsFormSinceAmount != "1" {
		t.Fatalf("expected logsFormSinceAmount default=1 got %s", logsFormSinceAmount)
	}
	if logsFormSinceUnit != "h" {
		t.Fatalf("expected logsFormSinceUnit default=h got %s", logsFormSinceUnit)
	}
	if logsFormFollow {
		t.Fatalf("expected logsFormFollow default=false got %v", logsFormFollow)
	}
	if logsFormTimestamps {
		t.Fatalf("expected logsFormTimestamps default=false got %v", logsFormTimestamps)
	}
	if !logsFormStdout {
		t.Fatalf("expected logsFormStdout default=true got %v", logsFormStdout)
	}
	if !logsFormStderr {
		t.Fatalf("expected logsFormStderr default=true got %v", logsFormStderr)
	}
	if logsFormDetails {
		t.Fatalf("expected logsFormDetails default=false got %v", logsFormDetails)
	}
	if logsSearchKeyword != "" {
		t.Fatalf("expected logsSearchKeyword default='' got %s", logsSearchKeyword)
	}
	if isDarkMode {
		t.Fatalf("expected isDarkMode default=false got %v", isDarkMode)
	}
	if !showNamesButtons {
		t.Fatalf("expected showNamesButtons default=true got %v", showNamesButtons)
	}
	if showNavLabels {
		t.Fatalf("expected showNavLabels default=false got %v", showNavLabels)
	}
	if maxContentWidth != "fluid" {
		t.Fatalf("expected maxContentWidth default=fluid got %s", maxContentWidth)
	}
	if refreshInterval != nil {
		t.Fatalf("expected refreshInterval default=nil got %v", refreshInterval)
	}
}

func TestLoadDashboardSettingsFromEnv_UISettingsInvalidValues(t *testing.T) {
	origs := map[string]string{}
	keys := []string{
		"DSD_LOGS_NUMBER_OF_LINES",
		"DSD_LOGS_MESSAGE_MAX_LEN",
		"DSD_LOGS_FORM_FOLLOW",
		"DSD_LOGS_FORM_TIMESTAMPS",
		"DSD_LOGS_FORM_STDOUT",
		"DSD_LOGS_FORM_STDERR",
		"DSD_LOGS_FORM_DETAILS",
		"DSD_DARK_MODE",
		"DSD_SHOW_NAMES_BUTTONS",
		"DSD_SHOW_NAV_LABELS",
		"DSD_REFRESH_INTERVAL",
	}
	for _, k := range keys {
		if v, ok := os.LookupEnv(k); ok {
			origs[k] = v
		} else {
			origs[k] = ""
		}
	}

	defer func() {
		for k, v := range origs {
			if v == "" {
				_ = os.Unsetenv(k)
			} else {
				_ = os.Setenv(k, v)
			}
		}
		resetUISettingsToDefaults()
	}()

	_ = os.Setenv("DSD_LOGS_NUMBER_OF_LINES", "not-a-number")
	_ = os.Setenv("DSD_LOGS_MESSAGE_MAX_LEN", "invalid")
	_ = os.Setenv("DSD_LOGS_FORM_FOLLOW", "yes")
	_ = os.Setenv("DSD_LOGS_FORM_TIMESTAMPS", "truthy")
	_ = os.Setenv("DSD_LOGS_FORM_STDOUT", "invalid")
	_ = os.Setenv("DSD_LOGS_FORM_STDERR", "invalid")
	_ = os.Setenv("DSD_LOGS_FORM_DETAILS", "invalid")
	_ = os.Setenv("DSD_DARK_MODE", "on")
	_ = os.Setenv("DSD_SHOW_NAMES_BUTTONS", "invalid")
	_ = os.Setenv("DSD_SHOW_NAV_LABELS", "invalid")
	_ = os.Setenv("DSD_REFRESH_INTERVAL", "abc")

	loadDashboardSettingsFromEnv()

	if logsNumberOfLines != 20 {
		t.Fatalf("logsNumberOfLines should remain at default 20 on invalid input, got %d", logsNumberOfLines)
	}
	if logsMessageMaxLen != 10000 {
		t.Fatalf("logsMessageMaxLen should remain at default 10000 on invalid input, got %d", logsMessageMaxLen)
	}
	if logsFormFollow {
		t.Fatalf("logsFormFollow should remain at default false on invalid input, got %v", logsFormFollow)
	}
	if logsFormTimestamps {
		t.Fatalf("logsFormTimestamps should remain at default false on invalid input, got %v", logsFormTimestamps)
	}
	if logsFormStdout {
		t.Fatalf("logsFormStdout should be false on invalid input, got %v", logsFormStdout)
	}
	if logsFormStderr {
		t.Fatalf("logsFormStderr should be false on invalid input, got %v", logsFormStderr)
	}
	if logsFormDetails {
		t.Fatalf("logsFormDetails should be false on invalid input, got %v", logsFormDetails)
	}
	if isDarkMode {
		t.Fatalf("isDarkMode should be false on invalid input, got %v", isDarkMode)
	}
	if showNamesButtons != false {
		t.Fatalf("showNamesButtons should be false on invalid input, got %v", showNamesButtons)
	}
	if showNavLabels != false {
		t.Fatalf("showNavLabels should be false on invalid input, got %v", showNavLabels)
	}
	if refreshInterval != nil {
		t.Fatalf("refreshInterval should be nil on invalid input, got %v", refreshInterval)
	}
}

func resetUISettingsToDefaults() {
	tableSize = "sm"
	serviceNameFilter = ""
	stackNameFilter = ""
	filterType = "service"
	logsNumberOfLines = 20
	logsMessageMaxLen = 10000
	logsFormTail = "20"
	logsFormSince = "1h"
	logsFormSinceAmount = "1"
	logsFormSinceUnit = "h"
	logsFormFollow = false
	logsFormTimestamps = false
	logsFormStdout = true
	logsFormStderr = true
	logsFormDetails = false
	logsSearchKeyword = ""
	isDarkMode = false
	showNamesButtons = true
	showNavLabels = false
	maxContentWidth = "fluid"
	refreshInterval = (*int)(nil)
}
