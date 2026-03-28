import React from 'react'
import { useAtomValue } from 'jotai'
import { currentVariantClassesAtom } from '../../../common/store/atoms/themeAtoms'
import { tableSizeAtom } from '../../../common/store/atoms/uiAtoms'
import { toDefaultDateTimeString } from '../../../common/DefaultDateTimeFormat'
import { Table } from 'react-bootstrap'
import EntityName from '../../shared/names/EntityName'
import ServiceStatusBadge from '../../services/ServiceStatusBadge'

/**
 * Determines if slot information should be displayed
 * Extracted for better testability
 */
export function shouldShowSlot(slot) {
  return slot != null && slot !== ''
}

/**
 * Displays a summary table with core task properties (service, node, state,
 * desired state, slot, timestamps).
 * @param {object} props
 * @param {object} props.taskObj - The raw task object
 */
const TaskInfoTable = React.memo(function TaskInfoTable({ taskObj }) {
  const currentVariantClasses = useAtomValue(currentVariantClassesAtom)
  const tableSize = useAtomValue(tableSizeAtom)

  if (!taskObj) return null

  return (
    <div className="mb-3">
      <h5>Task Information</h5>
      <Table size={tableSize} bordered className={currentVariantClasses}>
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
          {shouldShowSlot(taskObj.Slot) && (
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
})

export default TaskInfoTable
