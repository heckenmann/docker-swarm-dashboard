import { useAtomValue } from 'jotai'
import {
  currentVariantAtom,
  currentVariantClassesAtom,
  serviceDetailAtom,
  baseUrlAtom,
  viewAtom,
} from '../common/store/atoms'
import { toDefaultDateTimeString } from '../common/DefaultDateTimeFormat'
import { Card, Tabs, Tab, Table, Spinner } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { JsonTable } from './JsonTable'
import { NodeName } from './names/NodeName'
import ServiceStatusBadge from './ServiceStatusBadge'
import { SortableHeader } from './SortableHeader'
import { sortData } from '../common/sortUtils'
import { useState, useCallback, useEffect } from 'react'
import { ServiceMetricsComponent } from './ServiceMetricsComponent'

/**
 * Format bytes to human-readable format
 * @param {number} bytes - Number of bytes
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted string
 */
function formatBytes(bytes, decimals = 1) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

/**
 * Component to display the details of a service.
 * It uses various atoms to get the current state and displays the service details
 * in a card with tabs for table and JSON views.
 */
function DetailsServiceComponent() {
  const currentVariant = useAtomValue(currentVariantAtom)
  const currentVariantClasses = useAtomValue(currentVariantClassesAtom)
  const baseURL = useAtomValue(baseUrlAtom)
  const view = useAtomValue(viewAtom)

  const currentService = useAtomValue(serviceDetailAtom)

  // Local sorting state for task table
  const [sortBy, setSortBy] = useState(null)
  const [sortDirection, setSortDirection] = useState('asc')

  // State for task metrics
  const [taskMetrics, setTaskMetrics] = useState(null)
  const [metricsLoading, setMetricsLoading] = useState(false)

  // Fetch task metrics
  useEffect(() => {
    let mounted = true

    const fetchMetrics = async () => {
      if (!currentService?.service?.ID) return

      try {
        setMetricsLoading(true)
        const response = await fetch(
          `${baseURL}docker/services/${currentService.service.ID}/metrics`,
        )
        const data = await response.json()

        if (!mounted) return

        if (data.available && data.metrics && data.metrics.containers) {
          // Create a map of task metrics by taskName or taskId
          const metricsMap = {}
          data.metrics.containers.forEach((container) => {
            const key = container.taskName || container.taskId
            if (key) {
              metricsMap[key] = container
            }
          })
          setTaskMetrics(metricsMap)
        } else {
          setTaskMetrics(null)
        }
      } catch (err) {
        console.error('Failed to fetch task metrics:', err)
        setTaskMetrics(null)
      } finally {
        if (mounted) {
          setMetricsLoading(false)
        }
      }
    }

    fetchMetrics()

    return () => {
      mounted = false
    }
  }, [baseURL, currentService?.service?.ID, view?.timestamp])

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

      setSortBy(newSortBy)
      setSortDirection(newSortDirection)
    },
    [sortBy, sortDirection],
  )

  if (!currentService) return <div>Service doesn't exist</div>

  // Strictly assume server returns the concrete shape: { service, tasks }
  const serviceObj = currentService.service
  const tasksForService = currentService.tasks || []

  // Defensive sanitizer: ensure fields that are used as element attributes
  // (for example `src` or `image`) are primitive strings/numbers so React
  // doesn't warn about non-primitive attribute values. We create a shallow
  // copy with coerced values for keys that may map to element attrs.
  const sanitizeAttrs = (obj) => {
    if (!obj || typeof obj !== 'object') return obj
    const copy = Array.isArray(obj)
      ? obj.map((v) => sanitizeAttrs(v))
      : { ...obj }
    Object.keys(copy).forEach((k) => {
      const v = copy[k]
      const lk = String(k).toLowerCase()
      if (lk === 'src' || lk === 'image' || lk === 'logo') {
        if (v === null || v === undefined) copy[k] = ''
        else if (typeof v === 'object') {
          try {
            copy[k] = JSON.stringify(v)
          } catch {
            copy[k] = String(v)
          }
        } else {
          copy[k] = String(v)
        }
      } else if (typeof v === 'object') {
        copy[k] = sanitizeAttrs(v)
      }
    })
    return copy
  }

  const sanitizedService = sanitizeAttrs(serviceObj || {})

  // Prepare tasks with sortable fields
  const tasksWithSortableFields = tasksForService.map((task) => {
    const metrics = getTaskMetrics(task)
    return {
      ...task,
      NodeName:
        task.Node && (task.Node.Description?.Hostname || task.Node.Hostname)
          ? task.Node.Description?.Hostname || task.Node.Hostname
          : task.NodeName || '',
      State: task.Status?.State || task.State || '',
      CreatedAt: task.CreatedAt || task.Timestamp || '',
      UpdatedAt: task.UpdatedAt || task.CreatedAt || task.Timestamp || '',
      // Add metric fields for sorting
      MemoryUsage: metrics?.usage || 0,
      MemoryLimit: metrics?.limit || 0,
      MemoryUsagePercent: metrics?.usagePercent || 0,
      WorkingSet: metrics?.workingSet || 0,
      CPUUsage: metrics?.cpuUsage || 0,
    }
  })

  // Define column types for proper sorting
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

  // Sort the tasks
  const sortedTasks = sortData(
    tasksWithSortableFields,
    sortBy,
    sortDirection,
    columnTypes,
  )

  // Helper function to get task metrics
  const getTaskMetrics = (task) => {
    if (!taskMetrics) return null
    // Try to match by task name first (from Spec.Name or derived name)
    const taskName = task.Spec?.Name || task.Name
    if (taskName && taskMetrics[taskName]) {
      return taskMetrics[taskName]
    }
    // Fall back to task ID
    if (task.ID && taskMetrics[task.ID]) {
      return taskMetrics[task.ID]
    }
    return null
  }

  return (
    <Card className={currentVariantClasses}>
      <Card.Header>
        <h5>
          <FontAwesomeIcon icon="folder" /> Service &quot;
          {serviceObj?.Spec?.Name || serviceObj?.Name || 'unknown'}&quot;
        </h5>
      </Card.Header>
      <Card.Body style={{ overflowY: 'auto' }}>
        <Tabs className="mb-3" defaultActiveKey="metrics">
          <Tab eventKey="metrics" title="Metrics">
            <ServiceMetricsComponent serviceId={serviceObj?.ID} />
          </Tab>
          <Tab eventKey="tasks" title="Tasks">
            <Table striped bordered hover size="sm" variant={currentVariant}>
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
                </tr>
              </thead>
              <tbody>
                {metricsLoading && (
                  <tr>
                    <td colSpan="10" className="text-center">
                      <Spinner animation="border" size="sm" /> Loading metrics...
                    </td>
                  </tr>
                )}
                {!metricsLoading &&
                  sortedTasks &&
                  sortedTasks.map((task, idx) => {
                    const metrics = getTaskMetrics(task)
                    return (
                      <tr
                        key={
                          (task && task.ID
                            ? String(task.ID)
                            : `task-idx-${idx}`) + `-${idx}`
                        }
                      >
                        <td>
                          <NodeName
                            name={task.NodeName}
                            id={
                              task.Node && task.Node.ID
                                ? task.Node.ID
                                : task.NodeID
                            }
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
                      </tr>
                    )
                  })}
              </tbody>
            </Table>
          </Tab>
          <Tab eventKey="table" title="Table">
            <JsonTable json={sanitizedService} variant={currentVariant} />
          </Tab>
          <Tab eventKey="json" title="JSON">
            <pre
              style={{
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
                fontSize: 12,
              }}
            >
              <code>{JSON.stringify(sanitizedService, null, '\t')}</code>
            </pre>
          </Tab>
        </Tabs>
      </Card.Body>
    </Card>
  )
}

export { DetailsServiceComponent }
