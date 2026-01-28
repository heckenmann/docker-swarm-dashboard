import { useAtomValue } from 'jotai'
import { toDefaultDateTimeString } from '../common/DefaultDateTimeFormat'
import {
  currentVariantAtom,
  currentVariantClassesAtom,
  tasksAtomNew,
  tableSizeAtom,
  dashboardSettingsAtom,
  serviceNameFilterAtom,
  stackNameFilterAtom,
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
            <th className="timestamp-col">Timestamp</th>
            <th className="state-col">State</th>
            <th className="desired-state-col">DesiredState</th>
            <th className="service-col">ServiceName</th>
            <th className="slot-col">Slot</th>
            <th className="stack-col">Stack</th>
            <th className="node-col">Node</th>
            <th>Error</th>
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </Table>
    </Card>
  )
}

export { TasksComponent }
