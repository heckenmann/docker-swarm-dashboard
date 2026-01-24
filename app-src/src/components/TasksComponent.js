import { useAtom, useAtomValue } from 'jotai'
import { Card, Table, Button } from 'react-bootstrap'
import { toDefaultDateTimeString } from '../common/DefaultDateTimeFormat'
import { nodesDetailId, servicesDetailId } from '../common/navigationConstants'
import {
  currentVariantAtom,
  currentVariantClassesAtom,
  dashboardSettingsAtom,
  serviceNameFilterAtom,
  filterTypeAtom,
  stackNameFilterAtom,
  tableSizeAtom,
  tasksAtomNew,
  viewAtom,
} from '../common/store/atoms'
import ServiceStatusBadge from './ServiceStatusBadge'
import { FilterComponent } from './FilterComponent'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

/**
 * TasksComponent is a React functional component that displays a list of tasks
 * in a table format.
 */
function TasksComponent() {
  const [, updateView] = useAtom(viewAtom)
  const currentVariant = useAtomValue(currentVariantAtom)
  const currentVariantClasses = useAtomValue(currentVariantClassesAtom)
  const tableSize = useAtomValue(tableSizeAtom)
  const dashBoardSettings = useAtomValue(dashboardSettingsAtom)
  const serviceNameFilter = useAtomValue(serviceNameFilterAtom)
  const stackNameFilter = useAtomValue(stackNameFilterAtom)
  const [, setServiceFilterName] = useAtom(serviceNameFilterAtom)
  const [, setStackFilterName] = useAtom(stackNameFilterAtom)
  const [, setFilterType] = useAtom(filterTypeAtom)

  const tasks = useAtomValue(tasksAtomNew)
  const rows = tasks
    .filter((task) =>
      serviceNameFilter ? task.ServiceName.includes(serviceNameFilter) : true,
    )
    .filter((task) =>
      stackNameFilter ? task.Stack.includes(stackNameFilter) : true,
    )
    .map((task, id) => (
      <tr
        key={'tasksTable-' + task['ID']}
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
          <span className="me-2">{task.ServiceName}</span>
          {task.ServiceName && (
            <>
              <Button
                className="service-open-btn me-1"
                size="sm"
                title={`Open service: ${task.ServiceName}`}
                onClick={(e) => {
                  e.stopPropagation()
                  updateView({ id: servicesDetailId, detail: task.ServiceID })
                }}
              >
                <FontAwesomeIcon icon="search" />
              </Button>
              <Button
                className="stack-filter-btn"
                size="sm"
                title={`Filter service: ${task.ServiceName}`}
                onClick={(e) => {
                  e.stopPropagation()
                  // set service filter and clear stack filter
                  setServiceFilterName(task.ServiceName || '')
                  setStackFilterName('')
                  setFilterType('service')
                }}
              >
                <FontAwesomeIcon icon="filter" />
              </Button>
            </>
          )}
        </td>
        <td>{task.Slot}</td>
        <td>
          <span className="me-2">{task.Stack}</span>
          {task.Stack && (
            <Button
              className="stack-filter-btn"
              size="sm"
              title={`Filter stack: ${task.Stack}`}
              onClick={() => {
                // set stack filter and clear service filter
                setStackFilterName(task.Stack || '')
                setServiceFilterName('')
                setFilterType('stack')
              }}
            >
              <FontAwesomeIcon icon="filter" />
            </Button>
          )}
        </td>
        <td>
          <span className="me-2">{task.NodeName}</span>
          <Button
            className="service-open-btn"
            size="sm"
            title={`Open node: ${task.NodeName}`}
            onClick={() =>
              updateView({ id: nodesDetailId, detail: task.NodeID })
            }
          >
            <FontAwesomeIcon icon="search" />
          </Button>
        </td>
        <td>{task.Err}</td>
      </tr>
    ))

  return (
    <Card bg={currentVariant} className={currentVariantClasses}>
      <Card.Header>
        <FilterComponent />
      </Card.Header>
      <Table
        id="tasksTable"
        variant={currentVariant}
        striped
        size={tableSize}
        className="mt-2"
      >
        <thead>
          <tr>
            <th style={{ width: '25px' }}></th>
            <th id="timestampCol">Timestamp</th>
            <th id="stateCol">State</th>
            <th id="desiredstateCol">DesiredState</th>
            <th id="serviceCol">ServiceName</th>
            <th id="slotCol">Slot</th>
            <th id="stackCol">Stack</th>
            <th id="nodeCol">Node</th>
            <th>Error</th>
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </Table>
    </Card>
  )
}

export { TasksComponent }
