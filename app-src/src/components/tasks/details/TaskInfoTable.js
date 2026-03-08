import { useAtomValue } from 'jotai'
import { currentVariantClassesAtom } from '../../../common/store/atoms'
import { toDefaultDateTimeString } from '../../../common/DefaultDateTimeFormat'
import { Table } from 'react-bootstrap'
import { EntityName } from '../../shared/names/EntityName'
import ServiceStatusBadge from '../../services/ServiceStatusBadge'

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
              <EntityName
                name={taskObj.ServiceName || taskObj.ServiceID}
                id={taskObj.ServiceID}
                entityType="service"
              />
            </td>
          </tr>
          <tr>
            <td>
              <strong>Node</strong>
            </td>
            <td>
              <EntityName
                name={taskObj.NodeName || taskObj.NodeID}
                id={taskObj.NodeID}
                entityType="node"
                showFilter={false}
              />
            </td>
          </tr>
          <tr>
            <td>
              <strong>State</strong>
            </td>
            <td>
              <ServiceStatusBadge
                id={taskObj.ID}
                serviceState={taskObj.Status?.State}
              />
            </td>
          </tr>
          <tr>
            <td>
              <strong>Desired State</strong>
            </td>
            <td>{taskObj.DesiredState}</td>
          </tr>
          {taskObj.Slot != null && (
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
