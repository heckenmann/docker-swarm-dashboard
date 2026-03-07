import { useAtomValue, useAtom } from 'jotai'
import { currentVariantAtom, tableSizeAtom } from '../../common/store/atoms'
import { toDefaultDateTimeString } from '../../common/DefaultDateTimeFormat'
import { Table, Spinner, Button } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { NodeName } from '../names/NodeName'
import ServiceStatusBadge from '../ServiceStatusBadge'
import { SortableHeader } from '../SortableHeader'
import { sortData } from '../../common/sortUtils'
import { useState, useCallback } from 'react'
import { viewAtom } from '../../common/store/atoms'
import { tasksDetailId } from '../../common/navigationConstants'
import { formatBytesCompact as formatBytes } from '../../common/formatUtils'

/**
 * Returns metrics for a given task from the metrics map.
 * Matches by Spec.Name/Name first, then falls back to task ID.
 * @param {object} task - Task object
 * @param {object|null} taskMetrics - Map of task key → metrics
 * @returns {object|null}
 */
function getTaskMetrics(task, taskMetrics) {
  if (!taskMetrics) return null
  const taskName = task.Spec?.Name || task.Name
  if (taskName && taskMetrics[taskName]) return taskMetrics[taskName]
  if (task.ID && taskMetrics[task.ID]) return taskMetrics[task.ID]
  return null
}

/**
 * Tasks table for a service detail view.
 * Shows per-task state, memory and CPU metrics and a link to the task detail.
 * @param {object} props
 * @param {Array} props.tasksForService - Raw task objects for this service
 * @param {object|null} props.taskMetrics - Map of task key → metrics (null while loading)
 * @param {boolean} props.metricsLoading - Whether the metrics fetch is in progress
 */
function ServiceTasksTab({ tasksForService, taskMetrics, metricsLoading }) {
  const currentVariant = useAtomValue(currentVariantAtom)
  const tableSize = useAtomValue(tableSizeAtom)
  const [, setView] = useAtom(viewAtom)

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

  const tasksWithSortableFields = tasksForService.map((task) => {
    const metrics = getTaskMetrics(task, taskMetrics)
    return {
      ...task,
      NodeName:
        task.Node && (task.Node.Description?.Hostname || task.Node.Hostname)
          ? task.Node.Description?.Hostname || task.Node.Hostname
          : task.NodeName || '',
      State: task.Status?.State || task.State || '',
      CreatedAt: task.CreatedAt || task.Timestamp || '',
      UpdatedAt: task.UpdatedAt || task.CreatedAt || task.Timestamp || '',
      MemoryUsage: metrics?.usage || 0,
      MemoryLimit: metrics?.limit || 0,
      MemoryUsagePercent: metrics?.usagePercent || 0,
      WorkingSet: metrics?.workingSet || 0,
      CPUUsage: metrics?.cpuUsage || 0,
    }
  })

  const columnTypes = {
    NodeName: 'string',
    State: 'string',
    DesiredState: 'string',
    CreatedAt: 'date',
    UpdatedAt: 'date',
    MemoryUsage: 'number',
    MemoryLimit: 'number',
    MemoryUsagePercent: 'number',
    WorkingSet: 'number',
    CPUUsage: 'number',
  }

  const sortedTasks = sortData(
    tasksWithSortableFields,
    sortBy,
    sortDirection,
    columnTypes,
  )

  return (
    <Table striped bordered hover size={tableSize} variant={currentVariant}>
      <thead>
        <tr>
          <SortableHeader
            column="NodeName"
            label="Node"
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
            column="MemoryUsage"
            label="Usage"
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
          <SortableHeader
            column="WorkingSet"
            label="Working Set"
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
          <SortableHeader
            column="MemoryLimit"
            label="Limit"
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
          <SortableHeader
            column="MemoryUsagePercent"
            label="Usage %"
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
          <SortableHeader
            column="CPUUsage"
            label="CPU"
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
          <th>Container ID</th>
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
          <th></th>
        </tr>
      </thead>
      <tbody>
        {metricsLoading && (
          <tr>
            <td colSpan="11" className="text-center">
              <Spinner animation="border" size="sm" /> Loading metrics...
            </td>
          </tr>
        )}
        {!metricsLoading &&
          sortedTasks &&
          sortedTasks.map((task, idx) => {
            const metrics = getTaskMetrics(task, taskMetrics)
            return (
              <tr
                key={
                  (task && task.ID ? String(task.ID) : `task-idx-${idx}`) +
                  `-${idx}`
                }
              >
                <td>
                  <NodeName
                    name={task.NodeName}
                    id={task.Node && task.Node.ID ? task.Node.ID : task.NodeID}
                  />
                </td>
                <td>
                  <ServiceStatusBadge
                    id={task.ID}
                    serviceState={task.Status?.State || task.State}
                  />
                </td>
                <td>
                  {metrics ? (
                    <span>{formatBytes(metrics.usage)}</span>
                  ) : (
                    <span className="text-muted">-</span>
                  )}
                </td>
                <td>
                  {metrics && metrics.workingSet ? (
                    <span>{formatBytes(metrics.workingSet)}</span>
                  ) : (
                    <span className="text-muted">-</span>
                  )}
                </td>
                <td>
                  {metrics && metrics.limit > 0 ? (
                    <span>{formatBytes(metrics.limit)}</span>
                  ) : (
                    <span className="text-muted">-</span>
                  )}
                </td>
                <td
                  className={
                    metrics && metrics.usagePercent > 90
                      ? 'text-danger'
                      : metrics && metrics.usagePercent > 75
                        ? 'text-warning'
                        : ''
                  }
                >
                  {metrics && metrics.limit > 0 ? (
                    <span>{metrics.usagePercent.toFixed(2)}%</span>
                  ) : (
                    <span className="text-muted">-</span>
                  )}
                </td>
                <td>
                  {metrics && metrics.cpuUsage !== undefined ? (
                    <span>
                      {metrics.cpuUsage.toFixed(1)}s
                      {metrics.cpuPercent !== undefined && (
                        <small className="text-muted">
                          {' '}
                          ({metrics.cpuPercent.toFixed(0)}%)
                        </small>
                      )}
                    </span>
                  ) : (
                    <span className="text-muted">-</span>
                  )}
                </td>
                <td>
                  {metrics && metrics.containerId ? (
                    <small>
                      <code>
                        {metrics.containerId.split('/').pop().substring(0, 12)}
                      </code>
                    </small>
                  ) : (
                    <span className="text-muted">-</span>
                  )}
                </td>
                <td>{toDefaultDateTimeString(task.CreatedAt)}</td>
                <td>{toDefaultDateTimeString(task.UpdatedAt)}</td>
                <td>
                  <Button
                    size="sm"
                    variant="outline-primary"
                    onClick={() =>
                      setView({
                        id: tasksDetailId,
                        detail: task.ID,
                        timestamp: Date.now(),
                      })
                    }
                  >
                    <FontAwesomeIcon icon="info-circle" className="me-1" />
                    Details
                  </Button>
                </td>
              </tr>
            )
          })}
      </tbody>
    </Table>
  )
}

export { ServiceTasksTab, getTaskMetrics }
