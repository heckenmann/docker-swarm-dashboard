import React from 'react'
import { useAtom, useAtomValue } from 'jotai'
import { showNamesButtonsAtom } from '../../../common/store/atoms/uiAtoms'
import { dashboardSettingsAtom } from '../../../common/store/atoms/foundationAtoms'
import { FormCheck, Button } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

/**
 * ShowNamesButtonsRow renders the show names buttons setting row.
 */
const ShowNamesButtonsRow = React.memo(function ShowNamesButtonsRow() {
  const [showNamesButtons, setShowNamesButtons] = useAtom(showNamesButtonsAtom)
  const dashboardSettings = useAtomValue(dashboardSettingsAtom)

  return (
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
          Show action buttons next to entity names (services, stacks, nodes),
          e.g. Logs or Details.
          <div className="small text-muted fw-bold mt-1">
            Env: DSD_SHOW_NAMES_BUTTONS
          </div>
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
      <td className="small text-muted">
        {String(dashboardSettings?.showNamesButtons ?? '')}
      </td>
      <td>
        <Button
          variant="link"
          size="sm"
          className="p-0 text-muted"
          onClick={() =>
            setShowNamesButtons(dashboardSettings?.showNamesButtons ?? true)
          }
          aria-label="Reset show names buttons to default"
        >
          <FontAwesomeIcon icon="undo" />
        </Button>
      </td>
    </tr>
  )
})

export default ShowNamesButtonsRow
