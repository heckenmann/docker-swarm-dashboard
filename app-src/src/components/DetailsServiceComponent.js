import { useAtomValue } from 'jotai'
import {
  currentVariantAtom,
  currentVariantClassesAtom,
  serviceDetailAtom,
} from '../common/store/atoms'
import { toDefaultDateTimeString } from '../common/DefaultDateTimeFormat'
import { Card, Tabs, Tab, Table } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { JsonTable } from './JsonTable'
import { NodeName } from './names/NodeName'
import ServiceStatusBadge from './ServiceStatusBadge'
import { SortableHeader } from './SortableHeader'
import { sortData } from '../common/sortUtils'
import { useState, useCallback } from 'react'
import { ServiceMetricsComponent } from './ServiceMetricsComponent'

/**
 * Component to display the details of a service.
 * It uses various atoms to get the current state and displays the service details
 * in a card with tabs for table and JSON views.
 */
function DetailsServiceComponent() {
  const currentVariant = useAtomValue(currentVariantAtom)
  const currentVariantClasses = useAtomValue(currentVariantClassesAtom)

  const currentService = useAtomValue(serviceDetailAtom)

  // Local sorting state for task table
  const [sortBy, setSortBy] = useState(null)
  const [sortDirection, setSortDirection] = useState('asc')

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
  const tasksWithSortableFields = tasksForService.map((task) => ({
    ...task,
    NodeName:
      task.Node && (task.Node.Description?.Hostname || task.Node.Hostname)
        ? task.Node.Description?.Hostname || task.Node.Hostname
        : task.NodeName || '',
    State: task.Status?.State || task.State || '',
    CreatedAt: task.CreatedAt || task.Timestamp || '',
    UpdatedAt: task.UpdatedAt || task.CreatedAt || task.Timestamp || '',
  }))

  // Define column types for proper sorting
  const columnTypes = {
    NodeName: 'string',
    State: 'string',
    DesiredState: 'string',
    CreatedAt: 'date',
    UpdatedAt: 'date',
  }

  // Sort the tasks
  const sortedTasks = sortData(
    tasksWithSortableFields,
    sortBy,
    sortDirection,
    columnTypes,
  )

  return (
    <div
      style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}
    >
      <Card className={currentVariantClasses}>
        <Card.Header>
          <h5>
            <FontAwesomeIcon icon="folder" /> Service "
            {serviceObj?.Spec?.Name || serviceObj?.Name || 'unknown'}"
          </h5>
        </Card.Header>
        <Card.Body style={{ overflowY: 'auto' }}>
          <Tabs className="mb-3" defaultActiveKey="metrics">
            <Tab eventKey="metrics" title="Metrics">
              <ServiceMetricsComponent serviceId={serviceObj?.ID} />
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
      <Card className={currentVariantClasses}>
        <Card.Header>
          <h5>
            <FontAwesomeIcon icon="tasks" /> Tasks for this Service
          </h5>
        </Card.Header>
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
                    (task && task.ID ? String(task.ID) : `task-idx-${idx}`) +
                    `-${idx}`
                  }
                >
                  <td>
                    {/* Prefer full node object if present, otherwise fall back to NodeName/NodeID */}
                    <NodeName
                      name={task.NodeName}
                      id={
                        task.Node && task.Node.ID ? task.Node.ID : task.NodeID
                      }
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
      </Card>
    </div>
  )
}

export { DetailsServiceComponent }
