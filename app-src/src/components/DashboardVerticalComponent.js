import { Table, Button } from 'react-bootstrap'
import { DashboardSettingsComponent } from './DashboardSettingsComponent'
import {
  currentVariantAtom,
  dashboardSettingsAtom,
  dashboardVAtom,
  isDarkModeAtom,
  serviceNameFilterAtom,
  stackNameFilterAtom,
  filterTypeAtom,
  tableSizeAtom,
  viewAtom,
} from '../common/store/atoms'
import { useAtom, useAtomValue } from 'jotai'
import { nodesDetailId, servicesDetailId } from '../common/navigationConstants'
import ServiceStatusBadge from './ServiceStatusBadge'
import { EntityName } from './names/EntityName'
import { ServiceName } from './names/ServiceName'
import { StackName } from './names/StackName'
import { serviceFilter } from '../common/utils'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

/**
 * DashboardVerticalComponent is a React functional component that renders
 * a vertical dashboard table with nodes and services information.
 * It uses various atoms from Jotai for state management and filters services
 * based on the provided filters.
 */
function DashboardVerticalComponent() {
  const isDarkMode = useAtomValue(isDarkModeAtom)
  const currentVariant = useAtomValue(currentVariantAtom)
  const [, updateView] = useAtom(viewAtom)
  const tableSize = useAtomValue(tableSizeAtom)
  const dashboardSettings = useAtomValue(dashboardSettingsAtom)
  const serviceNameFilter = useAtomValue(serviceNameFilterAtom)
  const stackNameFilter = useAtomValue(stackNameFilterAtom)
  // setter to change the stack-name filter value programmatically
  const [, setStackFilterName] = useAtom(stackNameFilterAtom)
  // setter to change the service-name filter value programmatically
  const [, setServiceFilterName] = useAtom(serviceNameFilterAtom)
  const [, setFilterType] = useAtom(filterTypeAtom)

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
        <EntityName
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
          key={'td' + node['ID'] + service['ID']}
          style={{ width: '120px', minWidth: '120px' }}
        >
          {service['Tasks'][node['ID']] && (
            <ul>
              {service['Tasks'][node['ID']].map((task, id) => (
                <li
                  key={
                    'li' +
                    task['NodeID'] +
                    task['ServiceID'] +
                    task['ID'] +
                    task['Status']
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
