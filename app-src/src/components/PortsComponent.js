import { useAtomValue, useAtom } from 'jotai'
import {
  currentVariantAtom,
  currentVariantClassesAtom,
  portsAtom,
  serviceNameFilterAtom,
  stackNameFilterAtom,
  tableSizeAtom,
  viewAtom,
} from '../common/store/atoms'

// UI & internal imports
import { Card, Table } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { ServiceName } from './names/ServiceName'
import { StackName } from './names/StackName'
import { FilterComponent } from './FilterComponent'
import { SortableHeader } from './SortableHeader'
import { sortData } from '../common/sortUtils'
import { useCallback } from 'react'

/**
 * PortsComponent is a React functional component that renders a table of port mappings.
 * It uses various atoms from Jotai for state management and filtering.
 */
function PortsComponent() {
  const currentVariant = useAtomValue(currentVariantAtom)
  const currentVariantClasses = useAtomValue(currentVariantClassesAtom)
  const tableSize = useAtomValue(tableSizeAtom)
  const serviceNameFilter = useAtomValue(serviceNameFilterAtom)
  const stackNameFilter = useAtomValue(stackNameFilterAtom)
  const [view, setView] = useAtom(viewAtom)

  // Use unified sort state (shared across all views)
  const sortBy = view?.sortBy || null
  const sortDirection = view?.sortDirection || 'asc'

  const ports = useAtomValue(portsAtom)

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
    <Card bg={currentVariant} className={currentVariantClasses}>
      <Card.Header>
        <div className="d-flex justify-content-between align-items-center">
          <FilterComponent />
          {sortBy && (
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={handleResetSort}
              title="Reset sorting"
            >
              <FontAwesomeIcon icon="undo" /> Reset Sort
            </Button>
          )}
        </div>
      </Card.Header>
      <Table
        id="portsTable"
        className="ports-table mt-2"
        variant={currentVariant}
        striped
        size={tableSize}
      >
        <thead>
          <tr>
            <th style={{ width: '25px' }}></th>
            <SortableHeader
              column="PublishedPort"
              label="PublishedPort"
              sortBy={sortBy}
              sortDirection={sortDirection}
              onSort={handleSort}
              className="published-port"
            />
            <th className="arrow"></th>
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
    </Card>
  )
}

export { PortsComponent }
