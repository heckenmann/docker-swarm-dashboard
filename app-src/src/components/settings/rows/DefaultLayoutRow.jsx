import React from 'react'
import { useAtom, useAtomValue } from 'jotai'
import { ButtonGroup, Button } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { defaultLayoutAtom } from '../../../common/store/atoms/uiAtoms'
import { dashboardSettingsAtom } from '../../../common/store/atoms/foundationAtoms'

/**
 * DefaultLayoutRow renders the default layout setting row.
 */
const DefaultLayoutRow = React.memo(function DefaultLayoutRow() {
  const [defaultLayout, setDefaultLayout] = useAtom(defaultLayoutAtom)
  const dashboardSettings = useAtomValue(dashboardSettingsAtom)

  return (
    <tr>
      <td>
        <span
          className="d-inline-flex align-items-center justify-content-center rounded bg-secondary bg-opacity-10 p-2 me-2"
          aria-hidden
        >
          <FontAwesomeIcon icon="columns" />
        </span>
      </td>
      <td>
        Default layout
        <div className="small text-muted">
          Default dashboard view layout.
          <div className="small text-muted fw-bold mt-1">
            Env: DSD_DASHBOARD_LAYOUT
          </div>
        </div>
      </td>
      <td>
        <ButtonGroup size="sm" aria-label="Toggle default dashboard layout">
          <Button
            variant={
              defaultLayout === 'row' ? 'secondary' : 'outline-secondary'
            }
            onClick={() => setDefaultLayout('row')}
            active={defaultLayout === 'row'}
          >
            <FontAwesomeIcon icon="grip" className="me-1" />
            Horizontal Dashboard
          </Button>
          <Button
            variant={
              defaultLayout === 'column' ? 'secondary' : 'outline-secondary'
            }
            onClick={() => setDefaultLayout('column')}
            active={defaultLayout === 'column'}
          >
            <FontAwesomeIcon icon="grip-vertical" className="me-1" />
            Vertical Dashboard
          </Button>
        </ButtonGroup>
      </td>
      <td className="small text-muted">
        {String(dashboardSettings?.defaultLayout ?? '')}
      </td>
      <td>
        <Button
          variant="link"
          size="sm"
          className="p-0 text-muted"
          onClick={() =>
            setDefaultLayout(dashboardSettings?.defaultLayout ?? 'row')
          }
          aria-label="Reset default layout to default"
        >
          <FontAwesomeIcon icon="undo" />
        </Button>
      </td>
    </tr>
  )
})

export default DefaultLayoutRow
