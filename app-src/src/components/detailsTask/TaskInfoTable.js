import { useAtomValue } from 'jotai'
import { currentVariantClassesAtom } from '../../common/store/atoms'
import { toDefaultDateTimeString } from '../../common/DefaultDateTimeFormat'
import { Table } from 'react-bootstrap'
import { NodeName } from '../names/NodeName'
import { ServiceName } from '../names/ServiceName'
import ServiceStatusBadge from '../ServiceStatusBadge'

/**
 * Displays a summary table with core task properties (service, node, state,
 * desired state, slot, timestamps).
 * @param {object} props
 * @param {object} props.taskObj - The raw task object
 */
function TaskInfoTable({ taskObj }) {
  const currentVariantClasses = useAtomValue(currentVariantClassesAtom)

  return (
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
  )
}

export { TaskInfoTable }
