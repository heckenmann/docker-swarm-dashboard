import { useAtomValue, useAtom } from 'jotai'
import { toDefaultDateTimeString } from '../common/DefaultDateTimeFormat'
import {
  currentVariantAtom,
  currentVariantClassesAtom,
  tasksAtomNew,
  tableSizeAtom,
  dashboardSettingsAtom,
  serviceNameFilterAtom,
  stackNameFilterAtom,
  viewAtom,
} from '../common/store/atoms'

// Add missing UI and internal component imports
import { Card, Table } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import ServiceStatusBadge from './ServiceStatusBadge'
import { ServiceName } from './names/ServiceName'
import { StackName } from './names/StackName'
import { NodeName } from './names/NodeName'
import { FilterComponent } from './FilterComponent'

/**
 * TasksComponent is a React functional component that displays a list of tasks
 * in a table format.
 */
function TasksComponent() {
  const currentVariant = useAtomValue(currentVariantAtom)
  const currentVariantClasses = useAtomValue(currentVariantClassesAtom)
  const tableSize = useAtomValue(tableSizeAtom)
  const dashBoardSettings = useAtomValue(dashboardSettingsAtom)
  const serviceNameFilter = useAtomValue(serviceNameFilterAtom)
  const stackNameFilter = useAtomValue(stackNameFilterAtom)
  const [view, setView] = useAtom(viewAtom)

  const sortBy = view?.sortBy || null
  const sortDirection = view?.sortDirection || 'asc'

  const tasks = useAtomValue(tasksAtomNew)

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

  const filteredTasks = tasks
    .filter((task) =>
      serviceNameFilter ? task.ServiceName.includes(serviceNameFilter) : true,
    )
    .filter((task) =>
      stackNameFilter ? task.Stack.includes(stackNameFilter) : true,
    )

  /**
   * Sort tasks based on current sort settings
   */
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (!sortBy) return 0

    let aValue, bValue
    switch (sortBy) {
      case 'Timestamp':
        aValue = new Date(a['Timestamp']).getTime()
        bValue = new Date(b['Timestamp']).getTime()
        break
      case 'State':
        aValue = a['State'] || ''
        bValue = b['State'] || ''
        break
      case 'DesiredState':
        aValue = a['DesiredState'] || ''
        bValue = b['DesiredState'] || ''
        break
      case 'ServiceName':
        aValue = a['ServiceName'] || ''
        bValue = b['ServiceName'] || ''
        break
      case 'Slot':
        aValue = a['Slot'] || 0
        bValue = b['Slot'] || 0
        break
      case 'Stack':
        aValue = a['Stack'] || ''
        bValue = b['Stack'] || ''
        break
      case 'NodeName':
        aValue = a['NodeName'] || ''
        bValue = b['NodeName'] || ''
        break
      case 'Err':
        aValue = a['Err'] || ''
        bValue = b['Err'] || ''
        break
      default:
        return 0
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  const rows = sortedTasks.map((task, id) => (
    <tr
      key={
        'tasksTable-' +
        (task && task.ID ? String(task.ID) + `-${id}` : `index-${id}`)
      }
      className={task['State'] === 'failed' ? 'table-danger' : null}
    >
      <td>
        <FontAwesomeIcon icon="tasks" />
      </td>
      <td>
        {toDefaultDateTimeString(
          new Date(task['Timestamp']),
          dashBoardSettings.locale,
          dashBoardSettings.timeZone,
        )}
      </td>
      <td>
        <ServiceStatusBadge
          id={id}
          serviceState={task['State']}
          createdAt={task['Timestamp']}
        />
      </td>
      <td>{task['DesiredState']}</td>
      <td>
        <ServiceName name={task.ServiceName} id={task.ServiceID} />
      </td>
      <td>{task.Slot}</td>
      <td>
        <StackName name={task.Stack} />
      </td>
      <td>
        <NodeName name={task.NodeName} id={task.NodeID} />
      </td>
      <td>{task.Err}</td>
    </tr>
  ))

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
        className="tasks-table mt-2"
        variant={currentVariant}
        striped
        size={tableSize}
      >
        <thead>
          <tr>
            <th style={{ width: '25px' }}></th>
            <SortableHeader
              column="Timestamp"
              label="Timestamp"
              className="timestamp-col"
            />
            <SortableHeader
              column="State"
              label="State"
              className="state-col"
            />
            <SortableHeader
              column="DesiredState"
              label="DesiredState"
              className="desired-state-col"
            />
            <SortableHeader
              column="ServiceName"
              label="ServiceName"
              className="service-col"
            />
            <SortableHeader column="Slot" label="Slot" className="slot-col" />
            <SortableHeader
              column="Stack"
              label="Stack"
              className="stack-col"
            />
            <SortableHeader
              column="NodeName"
              label="Node"
              className="node-col"
            />
            <SortableHeader column="Err" label="Error" />
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </Table>
    </Card>
  )
}

export { TasksComponent }
