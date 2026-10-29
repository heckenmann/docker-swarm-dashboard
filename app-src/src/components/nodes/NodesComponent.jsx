import React from 'react'
import { useAtomValue, useAtom } from 'jotai'
import { Table, Badge, OverlayTrigger, Tooltip, Alert } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useCallback } from 'react'
import { currentVariantAtom } from '../../common/store/atoms/themeAtoms'
import { nodesAtomNew } from '../../common/store/atoms/dashboardAtoms'
import { tableSizeAtom } from '../../common/store/atoms/uiAtoms'
import { viewAtom } from '../../common/store/atoms/navigationAtoms'

// UI & internal imports
import NodeName from '../shared/names/NodeName'
import SortableHeader from '../shared/SortableHeader.jsx'
import { sortData } from '../../common/sortUtils'
import DSDCard from '../common/DSDCard.jsx'
import ClusterMetricsHeader from './ClusterMetricsHeader'
import NodeResourceBar from './NodeResourceBar'
import ClusterHealthSummary from './ClusterHealthSummary'
import { loadable } from '../../common/store/loadable'

const nodesLoadable = loadable(nodesAtomNew)

/**
 * NodesComponent is a React functional component that renders a table of nodes.
 * It uses various atoms from Jotai for state management and displays node details
 * such as hostname, role, state, availability, and IP address.
 */
const NodesComponent = React.memo(function NodesComponent() {
  const currentVariant = useAtomValue(currentVariantAtom)
  const tableSize = useAtomValue(tableSizeAtom)
  const [view, setView] = useAtom(viewAtom)
  const trows = []

  // Use unified sort state (shared across all views)
  const sortBy = view?.sortBy || null
  const sortDirection = view?.sortDirection || 'asc'

  const nodesResult = useAtomValue(nodesLoadable)
  const nodes = nodesResult.state === 'hasData' ? nodesResult.data || [] : []

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
    Reachability: 'string',
    EngineVersion: 'string',
    OS: 'string',
  }

  const sortedNodes = sortData(nodes, sortBy, sortDirection, columnTypes)
  const engineVersions = new Set(
    nodes.map((node) => node.EngineVersion).filter(Boolean),
  )

  sortedNodes.forEach((node) => {
    trows.push(
      <tr
        key={'tr' + node['ID']}
        className={node['State'] === 'ready' ? null : 'table-warning'}
      >
        <td className="align-middle text-nowrap ps-3">
          <div className="d-flex align-items-center flex-nowrap">
            <FontAwesomeIcon
              icon="server"
              className="text-body-secondary me-2"
            />
            <NodeName name={node['Hostname']} id={node.ID} />
            {node['Leader'] && (
              <OverlayTrigger
                placement="top"
                overlay={<Tooltip id={`leader-tt-${node.ID}`}>Leader</Tooltip>}
              >
                <span className="ms-1 flex-shrink-0">
                  <FontAwesomeIcon icon="star" />
                </span>
              </OverlayTrigger>
            )}
          </div>
        </td>
        <td className="align-middle">
          <div>{node.Role}</div>
          {node.Role === 'manager' && (
            <div
              className={`small ${node.Reachability === 'reachable' ? 'text-success-emphasis' : 'text-warning-emphasis'}`}
              title="Manager reachability"
            >
              {node.Reachability || 'unknown'}
            </div>
          )}
        </td>
        <td className="align-middle text-nowrap">
          <div>{node.EngineVersion || 'Unknown'}</div>
          <div className="small text-body-secondary">
            {[node.OS, node.Architecture].filter(Boolean).join(' / ') ||
              'Unknown'}
          </div>
        </td>
        <td className="align-middle text-nowrap">
          {(node['State'] === 'ready' && (
            <Badge bg="success" className="fw-medium">
              Ready
            </Badge>
          )) ||
            (node['State'] === 'down' && (
              <Badge bg="danger" className="fw-medium">
                Down
              </Badge>
            )) || (
              <Badge bg="warning" className="fw-medium">
                {node['State']}
              </Badge>
            )}
        </td>
        <td className="align-middle text-nowrap">
          {(node['Availability'] === 'active' && (
            <Badge bg="success" className="fw-medium">
              {node['Availability']}
            </Badge>
          )) || (
            <Badge bg="warning" className="fw-medium">
              {node['Availability']}
            </Badge>
          )}
        </td>
        <td className="align-middle text-nowrap">{node['StatusAddr']}</td>
        <td className="align-middle text-center" style={{ width: '80px' }}>
          <NodeResourceBar nodeId={node.ID} type="memory" />
        </td>
        <td className="align-middle text-center" style={{ width: '80px' }}>
          <NodeResourceBar nodeId={node.ID} type="disk" />
        </td>
      </tr>,
    )
  })

  return (
    <div className="nodes-container">
      <DSDCard
        title="Cluster Overview"
        icon="server"
        body={
          <>
            <ClusterHealthSummary />
            <ClusterMetricsHeader />
          </>
        }
      />
      {nodesResult.state === 'hasError' && (
        <Alert variant="warning">Node inventory is unavailable.</Alert>
      )}
      {nodesResult.state === 'loading' && <p role="status">Loading nodes...</p>}
      {engineVersions.size > 1 && (
        <Alert variant="info">
          Nodes advertise different Docker Engine versions. Review the inventory
          below before maintenance.
        </Alert>
      )}
      <DSDCard
        icon="server"
        title="Nodes"
        bodyClassName="p-0"
        headerActions={
          <span className="small text-body-secondary">
            {nodes.length} {nodes.length === 1 ? 'node' : 'nodes'}
          </span>
        }
        body={
          <Table
            variant={currentVariant}
            key="nodesTable"
            id="nodes-table"
            striped
            responsive
            hover
            size={tableSize}
            className="mb-0"
          >
            <thead>
              <tr>
                <SortableHeader
                  column="Hostname"
                  label="Node"
                  sortBy={sortBy}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                  className="ps-3"
                />
                <SortableHeader
                  column="Role"
                  label="Role"
                  sortBy={sortBy}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                  className="text-nowrap"
                />

                <th>Engine / Platform</th>
                <SortableHeader
                  column="State"
                  label="State"
                  sortBy={sortBy}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                  className="text-nowrap"
                />
                <SortableHeader
                  column="Availability"
                  label="Availability"
                  sortBy={sortBy}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                  className="text-nowrap"
                />
                <SortableHeader
                  column="StatusAddr"
                  label="IP"
                  sortBy={sortBy}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                  className="text-nowrap"
                />
                <th className="text-center" style={{ width: '80px' }}>
                  Memory
                </th>
                <th className="text-center" style={{ width: '80px' }}>
                  Disk
                </th>
              </tr>
            </thead>
            <tbody>{trows}</tbody>
          </Table>
        }
      />
    </div>
  )
})

export default NodesComponent
