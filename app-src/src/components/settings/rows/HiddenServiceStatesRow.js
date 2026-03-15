import { useAtom, useAtomValue } from 'jotai'
import {
  hiddenServiceStatesAtom,
  dashboardSettingsAtom,
} from '../../../common/store/atoms'
import { Dropdown, FormControl, Badge, Button } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

/**
 * HiddenServiceStatesRow renders the hidden service states setting row.
 */
function HiddenServiceStatesRow() {
  const [hiddenServiceStates, setHiddenServiceStates] = useAtom(
    hiddenServiceStatesAtom,
  )
  const dashboardSettings = useAtomValue(dashboardSettingsAtom)

  return (
    <tr>
      <td>
        <span
          className="d-inline-flex align-items-center justify-content-center rounded bg-secondary bg-opacity-10 p-2 me-2"
          aria-hidden
        >
          <FontAwesomeIcon icon="eye-slash" />
        </span>
      </td>
      <td>
        Hidden service states
        <div className="small text-muted">
          Select service states to hide from the dashboard.
          <div className="small text-muted fw-bold mt-1">
            Env: DSD_HIDE_SERVICE_STATES
          </div>
        </div>
      </td>
      <td>
        <div className="d-flex flex-wrap gap-2 align-items-center">
          <Dropdown>
            <Dropdown.Toggle
              variant="outline-secondary"
              size="sm"
              id="hidden-states-dropdown"
            >
              <FontAwesomeIcon icon="plus" className="me-1" />
              Add state
            </Dropdown.Toggle>
            <Dropdown.Menu>
              {[
                'new',
                'pending',
                'allocated',
                'assigned',
                'accepted',
                'preparing',
                'ready',
                'starting',
                'running',
                'complete',
                'shutdown',
                'failed',
                'rejected',
                'orphaned',
                'remove',
              ].map((state) => (
                <Dropdown.Item
                  key={state}
                  onClick={() => {
                    if (!hiddenServiceStates.includes(state)) {
                      setHiddenServiceStates([...hiddenServiceStates, state])
                    }
                  }}
                >
                  {state}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
          <FormControl
            size="sm"
            aria-label="Add custom state"
            placeholder="Add custom state..."
            onKeyDown={(event) => {
              if (event.key === 'Enter' && event.target.value.trim()) {
                const state = event.target.value.trim().toLowerCase()
                if (state && !hiddenServiceStates.includes(state)) {
                  setHiddenServiceStates([...hiddenServiceStates, state])
                }
                event.target.value = ''
              }
            }}
          />
        </div>
        <div className="d-flex flex-wrap gap-1 mt-2">
          {(hiddenServiceStates || []).map((state) => (
            <Badge
              key={state}
              bg="secondary"
              pill
              className="d-flex align-items-center gap-1"
              aria-label={`Hidden state: ${state}`}
            >
              {state}
              <Button
                variant="link"
                size="sm"
                className="text-white text-decoration-none p-0"
                onClick={() =>
                  setHiddenServiceStates(
                    hiddenServiceStates.filter((s) => s !== state),
                  )
                }
                aria-label={`Remove ${state}`}
              >
                <FontAwesomeIcon icon="times" />
              </Button>
            </Badge>
          ))}
        </div>
      </td>
      <td className="small text-muted">
        {String(dashboardSettings?.hiddenServiceStates?.join(', ') || '')}
      </td>
      <td>
        <Button
          variant="link"
          size="sm"
          className="p-0 text-muted"
          onClick={() =>
            setHiddenServiceStates(dashboardSettings?.hiddenServiceStates || [])
          }
          aria-label="Reset hidden service states to default"
        >
          <FontAwesomeIcon icon="undo" />
        </Button>
      </td>
    </tr>
  )
}

export { HiddenServiceStatesRow }
