import { useAtom, useAtomValue } from 'jotai'
import { Badge, Card, Table } from 'react-bootstrap'
import { toDefaultDateTimeString } from '../common/DefaultDateTimeFormat'
import { nodesDetailId, servicesDetailId } from '../common/navigationConstants'
import {
  currentVariantAtom,
  currentVariantClassesAtom,
  tableSizeAtom,
  tasksAtomNew,
  viewAtom,
} from '../common/store/atoms'
import { getStyleClassForState } from '../Helper'

function TasksComponent() {
  const [, updateView] = useAtom(viewAtom)
  const currentVariant = useAtomValue(currentVariantAtom)
  const currentVariantClasses = useAtomValue(currentVariantClassesAtom)
  const tableSize = useAtomValue(tableSizeAtom)

  let rows

  const tasks = useAtomValue(tasksAtomNew)
  rows = tasks.map((task) => (
    <tr
      key={'tasksTable-' + task['ID']}
      className={task['State'] === 'failed' ? 'table-danger' : null}
    >
      <td>{toDefaultDateTimeString(new Date(task['Timestamp']))}</td>
      <td>
        <Badge className="w-100" bg={getStyleClassForState(task['State'])}>
          {task['State']}{' '}
        </Badge>
      </td>
      <td>{task['DesiredState']}</td>
      <td
        className="cursorPointer"
        key={task.ServiceID}
        onClick={() =>
          updateView({
            id: servicesDetailId,
            detail: task.ServiceID,
          })
        }
      >
        {task.ServiceName}
      </td>
      <td
        className="cursorPointer"
        key={task.NodeID}
        onClick={() =>
          updateView({
            id: nodesDetailId,
            detail: task.NodeID,
          })
        }
      >
        {task.NodeName}
      </td>
      <td>{task.Err}</td>
    </tr>
  ))

  return (
    <Card className={currentVariantClasses}>
      <Card.Body>
        <Table
          id="tasksTable"
          variant={currentVariant}
          striped
          size={tableSize}
        >
          <thead>
            <tr>
              <th id="timestampCol">Timestamp</th>
              <th id="stateCol">State</th>
              <th id="desiredstateCol">DesiredState</th>
              <th id="serviceCol">ServiceName</th>
              <th id="nodeCol">Node</th>
              <th>Error</th>
            </tr>
          </thead>
          <tbody>{rows}</tbody>
        </Table>
      </Card.Body>
    </Card>
  )
}

export { TasksComponent }
