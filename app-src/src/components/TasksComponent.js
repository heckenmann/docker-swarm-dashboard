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
import { Card, Table, Button } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import ServiceStatusBadge from './ServiceStatusBadge'
import { ServiceName } from './names/ServiceName'
import { StackName } from './names/StackName'
import { NodeName } from './names/NodeName'
import { FilterComponent } from './FilterComponent'
import { SortableHeader } from './SortableHeader'
import { sortData } from '../common/sortUtils'
import { useCallback } from 'react'
import { tasksDetailId } from '../common/navigationConstants'

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

  // Use unified sort state (shared across all views)
  const sortBy = view?.sortBy || null
  const sortDirection = view?.sortDirection || 'asc'

  const tasks = useAtomValue(tasksAtomNew)

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

  const filteredTasks = tasks
    .filter((task) =>
      serviceNameFilter ? task.ServiceName.includes(serviceNameFilter) : true,
    )
    .filter((task) =>
      stackNameFilter ? task.Stack.includes(stackNameFilter) : true,
    )

  // Define column types for proper sorting
  const columnTypes = {
    Timestamp: 'date',
    State: 'string',
    DesiredState: 'string',
    ServiceName: 'string',
    Slot: 'number',
    Stack: 'string',
    NodeName: 'string',
    Err: 'string',
  }

  const sortedTasks = sortData(
    filteredTasks,
    sortBy,
    sortDirection,
    columnTypes,
  )

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
      <td>
        <Button
          size="sm"
          variant="outline-primary"
          onClick={() =>
            setView({ id: tasksDetailId, detail: task.ID, timestamp: Date.now() })
          }
        >
          <FontAwesomeIcon icon="info-circle" className="me-1" />
          Details
        </Button>
      </td>
    </tr>
  ))

  return (
    <Card border={currentVariant} className={currentVariantClasses}>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <div>
          <FontAwesomeIcon icon="tasks" className="me-2" />
          <strong>Tasks</strong>
        </div>
        <FilterComponent />
      </Card.Header>
      <Card.Body className="p-0">
        <Table
          className="tasks-table mb-0"
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
              sortBy={sortBy}
              sortDirection={sortDirection}
              onSort={handleSort}
              className="timestamp-col"
            />
            <SortableHeader
              column="State"
              label="State"
              sortBy={sortBy}
              sortDirection={sortDirection}
              onSort={handleSort}
              className="state-col"
            />
            <SortableHeader
              column="DesiredState"
              label="DesiredState"
              sortBy={sortBy}
              sortDirection={sortDirection}
              onSort={handleSort}
              className="desired-state-col"
            />
            <SortableHeader
              column="ServiceName"
              label="ServiceName"
              sortBy={sortBy}
              sortDirection={sortDirection}
              onSort={handleSort}
              className="service-col"
            />
            <SortableHeader
              column="Slot"
              label="Slot"
              sortBy={sortBy}
              sortDirection={sortDirection}
              onSort={handleSort}
              className="slot-col"
            />
            <SortableHeader
              column="Stack"
              label="Stack"
              sortBy={sortBy}
              sortDirection={sortDirection}
              onSort={handleSort}
              className="stack-col"
            />
            <SortableHeader
              column="NodeName"
              label="Node"
              sortBy={sortBy}
              sortDirection={sortDirection}
              onSort={handleSort}
              className="node-col"
            />
            <SortableHeader
              column="Err"
              label="Error"
              sortBy={sortBy}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </Table>
      </Card.Body>
    </Card>
  )
}

export { TasksComponent }
