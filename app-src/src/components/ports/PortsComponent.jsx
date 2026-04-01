import React from 'react'
import { useAtomValue, useAtom } from 'jotai'
import { Table } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useCallback } from 'react'
import { currentVariantAtom } from '../../common/store/atoms/themeAtoms'
import { portsAtom } from '../../common/store/atoms/dashboardAtoms'
import {
  serviceNameFilterAtom,
  stackNameFilterAtom,
  tableSizeAtom,
} from '../../common/store/atoms/uiAtoms'
import { viewAtom } from '../../common/store/atoms/navigationAtoms'

// UI & internal imports
import ServiceName from '../shared/names/ServiceName'
import StackName from '../shared/names/StackName'
import FilterComponent from '../shared/FilterComponent'
import SortableHeader from '../shared/SortableHeader.jsx'
import { sortData } from '../../common/sortUtils'
import DSDCard from '../common/DSDCard.jsx'

/**
 * PortsComponent is a React functional component that renders a table of port mappings.
 * It uses various atoms from Jotai for state management and filtering.
 */
const PortsComponent = React.memo(function PortsComponent() {
  const currentVariant = useAtomValue(currentVariantAtom)
  const tableSize = useAtomValue(tableSizeAtom)
  const serviceNameFilter = useAtomValue(serviceNameFilterAtom)
  const stackNameFilter = useAtomValue(stackNameFilterAtom)
  const [view, setView] = useAtom(viewAtom)

  // Use unified sort state (shared across all views)
  const sortBy = view?.sortBy || null
  const sortDirection = view?.sortDirection || 'asc'

  const portsRaw = useAtomValue(portsAtom)
  const ports = portsRaw || []

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

  const filteredPorts = ports
    .filter((p) =>
      serviceNameFilter ? p.ServiceName.includes(serviceNameFilter) : true,
    )
    .filter((p) => (stackNameFilter ? p.Stack.includes(stackNameFilter) : true))

  // Define column types for proper sorting
  const columnTypes = {
    PublishedPort: 'number',
    TargetPort: 'number',
    Protocol: 'string',
    PublishMode: 'string',
    ServiceName: 'string',
    Stack: 'string',
  }

  const sortedPorts = sortData(
    filteredPorts,
    sortBy,
    sortDirection,
    columnTypes,
  )

  const renderedServices = sortedPorts.map((p) => {
    return (
      <tr key={p.PublishedPort}>
        <td>
          <FontAwesomeIcon icon="building" />
        </td>
        <td>{p.PublishedPort}</td>
        <td>
          <FontAwesomeIcon icon="arrow-right" />
        </td>
        <td>{p.TargetPort}</td>
        <td>{p.Protocol}</td>
        <td>{p.PublishMode}</td>
        <td>
          <ServiceName name={p.ServiceName} id={p.ServiceID} />
        </td>
        <td>
          <StackName name={p.Stack} />
        </td>
      </tr>
    )
  })

  return (
    <DSDCard icon="building" title="Ports" headerActions={<FilterComponent />}>
      <Table
        id="portsTable"
        className="ports-table mt-2"
        variant={currentVariant}
        striped
        size={tableSize}
      >
        <thead>
          <tr>
            <th style={{ width: '25px' }} />
            <SortableHeader
              column="PublishedPort"
              label="PublishedPort"
              sortBy={sortBy}
              sortDirection={sortDirection}
              onSort={handleSort}
              className="published-port"
            />
            <th className="arrow" />
            <SortableHeader
              column="TargetPort"
              label="TargetPort"
              sortBy={sortBy}
              sortDirection={sortDirection}
              onSort={handleSort}
              className="target-port"
            />
            <SortableHeader
              column="Protocol"
              label="Protocol"
              sortBy={sortBy}
              sortDirection={sortDirection}
              onSort={handleSort}
              className="protocol"
            />
            <SortableHeader
              column="PublishMode"
              label="PublishMode"
              sortBy={sortBy}
              sortDirection={sortDirection}
              onSort={handleSort}
              className="publish-mode"
            />
            <SortableHeader
              column="ServiceName"
              label="ServiceName"
              sortBy={sortBy}
              sortDirection={sortDirection}
              onSort={handleSort}
              className="service-name"
            />
            <SortableHeader
              column="Stack"
              label="Stack"
              sortBy={sortBy}
              sortDirection={sortDirection}
              onSort={handleSort}
              className="stack"
            />
          </tr>
        </thead>
        <tbody>{renderedServices}</tbody>
      </Table>
    </DSDCard>
  )
})

export default PortsComponent
