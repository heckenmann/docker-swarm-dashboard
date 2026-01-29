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
import { SortableHeader } from './SortableHeader'
import { sortData } from '../common/sortUtils'
import { useCallback } from 'react'

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

  // Use unified sort state (shared across all views)
  const sortBy = view?.sortBy || null
  const sortDirection = view?.sortDirection || 'asc'

  const nodes = useAtomValue(nodesAtomNew)

  /**
   * Handle sorting when a column header is clicked
   * Implements 3-click cycle: asc -> desc -> reset (null)
   * @param {string} column - The column name to sort by
   */
  const handleSort = useCallback(
    (column) => {
      let newSortBy = column
      let newSortDirection = 'asc'

      if (sortBy === column) {
        // Same column clicked
        if (sortDirection === 'asc') {
          // First click was asc, now go to desc
          newSortDirection = 'desc'
        } else {
          // Second click was desc, now reset (clear sort)
          newSortBy = null
          newSortDirection = 'asc'
        }
      }
      // else: Different column clicked, start with asc

      setView((prev) => ({
        ...prev,
        sortBy: newSortBy,
        sortDirection: newSortDirection,
      }))
    },
    [sortBy, sortDirection, setView],
  )

  // Define column types for proper sorting
  const columnTypes = {
    Hostname: 'string',
    Role: 'string',
    State: 'string',
    Availability: 'string',
    StatusAddr: 'string',
  }

  const sortedNodes = sortData(nodes, sortBy, sortDirection, columnTypes)

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
              sortBy={sortBy}
              sortDirection={sortDirection}
              onSort={handleSort}
              className="node-attribute"
            />
            <SortableHeader
              column="Role"
              label="Role"
              sortBy={sortBy}
              sortDirection={sortDirection}
              onSort={handleSort}
              className="node-attribute-small"
            />
            <SortableHeader
              column="State"
              label="State"
              sortBy={sortBy}
              sortDirection={sortDirection}
              onSort={handleSort}
              className="node-attribute-small"
            />
            <SortableHeader
              column="Availability"
              label="Availability"
              sortBy={sortBy}
              sortDirection={sortDirection}
              onSort={handleSort}
              className="node-attribute-small"
            />
            <SortableHeader
              column="StatusAddr"
              label="IP"
              sortBy={sortBy}
              sortDirection={sortDirection}
              onSort={handleSort}
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
