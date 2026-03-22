import { useAtom, useAtomValue } from 'jotai'
import {
  tableSizeAtom,
  dashboardSettingsAtom,
} from '../../../common/store/atoms'
import { ButtonGroup, Button } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

/**
 * TableSizeRow renders the table size setting row.
 */
function TableSizeRow() {
  const [tableSize, setTableSize] = useAtom(tableSizeAtom)
  const dashboardSettings = useAtomValue(dashboardSettingsAtom)

  return (
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
        Table size
        <div className="small text-muted">
          Set the table display size.
          <div className="small text-muted fw-bold mt-1">
            Env: DSD_TABLE_SIZE
          </div>
        </div>
      </td>
      <td>
        <ButtonGroup size="sm" aria-label="Table size">
          <Button
            variant={tableSize === 'sm' ? 'secondary' : 'outline-secondary'}
            onClick={() => setTableSize('sm')}
            active={tableSize === 'sm'}
          >
            Small (sm)
          </Button>
          <Button
            variant={tableSize === 'lg' ? 'secondary' : 'outline-secondary'}
            onClick={() => setTableSize('lg')}
            active={tableSize === 'lg'}
          >
            Large (lg)
          </Button>
        </ButtonGroup>
      </td>
      <td className="small text-muted">
        {String(dashboardSettings?.tableSize ?? '')}
      </td>
      <td>
        <Button
          variant="link"
          size="sm"
          className="p-0 text-muted"
          onClick={() => setTableSize(dashboardSettings?.tableSize ?? 'lg')}
          aria-label="Reset table size to default"
        >
          <FontAwesomeIcon icon="undo" />
        </Button>
      </td>
    </tr>
  )
}

export { TableSizeRow }
