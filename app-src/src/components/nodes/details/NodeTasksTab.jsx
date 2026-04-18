import React, { useState, useCallback } from 'react'
import { useAtomValue } from 'jotai'
import { Table } from 'react-bootstrap'
import { currentVariantAtom } from '../../../common/store/atoms/themeAtoms'
import { nodeDetailAtom } from '../../../common/store/atoms/navigationAtoms'
import { tableSizeAtom } from '../../../common/store/atoms/uiAtoms'
import { toDefaultDateTimeString } from '../../../common/DefaultDateTimeFormat'
import ServiceName from '../../shared/names/ServiceName'
import ServiceStatusBadge from '../../services/ServiceStatusBadge'
import SortableHeader from '../../shared/SortableHeader.jsx'
import { sortData } from '../../../common/sortUtils'

import MetricCard from '../../shared/MetricCard.jsx'

/**
 * NodeTasksTab - Displays a sortable table of tasks running on a specific node.
 *
 * Shows task service names, current states, desired states, and timestamps.
 * Supports 3-click sorting cycle (asc → desc → reset) on all sortable columns.
 *
 * @returns {JSX.Element} The tasks table wrapped in a MetricCard
 */
const NodeTasksTab = React.memo(function NodeTasksTab() {
  const currentVariant = useAtomValue(currentVariantAtom)
  const tableSize = useAtomValue(tableSizeAtom)
  const currentNode = useAtomValue(nodeDetailAtom)

  const [sortBy, setSortBy] = useState(null)
  const [sortDirection, setSortDirection] = useState('asc')

  /**
   * 3-click sort cycle: asc → desc → reset
   * @param {string} column
   */
  const handleSort = useCallback(
    (column) => {
      let newSortBy = column
      let newSortDirection = 'asc'
      if (sortBy === column) {
        if (sortDirection === 'asc') {
          newSortDirection = 'desc'
        } else {
          newSortBy = null
          newSortDirection = 'asc'
        }
      }
      setSortBy(newSortBy)
      setSortDirection(newSortDirection)
    },
    [sortBy, sortDirection],
  )

  const taskServiceName = (task) => {
    if (!task?.Service) return null
    return (
      task.Service?.Spec?.Name || task.Service?.Spec?.Annotations?.Name || null
    )
  }

  const taskServiceId = (task) => {
    if (!task?.Service) return null
    return task.Service?.ID || null
  }

  const tasksWithSortableFields = (currentNode?.tasks || []).map((task) => ({
    ...task,
    ServiceName: taskServiceName(task) || '',
    State: task.Status?.State || task.State || '',
    CreatedAt: task.CreatedAt || task.Timestamp || '',
    UpdatedAt: task.UpdatedAt || task.CreatedAt || task.Timestamp || '',
  }))

  const columnTypes = {
    ServiceName: 'string',
    State: 'string',
    DesiredState: 'string',
    CreatedAt: 'date',
    UpdatedAt: 'date',
  }

  const sortedTasks = sortData(
    tasksWithSortableFields,
    sortBy,
    sortDirection,
    columnTypes,
  )

  return (
    <MetricCard title="Tasks on this Node" icon="tasks" noBody={true}>
      <Table
        striped
        bordered
        hover
        size={tableSize}
        variant={currentVariant}
        className="mb-0"
      >
        <thead>
          <tr>
            <SortableHeader
              column="ServiceName"
              label="Service"
              sortBy={sortBy}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
            <SortableHeader
              column="State"
              label="State"
              sortBy={sortBy}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
            <SortableHeader
              column="DesiredState"
              label="Desired State"
              sortBy={sortBy}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
            <SortableHeader
              column="CreatedAt"
              label="Created"
              sortBy={sortBy}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
            <SortableHeader
              column="UpdatedAt"
              label="Updated"
              sortBy={sortBy}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
          </tr>
        </thead>
        <tbody>
          {sortedTasks &&
            sortedTasks.map((task, idx) => (
              <tr
                key={
                  (task?.ID ? String(task.ID) : `task-idx-${idx}`) + `-${idx}`
                }
              >
                <td>
                  <ServiceName
                    name={taskServiceName(task)}
                    id={taskServiceId(task)}
                  />
                </td>
                <td>
                  <ServiceStatusBadge
                    id={task.ID}
                    serviceState={task.Status?.State || task.State}
                  />
                </td>
                <td>{task.DesiredState}</td>
                <td>{toDefaultDateTimeString(task.CreatedAt)}</td>
                <td>{toDefaultDateTimeString(task.UpdatedAt)}</td>
              </tr>
            ))}
        </tbody>
      </Table>
    </MetricCard>
  )
})

export default NodeTasksTab
