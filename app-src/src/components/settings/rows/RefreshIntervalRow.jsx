import { useAtom, useAtomValue } from 'jotai'
import {
  refreshIntervalAtom,
  dashboardSettingsAtom,
} from '../../../common/store/atoms'
import { ButtonGroup, Button } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

/**
 * RefreshIntervalRow renders the refresh interval setting row.
 */
function RefreshIntervalRow() {
  const [refreshInterval, setRefreshInterval] = useAtom(refreshIntervalAtom)
  const dashboardSettings = useAtomValue(dashboardSettingsAtom)

  const intervals = [null, 5000, 10000, 30000, 60000]

  return (
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
        Interval Refresh
        <div className="small text-muted">
          Set automatic data refresh interval.
          <div className="small text-muted fw-bold mt-1">
            Env: DSD_REFRESH_INTERVAL
          </div>
        </div>
      </td>
      <td>
        <ButtonGroup size="sm" aria-label="Set refresh interval">
          {intervals.map((interval) => (
            <Button
              key={interval}
              variant={
                refreshInterval === interval ? 'secondary' : 'outline-secondary'
              }
              onClick={() => setRefreshInterval(interval)}
              active={refreshInterval === interval}
            >
              {interval === null ? 'Off' : `${interval / 1000}s`}
            </Button>
          ))}
        </ButtonGroup>
      </td>
      <td className="small text-muted">
        {dashboardSettings?.refreshInterval === null ||
        dashboardSettings?.refreshInterval === undefined
          ? 'off'
          : String(dashboardSettings.refreshInterval)}
      </td>
      <td>
        <Button
          variant="link"
          size="sm"
          className="p-0 text-muted"
          onClick={() => {
            if (refreshInterval !== null) setRefreshInterval(null)
          }}
          aria-label="Reset refresh interval to default"
        >
          <FontAwesomeIcon icon="undo" />
        </Button>
      </td>
    </tr>
  )
}

export { RefreshIntervalRow }
