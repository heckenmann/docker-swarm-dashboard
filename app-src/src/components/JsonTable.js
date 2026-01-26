import { flatten } from '../common/utils'
import { useAtomValue } from 'jotai'
import { tableSizeAtom } from '../common/store/atoms'
import { Table } from 'react-bootstrap'

/**
 * Renders a table from a JSON object.
 *
 * @param {Object} props - The properties object.
 * @param {Object} props.json - The JSON object to be displayed in the table.
 * @param {string} [props.variant] - The variant of the table.
 */
export function JsonTable(props) {
  const tableSize = useAtomValue(tableSizeAtom)
  const flattenConfig = flatten(props.json)
  const rows = Object.keys(flattenConfig).map((node) => {
    const raw = flattenConfig[node]
    let display
    if (raw === null || raw === undefined) {
      display = ''
    } else if (typeof raw === 'object') {
      try {
        display = JSON.stringify(raw)
      } catch {
        display = String(raw)
      }
    } else {
      display = String(raw)
    }
    // truncate very long values for table readability
    if (display.length > 1000) display = display.slice(0, 1000) + '...'
    return (
      <tr key={node}>
        <td>{node}</td>
        <td>{display}</td>
      </tr>
    )
  })

  return (
    <Table variant={props.variant} size={tableSize}>
      <thead>
        <tr>
          <th>Key</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>{rows}</tbody>
    </Table>
  )
}
