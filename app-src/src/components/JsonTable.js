import { Table } from 'react-bootstrap'
import { flatten } from '../common/utils'
import { useAtomValue } from 'jotai'
import { tableSizeAtom } from '../common/store/atoms'

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
  const rows = Object.keys(flattenConfig).map((node) => (
    <tr key={node}>
      <td>{node}</td>
      <td>{flattenConfig[node]}</td>
    </tr>
  ))

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
