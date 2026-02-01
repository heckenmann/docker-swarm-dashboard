import { useAtomValue } from 'jotai'
import {
  currentVariantAtom,
  currentVariantClassesAtom,
  taskDetailAtom,
  baseUrlAtom,
  viewAtom,
} from '../common/store/atoms'
import { toDefaultDateTimeString } from '../common/DefaultDateTimeFormat'
import { Card, Tabs, Tab, Table, Spinner, Alert } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { JsonTable } from './JsonTable'
import { NodeName } from './names/NodeName'
import { ServiceName } from './names/ServiceName'
import ServiceStatusBadge from './ServiceStatusBadge'
import { useState, useEffect } from 'react'

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
 * Component to display details of a task.
 * Shows task information, metrics from cAdvisor, and related data.
 */
function DetailsTaskComponent() {
  const currentVariant = useAtomValue(currentVariantAtom)
  const currentVariantClasses = useAtomValue(currentVariantClassesAtom)
  const baseURL = useAtomValue(baseUrlAtom)
  const view = useAtomValue(viewAtom)

  const currentTask = useAtomValue(taskDetailAtom)

  // State for task metrics
  const [taskMetrics, setTaskMetrics] = useState(null)
  const [metricsLoading, setMetricsLoading] = useState(false)
  const [metricsError, setMetricsError] = useState(null)

  // Fetch task metrics
  useEffect(() => {
    let mounted = true

    const fetchMetrics = async () => {
      if (!currentTask?.ID) return

      try {
        setMetricsLoading(true)
        setMetricsError(null)
        const response = await fetch(
          `${baseURL}docker/tasks/${currentTask.ID}/metrics`,
        )
        const data = await response.json()

        if (!mounted) return

        if (data.available && data.metrics) {
          setTaskMetrics(data.metrics)
        } else {
          setTaskMetrics(null)
          if (data.message) {
            setMetricsError(data.message)
          }
        }
      } catch (err) {
        console.error('Failed to fetch task metrics:', err)
        setTaskMetrics(null)
        setMetricsError('Failed to fetch metrics from cAdvisor')
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
  }, [baseURL, currentTask?.ID, view?.timestamp])

  if (!currentTask) return <div>Task doesn't exist</div>

  const taskObj = currentTask

  return (
    <div>
      <Card className={currentVariantClasses}>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <div>
            <FontAwesomeIcon icon="tasks" className="me-2" />
            <strong>Task Details</strong>
          </div>
          <ServiceStatusBadge state={taskObj.Status?.State} />
        </Card.Header>
        <Card.Body>
          <Tabs defaultActiveKey="metrics" className="mb-3">
            <Tab eventKey="metrics" title="Metrics">
              <div className="mb-3">
                <h5>Task Information</h5>
                <Table size="sm" bordered className={currentVariantClasses}>
                  <tbody>
                    <tr>
                      <td>
                        <strong>Service</strong>
                      </td>
                      <td>
                        <ServiceName serviceId={taskObj.ServiceID} />
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Node</strong>
                      </td>
                      <td>
                        <NodeName nodeId={taskObj.NodeID} />
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <strong>State</strong>
                      </td>
                      <td>
                        <ServiceStatusBadge state={taskObj.Status?.State} />
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Desired State</strong>
                      </td>
                      <td>{taskObj.DesiredState}</td>
                    </tr>
                    {taskObj.Slot && (
                      <tr>
                        <td>
                          <strong>Slot</strong>
                        </td>
                        <td>{taskObj.Slot}</td>
                      </tr>
                    )}
                    <tr>
                      <td>
                        <strong>Created</strong>
                      </td>
                      <td>{toDefaultDateTimeString(taskObj.CreatedAt)}</td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Updated</strong>
                      </td>
                      <td>{toDefaultDateTimeString(taskObj.UpdatedAt)}</td>
                    </tr>
                  </tbody>
                </Table>
              </div>

              <h5>Container Metrics</h5>
              {metricsLoading && (
                <div className="text-center my-3">
                  <Spinner animation="border" size="sm" className="me-2" />
                  Loading metrics...
                </div>
              )}

              {!metricsLoading && metricsError && (
                <Alert variant="info">
                  <FontAwesomeIcon icon="info-circle" className="me-2" />
                  {metricsError}
                </Alert>
              )}

              {!metricsLoading && !metricsError && taskMetrics && (
                <Table size="sm" bordered className={currentVariantClasses}>
                  <tbody>
                    <tr>
                      <td>
                        <strong>Container ID</strong>
                      </td>
                      <td>
                        <small>
                          <code>
                            {taskMetrics.containerId
                              .split('/')
                              .pop()
                              .substring(0, 12)}
                          </code>
                        </small>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Memory Usage</strong>
                      </td>
                      <td>{formatBytes(taskMetrics.usage)}</td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Working Set</strong>
                      </td>
                      <td>{formatBytes(taskMetrics.workingSet)}</td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Memory Limit</strong>
                      </td>
                      <td>
                        {taskMetrics.limit > 0
                          ? formatBytes(taskMetrics.limit)
                          : 'No limit'}
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Usage %</strong>
                      </td>
                      <td>
                        <span
                          className={
                            taskMetrics.usagePercent > 90
                              ? 'text-danger fw-bold'
                              : taskMetrics.usagePercent > 75
                                ? 'text-warning fw-bold'
                                : ''
                          }
                        >
                          {taskMetrics.usagePercent.toFixed(2)}%
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <strong>CPU Usage</strong>
                      </td>
                      <td>
                        {taskMetrics.cpuUsage.toFixed(2)}s
                        {taskMetrics.cpuPercent > 0 &&
                          ` (${taskMetrics.cpuPercent.toFixed(2)}%)`}
                      </td>
                    </tr>
                  </tbody>
                </Table>
              )}

              {!metricsLoading && !metricsError && !taskMetrics && (
                <Alert variant="info">
                  <FontAwesomeIcon icon="info-circle" className="me-2" />
                  Metrics not available for this task
                </Alert>
              )}
            </Tab>

            <Tab eventKey="table" title="Table">
              <JsonTable json={taskObj} />
            </Tab>

            <Tab eventKey="json" title="JSON">
              <pre>{JSON.stringify(taskObj, null, 2)}</pre>
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>
    </div>
  )
}

export { DetailsTaskComponent }
