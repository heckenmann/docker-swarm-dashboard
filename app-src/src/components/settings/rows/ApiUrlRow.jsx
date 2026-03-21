import { useAtom, useAtomValue } from 'jotai'
import {
  baseUrlAtom,
  baseUrlDefaultAtom,
  dashboardSettingsAtom,
} from '../../../common/store/atoms'
import { FormControl } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

/**
 * ApiUrlRow renders the API URL setting row.
 */
function ApiUrlRow() {
  const [baseUrl, setBaseUrl] = useAtom(baseUrlAtom)
  const dashboardSettings = useAtomValue(dashboardSettingsAtom)
  const baseUrlDefault = useAtomValue(baseUrlDefaultAtom)

  return (
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
          Base URL for API requests. Trailing slash is added automatically.
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
          disabled
        />
      </td>
      <td className="small text-muted">
        {String(dashboardSettings?.baseUrl ?? baseUrlDefault)}
      </td>
      <td></td>
    </tr>
  )
}

export { ApiUrlRow }
