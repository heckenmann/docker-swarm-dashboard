import React from 'react'
import { useAtom, useAtomValue } from 'jotai'
import { timeZoneAtom } from '../../../common/store/atoms/uiAtoms'
import { dashboardSettingsAtom } from '../../../common/store/atoms/foundationAtoms'
import { FormControl, Button } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

/**
 * TimeZoneRow renders the time zone setting row.
 */
const TimeZoneRow = React.memo(function TimeZoneRow() {
  const [timeZone, setTimeZone] = useAtom(timeZoneAtom)
  const dashboardSettings = useAtomValue(dashboardSettingsAtom)

  return (
    <tr>
      <td>
        <span
          className="d-inline-flex align-items-center justify-content-center rounded bg-secondary bg-opacity-10 p-2 me-2"
          aria-hidden
        >
          <FontAwesomeIcon icon="clock" />
        </span>
      </td>
      <td>
        Time zone
        <div className="small text-muted">
          Time zone for displaying timestamps.
          <div className="small text-muted fw-bold mt-1">
            Env: DSD_TIME_ZONE
          </div>
        </div>
      </td>
      <td>
        <FormControl
          size="sm"
          aria-label="Time zone"
          placeholder="e.g. UTC, Europe/Berlin, America/New_York"
          value={timeZone}
          onChange={(event) => setTimeZone(event.target.value)}
        />
      </td>
      <td className="small text-muted">
        {String(dashboardSettings?.timeZone || '')}
      </td>
      <td>
        <Button
          variant="link"
          size="sm"
          className="p-0 text-muted"
          onClick={() => setTimeZone(dashboardSettings?.timeZone || '')}
          aria-label="Reset time zone to default"
        >
          <FontAwesomeIcon icon="undo" />
        </Button>
      </td>
    </tr>
  )
})

export default TimeZoneRow
