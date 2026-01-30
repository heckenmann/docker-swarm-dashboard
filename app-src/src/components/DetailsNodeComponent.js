import { useAtomValue } from 'jotai'
import {
  currentVariantAtom,
  currentVariantClassesAtom,
  nodeDetailAtom,
  tableSizeAtom,
} from '../common/store/atoms'
import { toDefaultDateTimeString } from '../common/DefaultDateTimeFormat'
import { Card, Tabs, Tab, Table, Row, Col } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { JsonTable } from './JsonTable'
import { ServiceName } from './names/ServiceName'
import ServiceStatusBadge from './ServiceStatusBadge'
import { SortableHeader } from './SortableHeader'
import { sortData } from '../common/sortUtils'
import { useState, useCallback } from 'react'
import { NodeMetricsComponent } from './NodeMetricsComponent'

/**
 * Component to display details of a node.
 * It uses various atoms to get the current state and displays the node details
 * in a card with tabs for metrics, tasks, table and JSON views.
 */
function DetailsNodeComponent() {
  const currentVariant = useAtomValue(currentVariantAtom)
  const currentVariantClasses = useAtomValue(currentVariantClassesAtom)
  const tableSize = useAtomValue(tableSizeAtom)

  const currentNode = useAtomValue(nodeDetailAtom)

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

  if (!currentNode) return <div>Node doesn't exist</div>

  // Only use the attached Service object on tasks. No fallback to legacy fields.
  const taskServiceName = (task) => {
    if (!task || !task.Service) return null
    return (
      task.Service?.Spec?.Name || task.Service?.Spec?.Annotations?.Name || null
    )
  }

  const taskServiceId = (task) => {
    if (!task || !task.Service) return null
    return task.Service?.ID || null
  }

  // Prepare tasks with sortable fields
  const tasksWithSortableFields = (currentNode.tasks || []).map((task) => ({
    ...task,
    ServiceName: taskServiceName(task) || '',
    State: task.Status?.State || task.State || '',
    CreatedAt: task.CreatedAt || task.Timestamp || '',
    UpdatedAt: task.UpdatedAt || task.CreatedAt || task.Timestamp || '',
  }))

  // Define column types for proper sorting
  const columnTypes = {
    ServiceName: 'string',
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
    <div>
      <Row>
        <Col xs={12}>
          <Card className={currentVariantClasses}>
            <Card.Header>
              <h5>
                <FontAwesomeIcon icon="server" /> Node "
                {currentNode.node?.Description?.Hostname}"
              </h5>
            </Card.Header>
            <Card.Body>
              <Tabs className="mb-3" defaultActiveKey="metrics">
                <Tab eventKey="metrics" title="Metrics">
                  <NodeMetricsComponent nodeId={currentNode.node?.ID} />
                </Tab>
                <Tab eventKey="tasks" title="Tasks">
                  <Table striped bordered hover size={tableSize} variant={currentVariant}>
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
                              (task && task.ID ? String(task.ID) : `task-idx-${idx}`) +
                              `-${idx}`
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
                </Tab>
                <Tab eventKey="table" title="Table">
                  <JsonTable json={currentNode.node} variant={currentVariant} />
                </Tab>
                <Tab eventKey="json" title="JSON">
                  <pre
                    style={{
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'monospace',
                      fontSize: 12,
                    }}
                  >
                    <code>{JSON.stringify(currentNode.node, null, '\t')}</code>
                  </pre>
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export { DetailsNodeComponent }
