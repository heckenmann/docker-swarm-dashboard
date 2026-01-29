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

  const sortBy = view?.sortBy || null
  const sortDirection = view?.sortDirection || 'asc'

  const ports = useAtomValue(portsAtom)

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

  const filteredPorts = ports
    .filter((p) =>
      serviceNameFilter ? p.ServiceName.includes(serviceNameFilter) : true,
    )
    .filter((p) => (stackNameFilter ? p.Stack.includes(stackNameFilter) : true))

  /**
   * Sort ports based on current sort settings
   */
  const sortedPorts = [...filteredPorts].sort((a, b) => {
    if (!sortBy) return 0

    let aValue, bValue
    switch (sortBy) {
      case 'PublishedPort':
        aValue = a['PublishedPort'] || 0
        bValue = b['PublishedPort'] || 0
        break
      case 'TargetPort':
        aValue = a['TargetPort'] || 0
        bValue = b['TargetPort'] || 0
        break
      case 'Protocol':
        aValue = a['Protocol'] || ''
        bValue = b['Protocol'] || ''
        break
      case 'PublishMode':
        aValue = a['PublishMode'] || ''
        bValue = b['PublishMode'] || ''
        break
      case 'ServiceName':
        aValue = a['ServiceName'] || ''
        bValue = b['ServiceName'] || ''
        break
      case 'Stack':
        aValue = a['Stack'] || ''
        bValue = b['Stack'] || ''
        break
      default:
        return 0
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

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

  /**
   * Render a sortable table header
   * @param {string} column - The column name
   * @param {string} label - The display label
   * @param {string} className - Optional className
   */
  const SortableHeader = ({ column, label, className }) => (
    <th
      style={{ cursor: 'pointer' }}
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
      <Card.Header>
        <FilterComponent />
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
              className="published-port"
            />
            <th className="arrow"></th>
            <SortableHeader
              column="TargetPort"
              label="TargetPort"
              className="target-port"
            />
            <SortableHeader
              column="Protocol"
              label="Protocol"
              className="protocol"
            />
            <SortableHeader
              column="PublishMode"
              label="PublishMode"
              className="publish-mode"
            />
            <SortableHeader
              column="ServiceName"
              label="ServiceName"
              className="service-name"
            />
            <SortableHeader column="Stack" label="Stack" className="stack" />
          </tr>
        </thead>
        <tbody>{renderedServices}</tbody>
      </Table>
    </Card>
  )
}

export { PortsComponent }
