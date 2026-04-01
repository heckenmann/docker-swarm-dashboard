import React from 'react'
import { useAtom, useAtomValue } from 'jotai'
import { FormCheck, Button } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { maxContentWidthAtom } from '../../../common/store/atoms/uiAtoms'
import { dashboardSettingsAtom } from '../../../common/store/atoms/foundationAtoms'

/**
 * CenteredLayoutRow renders the centered layout setting row.
 */
const CenteredLayoutRow = React.memo(function CenteredLayoutRow() {
  const [maxContentWidth, setMaxContentWidth] = useAtom(maxContentWidthAtom)
  const dashboardSettings = useAtomValue(dashboardSettingsAtom)

  return (
    <tr>
      <td>
        <span
          className="d-inline-flex align-items-center justify-content-center rounded bg-secondary bg-opacity-10 p-2 me-2"
          aria-hidden
        >
          <FontAwesomeIcon icon="ruler-horizontal" />
        </span>
      </td>
      <td>
        Centered layout
        <div className="small text-muted">
          Constrain and centre the content using Bootstrap&apos;s responsive
          container instead of full viewport width.
          <div className="small text-muted fw-bold mt-1">
            Env: DSD_MAX_CONTENT_WIDTH
          </div>
        </div>
      </td>
      <td>
        <FormCheck
          type="switch"
          checked={maxContentWidth === 'centered'}
          onChange={() =>
            setMaxContentWidth(
              maxContentWidth === 'centered' ? 'fluid' : 'centered',
            )
          }
          aria-label="Toggle centered content width"
        />
      </td>
      <td className="small text-muted">
        {String(dashboardSettings?.maxContentWidth ?? '')}
      </td>
      <td>
        <Button
          variant="link"
          size="sm"
          className="p-0 text-muted"
          onClick={() =>
            setMaxContentWidth(dashboardSettings?.maxContentWidth ?? 'fluid')
          }
          aria-label="Reset centered layout to default"
        >
          <FontAwesomeIcon icon="undo" />
        </Button>
      </td>
    </tr>
  )
})

export default CenteredLayoutRow
