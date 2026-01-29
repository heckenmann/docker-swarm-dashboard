import { useAtomValue, useAtom } from 'jotai'
import {
  currentVariantAtom,
  currentVariantClassesAtom,
  nodesAtomNew,
  tableSizeAtom,
  viewAtom,
} from '../common/store/atoms'

// UI & internal imports
import { Card, Table, Badge, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { NodeName } from './names/NodeName'

/**
 * NodesComponent is a React functional component that renders a table of nodes.
 * It uses various atoms from Jotai for state management and displays node details
 * such as hostname, role, state, availability, and IP address.
 */
function NodesComponent() {
  const currentVariant = useAtomValue(currentVariantAtom)
  const currentVariantClasses = useAtomValue(currentVariantClassesAtom)
  const tableSize = useAtomValue(tableSizeAtom)
  const [view, setView] = useAtom(viewAtom)
  const trows = []

  const sortBy = view?.sortBy || null
  const sortDirection = view?.sortDirection || 'asc'

  const nodes = useAtomValue(nodesAtomNew)

  /**
   * Handle sorting when a column header is clicked
   * @param {string} column - The column name to sort by
   */
  const handleSort = (column) => {
    const newDirection =
      sortBy === column && sortDirection === 'asc' ? 'desc' : 'asc'
    setView((prev) => ({
      ...prev,
      sortBy: column,
      sortDirection: newDirection,
    }))
  }

  /**
   * Sort nodes based on current sort settings
   */
  const sortedNodes = [...nodes].sort((a, b) => {
    if (!sortBy) return 0

    let aValue, bValue
    switch (sortBy) {
      case 'Hostname':
        aValue = a['Hostname'] || ''
        bValue = b['Hostname'] || ''
        break
      case 'Role':
        aValue = a['Role'] || ''
        bValue = b['Role'] || ''
        break
      case 'State':
        aValue = a['State'] || ''
        bValue = b['State'] || ''
        break
      case 'Availability':
        aValue = a['Availability'] || ''
        bValue = b['Availability'] || ''
        break
      case 'StatusAddr':
        aValue = a['StatusAddr'] || ''
        bValue = b['StatusAddr'] || ''
        break
      default:
        return 0
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  sortedNodes.forEach((node) => {
    trows.push(
      <tr
        key={'tr' + node['ID']}
        className={node['State'] === 'ready' ? null : 'table-warning'}
      >
        <td>
          <FontAwesomeIcon icon="server" />
        </td>
        <td className="align-middle text-nowrap">
          <NodeName name={node['Hostname']} id={node.ID} />
          {node['Leader'] && (
            <OverlayTrigger
              placement="top"
              overlay={<Tooltip id={`leader-tt-${node.ID}`}>Leader</Tooltip>}
            >
              <span className="ms-1">
                <FontAwesomeIcon icon="star" />
              </span>
            </OverlayTrigger>
          )}
        </td>
        <td className="align-middle col-md-1">{node['Role']}</td>
        <td className="align-middle col-md-1">
          {(node['State'] === 'ready' && (
            <Badge bg="success" className="w-100">
              Ready
            </Badge>
          )) ||
            (node['State'] === 'down' && (
              <Badge bg="danger" className="w-100">
                Down
              </Badge>
            )) || (
              <Badge bg="warning" className="w-100">
                {node['State']}
              </Badge>
            )}
        </td>
        <td className="align-middle col-md-1">
          {(node['Availability'] === 'active' && (
            <Badge bg="success" className="w-100">
              {node['Availability']}
            </Badge>
          )) || (
            <Badge bg="warning" className="w-100">
              {node['Availability']}
            </Badge>
          )}
        </td>
        <td className="align-middle col-md-1">{node['StatusAddr']}</td>
      </tr>,
    )
  })

  /**
   * Render a sortable table header
   * @param {string} column - The column name
   * @param {string} label - The display label
   * @param {object} style - Optional style object
   * @param {string} className - Optional className
   */
  const SortableHeader = ({ column, label, style, className }) => (
    <th
      style={{ ...style, cursor: 'pointer' }}
      className={className}
      onClick={() => handleSort(column)}
    >
      {label}{' '}
      {sortBy === column && (
        <FontAwesomeIcon
          icon={sortDirection === 'asc' ? 'sort-up' : 'sort-down'}
        />
      )}
    </th>
  )

  return (
    <Card bg={currentVariant} className={currentVariantClasses}>
      <Card.Header></Card.Header>
      <Table
        variant={currentVariant}
        key="nodesTable"
        id="nodes-table"
        striped
        hover
        size={tableSize}
      >
        <thead>
          <tr>
            <th style={{ width: '25px' }}></th>
            <SortableHeader
              column="Hostname"
              label="Node"
              className="node-attribute"
            />
            <SortableHeader
              column="Role"
              label="Role"
              className="node-attribute-small"
            />
            <SortableHeader
              column="State"
              label="State"
              className="node-attribute-small"
            />
            <SortableHeader
              column="Availability"
              label="Availability"
              className="node-attribute-small"
            />
            <SortableHeader
              column="StatusAddr"
              label="IP"
              className="node-attribute-small"
            />
          </tr>
        </thead>
        <tbody>{trows}</tbody>
      </Table>
    </Card>
  )
}

export { NodesComponent }
