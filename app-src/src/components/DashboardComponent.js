import { Badge, Button, Table } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { DashboardSettingsComponent } from './DashboardSettingsComponent'
import {
  currentVariantAtom,
  dashboardHAtom,
  dashboardSettingsAtom,
  isDarkModeAtom,
  serviceNameFilterAtom,
  stackNameFilterAtom,
  tableSizeAtom,
  viewAtom,
} from '../common/store/atoms'
import { useAtom, useAtomValue } from 'jotai'
import { nodesDetailId, servicesDetailId } from '../common/navigationConstants'
import ServiceStatusBadge from './ServiceStatusBadge'
import { serviceFilter } from '../common/utils'

/**
 * DashboardComponent is a React functional component that renders the dashboard
 * table with nodes and services information. It uses various atoms from Jotai
 * for state management and applies filters to display the relevant data.
 */
function DashboardComponent() {
  const isDarkMode = useAtomValue(isDarkModeAtom)
  const currentVariant = useAtomValue(currentVariantAtom)
  const [, updateView] = useAtom(viewAtom)
  const tableSize = useAtomValue(tableSizeAtom)
  const dashboardSettings = useAtomValue(dashboardSettingsAtom)
  const serviceNameFilter = useAtomValue(serviceNameFilterAtom)
  const stackNameFilter = useAtomValue(stackNameFilterAtom)

  const theads = []
  const trows = []

  const dashboardhData = useAtomValue(dashboardHAtom)
  const services = dashboardhData['Services']
  const nodes = dashboardhData['Nodes']

  // Columns
  services
    .filter((service) =>
      serviceFilter(service, serviceNameFilter, stackNameFilter),
    )
    .forEach((service) => {
      theads.push(
        <th
          key={'dashboardTable-' + service['ID']}
          className="dataCol cursorPointer"
          onClick={() =>
            updateView({ id: servicesDetailId, detail: service.ID })
          }
        >
          <div className="rotated">{service['Name']}</div>
        </th>,
      )
    })
  theads.push(<th key="dashboardTable-empty"></th>)

  nodes.forEach((node) => {
    const dataCols = services
      .filter((service) =>
        serviceFilter(service, serviceNameFilter, stackNameFilter),
      )
      .map((service) => (
        <td className="align-middle" key={'td' + node['ID'] + service['ID']}>
          {node['Tasks'][service['ID']] && (
            <ul>
              {node['Tasks'][service['ID']].map((task, id) => (
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
                    hiddenStates={dashboardSettings.hiddenServiceStates}
                  />
                </li>
              ))}
            </ul>
          )}
        </td>
      ))

    trows.push(
      <tr
        key={'tr' + node['ID']}
        className={node['StatusState'] === 'ready' ? null : 'danger'}
      >
        <td className="align-middle">
          <Button
            onClick={() => updateView({ id: nodesDetailId, detail: node.ID })}
            variant="secondary"
            size="sm"
            className="w-100 text-nowrap"
          >
            {node['Hostname']}{' '}
            {node['Leader'] && <FontAwesomeIcon icon="star" />}
          </Button>
        </td>
        <td className="align-middle">{node['Role']}</td>
        <td className="align-middle">
          {(node['StatusState'] === 'ready' && (
            <Badge bg="success" className="w-100">
              Ready
            </Badge>
          )) ||
            (node['StatusState'] === 'down' && (
              <Badge bg="danger" className="w-100">
                Down
              </Badge>
            )) || (
              <Badge bg="warning" className="w-100">
                {node['StatusState']}
              </Badge>
            )}
        </td>
        <td className="align-middle">
          {(node['Availability'] === 'active' && (
            <Badge bg="success" className="w-100">
              {node['Availability']}
            </Badge>
          )) || (
            <Badge bg="warning" className="w-100">
              {node['Availability']}
            </Badge>
          )}
        </td>
        <td className="align-middle">{node['IP']}</td>
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
        striped
        size={tableSize}
      >
        <thead>
          <tr>
            <th className="nodeAttribute">Node</th>
            <th className="nodeAttributeSmall">Role</th>
            <th className="nodeAttributeSmall">State</th>
            <th className="nodeAttributeSmall">Availability</th>
            <th className="nodeAttributeSmall">IP</th>
            {theads}
          </tr>
        </thead>
        <tbody>{trows}</tbody>
      </Table>
    </>
  )
}

export { DashboardComponent }
