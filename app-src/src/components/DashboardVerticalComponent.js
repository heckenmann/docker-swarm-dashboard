import {
  currentVariantAtom,
  dashboardSettingsAtom,
  dashboardVAtom,
  isDarkModeAtom,
  serviceNameFilterAtom,
  stackNameFilterAtom,
  tableSizeAtom,
} from '../common/store/atoms'
import { useAtomValue } from 'jotai'
import { serviceFilter } from '../common/utils'
import { Table } from 'react-bootstrap'
import { NodeName } from './names/NodeName'
import { ServiceName } from './names/ServiceName'
import { StackName } from './names/StackName'
import ServiceStatusBadge from './ServiceStatusBadge'
import { DashboardSettingsComponent } from './DashboardSettingsComponent'

/**
 * DashboardVerticalComponent is a React functional component that renders
 * a vertical dashboard table with nodes and services information.
 * It uses various atoms from Jotai for state management and filters services
 * based on the provided filters.
 */
function DashboardVerticalComponent() {
  const isDarkMode = useAtomValue(isDarkModeAtom)
  const currentVariant = useAtomValue(currentVariantAtom)
  const tableSize = useAtomValue(tableSizeAtom)
  const dashboardSettings = useAtomValue(dashboardSettingsAtom)
  const serviceNameFilter = useAtomValue(serviceNameFilterAtom)
  const stackNameFilter = useAtomValue(stackNameFilterAtom)

  const theads = []
  const trows = []

  const dashboardvData = useAtomValue(dashboardVAtom)
  const nodes = dashboardvData['Nodes']
  const services = dashboardvData['Services']

  // Columns
  nodes.forEach((node) => {
    theads.push(
      <th
        key={'dashboardTable-' + node['ID']}
        className="service-header dataCol"
        style={{ width: '120px', minWidth: '120px' }}
      >
        <NodeName
          name={node['Hostname']}
          id={node.ID}
          showFilter={false}
          nameClass="service-name-text"
        />
      </th>,
    )
  })
  theads.push(<th key="dashboardTable-empty"></th>)

  services
    .filter((service) =>
      serviceFilter(service, serviceNameFilter, stackNameFilter),
    )
    .forEach((service) => {
      const dataCols = nodes.map((node) => (
        <td
          className="align-middle"
          key={
            'td-' +
            (node && node.ID ? String(node.ID) : 'node-unknown') +
            '-' +
            (service && service.ID ? String(service.ID) : 'service-unknown')
          }
          style={{ width: '120px', minWidth: '120px' }}
        >
          {service['Tasks'][node['ID']] && (
            <ul>
              {service['Tasks'][node['ID']].map((task, id) => (
                <li
                  key={
                    'li-' +
                    (task && task.NodeID
                      ? String(task.NodeID)
                      : `node-idx-${id}`) +
                    '-' +
                    (task && task.ServiceID
                      ? String(task.ServiceID)
                      : `svc-idx-${id}`) +
                    '-' +
                    (task && task.ID
                      ? String(task.ID) + `-${id}`
                      : `task-idx-${id}`) +
                    '-' +
                    (task && task.Status
                      ? String(
                          task.Status?.Timestamp ??
                            task.Status?.State ??
                            `status-idx-${id}`,
                        )
                      : `status-idx-${id}`)
                  }
                >
                  <ServiceStatusBadge
                    id={id}
                    serviceState={task['Status']['State']}
                    createdAt={task['CreatedAt']}
                    updatedAt={task['UpdatedAt']}
                    serviceError={task['Status']['Err']}
                    hiddenStates={
                      dashboardSettings
                        ? dashboardSettings.hiddenServiceStates
                        : []
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </td>
      ))

      trows.push(
        <tr key={'tr' + service['ID']}>
          <td>
            <ServiceName name={service['Name']} id={service.ID} />
          </td>
          <td className="stack-column">
            <StackName name={service['Stack']} />
          </td>
          <td>{service['Replication']}</td>
          {dataCols}
          <td></td>
        </tr>,
      )
    })

  return (
    <>
      <DashboardSettingsComponent />
      <Table
        variant={isDarkMode ? currentVariant : null}
        key="dashboardTable"
        id="dashboardTable"
        className="vertical-dashboard"
        striped
        size={tableSize}
        role="table"
        aria-label="Docker Swarm Dashboard (vertical)"
      >
        <thead role="rowgroup">
          <tr role="row">
            <th className="col-md-4">Service</th>
            <th className="stack-column">Stack</th>
            <th style={{ width: '120px', minWidth: '120px' }}>Replication</th>
            {theads}
          </tr>
        </thead>
        <tbody>{trows}</tbody>
      </Table>
    </>
  )
}

export { DashboardVerticalComponent }
