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
import { EntityName } from './names/EntityName'
import { StackName } from './names/StackName'
import { NodeName } from './names/NodeName'
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
        key={'tasksTable-' + (task && task.ID ? String(task.ID) + `-${id}` : `index-${id}`)}
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
          <EntityName name={task.ServiceName} id={task.ServiceID} />
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
