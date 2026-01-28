import { useAtom, useAtomValue } from 'jotai'
import {
  baseUrlAtom,
  currentVariantAtom,
  currentVariantClassesAtom,
  isDarkModeAtom,
  refreshIntervalAtom,
  tableSizeAtom,
  showNamesButtonsAtom,
} from '../common/store/atoms'
import { RefreshIntervalToggleReducer } from '../common/store/reducers'
import { Card, Table, FormControl, FormCheck, Button } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

/**
 * SettingsComponent is a React functional component that renders a settings panel.
 * It allows users to configure various settings such as API URL, refresh interval,
 * dark mode, and table size.
 */
function SettingsComponent() {
  const currentVariant = useAtomValue(currentVariantAtom)
  const currentVariantClasses = useAtomValue(currentVariantClassesAtom)
  const [refreshInterval, toggleRefresh] = useAtom(
    refreshIntervalAtom,
    RefreshIntervalToggleReducer,
  )
  const [isDarkMode, setIsDarkMode] = useAtom(isDarkModeAtom)
  const [tableSize, setTableSize] = useAtom(tableSizeAtom)
  const [showNamesButtons, setShowNamesButtons] = useAtom(showNamesButtonsAtom)
  const [baseUrl, setBaseUrl] = useAtom(baseUrlAtom)

  const toggleRefreshAndNotifyUser = () => {
    toggleRefresh()
  }

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
    // match defaults defined in atoms.js
    setIsDarkMode(false)
    setTableSize('sm')
    setShowNamesButtons(true)
  }

  return (
    <Card bg={currentVariant} className={currentVariantClasses}>
      <Table
        variant={isDarkMode ? currentVariant : null}
        striped
        size={tableSize}
      >
        <thead>
          <tr>
            <th className="col-sm-1"></th>
            <th className="col-sm-5">Setting</th>
            <th>Value</th>
            <th>Default</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <span
                className="d-inline-flex align-items-center justify-content-center rounded bg-secondary bg-opacity-10 p-2 me-2"
                aria-hidden
              >
                <FontAwesomeIcon icon="link" />
              </span>
            </td>
            <td>
              API URL
              <div className="small text-muted">
                Base URL for API requests. Trailing slash is added
                automatically.
              </div>
            </td>
            <td>
              <FormControl
                size="sm"
                aria-label="API URL"
                value={baseUrl}
                onChange={(event) =>
                  setBaseUrl(
                    event.target.value.endsWith('/')
                      ? event.target.value
                      : event.target.value + '/',
                  )
                }
              />
            </td>
            <td className="small text-muted">{computeDefaultBase()}</td>
          </tr>
          <tr>
            <td>
              <span
                className="d-inline-flex align-items-center justify-content-center rounded bg-secondary bg-opacity-10 p-2 me-2"
                aria-hidden
              >
                <FontAwesomeIcon
                  icon={refreshInterval ? 'stop-circle' : 'play-circle'}
                />
              </span>
            </td>
            <td>
              Interval Refresh (3000 ms)
              <div className="small text-muted">
                Toggle automatic data refresh at a fixed interval.
              </div>
            </td>
            <td>
              <FormCheck
                type="switch"
                variant={refreshInterval ? 'secondary' : 'outline-secondary'}
                onChange={toggleRefreshAndNotifyUser}
                checked={refreshInterval}
                aria-label="Toggle auto refresh"
              />
            </td>
            <td className="small text-muted">false</td>
          </tr>
          <tr>
            <td>
              <span
                className="d-inline-flex align-items-center justify-content-center rounded bg-secondary bg-opacity-10 p-2 me-2"
                aria-hidden
              >
                <FontAwesomeIcon icon="lightbulb" />
              </span>
            </td>
            <td>
              Dark Mode
              <div className="small text-muted">
                Switch between light and dark theme.
              </div>
            </td>
            <td>
              <FormCheck
                type="switch"
                variant={isDarkMode ? 'secondary' : 'outline-secondary'}
                onChange={() => setIsDarkMode(!isDarkMode)}
                value={isDarkMode}
                checked={isDarkMode}
                aria-label="Toggle dark mode"
              />
            </td>
            <td className="small text-muted">false</td>
          </tr>
          <tr>
            <td>
              <span
                className="d-inline-flex align-items-center justify-content-center rounded bg-secondary bg-opacity-10 p-2 me-2"
                aria-hidden
              >
                <FontAwesomeIcon icon="table-cells" />
              </span>
            </td>
            <td>
              Small tables
              <div className="small text-muted">
                Make tables compact for a denser display.
              </div>
            </td>
            <td>
              <FormCheck
                type="switch"
                variant={tableSize ? 'secondary' : 'outline-secondary'}
                onChange={() => setTableSize(tableSize === 'sm' ? 'lg' : 'sm')}
                checked={tableSize === 'sm'}
                aria-label="Toggle compact tables"
              />
            </td>
            <td className="small text-muted">sm</td>
          </tr>
          <tr>
            <td>
              <span
                className="d-inline-flex align-items-center justify-content-center rounded bg-secondary bg-opacity-10 p-2 me-2"
                aria-hidden
              >
                <FontAwesomeIcon icon="list" />
              </span>
            </td>
            <td>
              Show buttons in Names
              <div className="small text-muted">
                Show action buttons next to entity names (services, stacks,
                nodes), e.g. Logs or Details.
              </div>
            </td>
            <td>
              <FormCheck
                type="switch"
                variant={showNamesButtons ? 'secondary' : 'outline-secondary'}
                onChange={() => setShowNamesButtons(!showNamesButtons)}
                checked={showNamesButtons}
                aria-label="Toggle show buttons in names"
              />
            </td>
            <td className="small text-muted">true</td>
          </tr>
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
