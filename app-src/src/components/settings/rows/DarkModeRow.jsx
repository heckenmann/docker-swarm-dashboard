import React from 'react'
import { useAtom, useAtomValue } from 'jotai'
import { FormCheck, Button } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { isDarkModeAtom } from '../../../common/store/atoms/themeAtoms'
import { dashboardSettingsAtom } from '../../../common/store/atoms/foundationAtoms'

/**
 * DarkModeRow renders the dark mode setting row.
 */
const DarkModeRow = React.memo(function DarkModeRow() {
  const [isDarkMode, setIsDarkMode] = useAtom(isDarkModeAtom)
  const dashboardSettings = useAtomValue(dashboardSettingsAtom)

  return (
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
          <div className="small text-muted fw-bold mt-1">
            Env: DSD_DARK_MODE
          </div>
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
      <td className="small text-muted">
        {String(dashboardSettings?.isDarkMode ?? '')}
      </td>
      <td>
        <Button
          variant="link"
          size="sm"
          className="p-0 text-muted"
          onClick={() => setIsDarkMode(dashboardSettings?.isDarkMode ?? false)}
          aria-label="Reset dark mode to default"
        >
          <FontAwesomeIcon icon="undo" />
        </Button>
      </td>
    </tr>
  )
})

export default DarkModeRow
