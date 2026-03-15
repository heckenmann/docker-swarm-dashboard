import { useAtom, useAtomValue } from 'jotai'
import {
  baseUrlAtom,
  currentVariantAtom,
  currentVariantClassesAtom,
  isDarkModeAtom,
  tableSizeAtom,
  refreshIntervalAtom,
  showNamesButtonsAtom,
  showNavLabelsAtom,
  maxContentWidthAtom,
  defaultLayoutAtom,
  hiddenServiceStatesAtom,
  timeZoneAtom,
  localeAtom,
  dashboardSettingsAtom,
} from '../../common/store/atoms'
import { RefreshIntervalToggleReducer } from '../../common/store/reducers'
import { Card, Table, Button } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import { ApiUrlRow } from './rows/ApiUrlRow'
import { RefreshIntervalRow } from './rows/RefreshIntervalRow'
import { DarkModeRow } from './rows/DarkModeRow'
import { TableSizeRow } from './rows/TableSizeRow'
import { CenteredLayoutRow } from './rows/CenteredLayoutRow'
import { ShowNavLabelsRow } from './rows/ShowNavLabelsRow'
import { ShowNamesButtonsRow } from './rows/ShowNamesButtonsRow'
import { DefaultLayoutRow } from './rows/DefaultLayoutRow'
import { HiddenServiceStatesRow } from './rows/HiddenServiceStatesRow'
import { TimeZoneRow } from './rows/TimeZoneRow'
import { LocaleRow } from './rows/LocaleRow'

/**
 * SettingsComponent is a React functional component that renders a settings panel.
 * It allows users to configure various settings such as API URL, refresh interval,
 * dark mode, and table size.
 */
function SettingsComponent() {
  const currentVariant = useAtomValue(currentVariantAtom)
  const currentVariantClasses = useAtomValue(currentVariantClassesAtom)
  const [isDarkMode, setIsDarkMode] = useAtom(isDarkModeAtom)
  const [tableSize, setTableSize] = useAtom(tableSizeAtom)
  const [_refreshInterval, _toggleRefresh] = useAtom(
    refreshIntervalAtom,
    RefreshIntervalToggleReducer,
  )
  const [_showNamesButtons, setShowNamesButtons] = useAtom(showNamesButtonsAtom)
  const [_showNavLabels, setShowNavLabels] = useAtom(showNavLabelsAtom)
  const [_maxContentWidth, setMaxContentWidth] = useAtom(maxContentWidthAtom)
  const [_defaultLayout, setDefaultLayout] = useAtom(defaultLayoutAtom)
  const [_hiddenServiceStates, setHiddenServiceStates] = useAtom(
    hiddenServiceStatesAtom,
  )
  const [_timeZone, setTimeZone] = useAtom(timeZoneAtom)
  const [, setLocale] = useAtom(localeAtom)
  const [, setBaseUrl] = useAtom(baseUrlAtom)
  const dashboardSettings = useAtomValue(dashboardSettingsAtom)

  const computeDefaultBase = () => {
    try {
      const hash = (window.location.hash || '').startsWith('#')
        ? window.location.hash.substring(1)
        : window.location.hash || ''
      const params = new URLSearchParams(hash)
      const base = params.get('base')
      return base ? base.replaceAll('"', '') : window.location.pathname
    } catch {
      return window.location.pathname
    }
  }

  const resetDefaults = () => {
    setBaseUrl(computeDefaultBase())
    // Reset to server defaults from dashboardSettingsAtom
    setIsDarkMode(dashboardSettings.isDarkMode)
    setTableSize(dashboardSettings.tableSize)
    setShowNamesButtons(dashboardSettings.showNamesButtons)
    setShowNavLabels(dashboardSettings.showNavLabels)
    setMaxContentWidth(dashboardSettings.maxContentWidth)
    setDefaultLayout(dashboardSettings.defaultLayout)
    setHiddenServiceStates(dashboardSettings.hiddenServiceStates || [])
    setTimeZone(dashboardSettings.timeZone || '')
    setLocale(dashboardSettings.locale || '')
  }

  return (
    <Card bg={currentVariant} className={currentVariantClasses}>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <div>
          <FontAwesomeIcon icon="cog" className="me-2" />
          <strong>Settings</strong>
        </div>
      </Card.Header>
      <div className="p-3">
        <p className="small text-muted mb-3">
          Server-side defaults can be configured via environment variables in
          docker-compose.yml:
        </p>
        <pre className="text-monospace" style={{ maxHeight: '200px' }}>
          version: '3.8' services: dashboard: image:
          docker-swarm-dashboard:latest ports: - '8080:8080' environment: # UI
          Settings - DSD_TABLE_SIZE=sm - DSD_SERVICE_NAME_FILTER= -
          DSD_STACK_NAME_FILTER= - DSD_FILTER_TYPE=service -
          DSD_LOGS_NUMBER_OF_LINES=20 - DSD_LOGS_MESSAGE_MAX_LEN=10000 -
          DSD_LOGS_FORM_TAIL=20 - DSD_LOGS_FORM_SINCE=1h -
          DSD_LOGS_FORM_SINCE_AMOUNT=1 - DSD_LOGS_FORM_SINCE_UNIT=h -
          DSD_LOGS_FORM_FOLLOW=false - DSD_LOGS_FORM_TIMESTAMPS=false -
          DSD_LOGS_FORM_STDOUT=true - DSD_LOGS_FORM_STDERR=true -
          DSD_LOGS_FORM_DETAILS=false - DSD_LOGS_SEARCH_KEYWORD= -
          DSD_DARK_MODE=false - DSD_SHOW_NAMES_BUTTONS=true -
          DSD_SHOW_NAV_LABELS=false - DSD_MAX_CONTENT_WIDTH=fluid -
          DSD_DASHBOARD_LAYOUT=row - DSD_HIDE_SERVICE_STATES= - DSD_TIME_ZONE= -
          DSD_LOCALE= - DSD_REFRESH_INTERVAL= restart: unless-stopped
        </pre>
      </div>
      <Table
        variant={isDarkMode ? currentVariant : null}
        striped
        size={tableSize}
      >
        <thead>
          <tr>
            <th></th>
            <th className="col-sm-5">Setting</th>
            <th className="col-sm-4">Value</th>
            <th className="col-sm-1">Default</th>
            <th className="col-sm-1">Reset</th>
          </tr>
        </thead>
        <tbody>
          <ApiUrlRow />
          <RefreshIntervalRow />
          <DarkModeRow />
          <TableSizeRow />
          <CenteredLayoutRow />
          <ShowNavLabelsRow />
          <ShowNamesButtonsRow />
          <DefaultLayoutRow />
          <HiddenServiceStatesRow />
          <TimeZoneRow />
          <LocaleRow />
        </tbody>
      </Table>
      <div className="p-2 d-flex justify-content-end">
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={resetDefaults}
          aria-label="Reset settings to defaults"
        >
          Reset to defaults
        </Button>
      </div>
    </Card>
  )
}

export { SettingsComponent }
