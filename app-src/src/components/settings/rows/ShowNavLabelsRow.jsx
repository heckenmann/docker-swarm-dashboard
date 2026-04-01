import React from 'react'
import { useAtom, useAtomValue } from 'jotai'
import { FormCheck, Button } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { showNavLabelsAtom } from '../../../common/store/atoms/uiAtoms'
import { dashboardSettingsAtom } from '../../../common/store/atoms/foundationAtoms'

/**
 * ShowNavLabelsRow renders the show navigation labels setting row.
 */
const ShowNavLabelsRow = React.memo(function ShowNavLabelsRow() {
  const [showNavLabels, setShowNavLabels] = useAtom(showNavLabelsAtom)
  const dashboardSettings = useAtomValue(dashboardSettingsAtom)

  return (
    <tr>
      <td>
        <span
          className="d-inline-flex align-items-center justify-content-center rounded bg-secondary bg-opacity-10 p-2 me-2"
          aria-hidden
        >
          <FontAwesomeIcon icon="font" />
        </span>
      </td>
      <td>
        Show navigation labels
        <div className="small text-muted">
          Show text labels next to icons in the navigation bar. When disabled,
          tooltips appear on hover instead.
          <div className="small text-muted fw-bold mt-1">
            Env: DSD_SHOW_NAV_LABELS
          </div>
        </div>
      </td>
      <td>
        <FormCheck
          type="switch"
          checked={showNavLabels}
          onChange={() => setShowNavLabels(!showNavLabels)}
          aria-label="Toggle navigation labels"
        />
      </td>
      <td className="small text-muted">
        {String(dashboardSettings?.showNavLabels ?? '')}
      </td>
      <td>
        <Button
          variant="link"
          size="sm"
          className="p-0 text-muted"
          onClick={() =>
            setShowNavLabels(dashboardSettings?.showNavLabels ?? false)
          }
          aria-label="Reset show nav labels to default"
        >
          <FontAwesomeIcon icon="undo" />
        </Button>
      </td>
    </tr>
  )
})

export default ShowNavLabelsRow
