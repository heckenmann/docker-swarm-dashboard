import { Badge, Button, Table, OverlayTrigger, Tooltip } from 'react-bootstrap'
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
  const visibleServices = services.filter((service) =>
    serviceFilter(service, serviceNameFilter, stackNameFilter),
  )

  // fixed widths (percent) for important columns; the remainder is distributed to service columns
  const fixedWidths = {
    // node will use a fixed pixel width (250px)
    node: 0,
    // role and ip use fixed pixel widths (120px)
    role: 0,
    // state and availability will use fixed pixel widths (120px) instead of percent
    state: 0,
    availability: 0,
    ip: 0,
    trailing: 4,
  }
  const fixedTotal = Object.values(fixedWidths).reduce((a, b) => a + b, 0)
  const remaining = Math.max(0, 100 - fixedTotal)
  const serviceColPercent =
    visibleServices.length > 0 ? remaining / visibleServices.length : remaining
  const nodeWidth = fixedWidths.node
  const roleWidth = fixedWidths.role
  const stateWidth = fixedWidths.state
  const availabilityWidth = fixedWidths.availability
  const ipWidth = fixedWidths.ip
  const trailingWidth = fixedWidths.trailing

  services
    .filter((service) =>
      serviceFilter(service, serviceNameFilter, stackNameFilter),
    )
    .forEach((service) => {
      theads.push(
        <div
          key={'dashboardTable-' + service['ID']}
          className="dataCol cursorPointer"
          style={{ width: '120px', minWidth: '120px' }}
          onClick={() =>
            updateView({ id: servicesDetailId, detail: service.ID })
          }
        >
          <OverlayTrigger
            placement="top"
            overlay={
              <Tooltip id={`tt-${service.ID}`}>{service['Name']}</Tooltip>
            }
          >
            <div className="text-ellipsis">{service['Name']}</div>
          </OverlayTrigger>
        </div>,
      )
    })
  theads.push(<th key="dashboardTable-empty"></th>)

  nodes.forEach((node) => {
    const dataCols = visibleServices.map((service) => (
      <td
        className="align-middle"
        key={'td' + node['ID'] + service['ID']}
        style={{ width: '120px', minWidth: '120px' }}
      >
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
        <td
          className="align-middle"
          style={{ width: '250px', minWidth: '250px' }}
        >
          <Button
            onClick={() => updateView({ id: nodesDetailId, detail: node.ID })}
            variant="secondary"
            size="sm"
            className="w-100 text-ellipsis"
          >
            {node['Hostname']}{' '}
            {node['Leader'] && <FontAwesomeIcon icon="star" />}
          </Button>
        </td>
        <td
          className="align-middle"
          style={{ width: '120px', minWidth: '120px' }}
        >
          {node['Role']}
        </td>
        <td
          className="align-middle"
          style={{ width: '120px', minWidth: '120px' }}
        >
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
        <td
          className="align-middle"
          style={{ width: '120px', minWidth: '120px' }}
        >
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
        <td
          className="align-middle"
          style={{ width: '120px', minWidth: '120px' }}
        >
          {node['IP']}
        </td>
        {dataCols}
        <td></td>
      </tr>,
    )
  })

  return (
    <>
      <DashboardSettingsComponent />
      <div className="dashboard-table-wrapper">
        <Table
          variant={isDarkMode ? currentVariant : null}
          key="dashboardTable"
          id="dashboardTable"
          striped
          size={tableSize}
          role="table"
          aria-label="Docker Swarm Dashboard"
        >
          <thead role="rowgroup">
            <tr role="row">
              <th
                className="nodeAttribute"
                style={{ width: '250px', minWidth: '250px' }}
              >
                Node
              </th>
              <th
                className="nodeAttributeSmall"
                style={{ width: '120px', minWidth: '120px' }}
              >
                Role
              </th>
              <th
                className="nodeAttributeSmall"
                style={{ width: '120px', minWidth: '120px' }}
              >
                State
              </th>
              <th
                className="nodeAttributeSmall"
                style={{ width: '120px', minWidth: '120px' }}
              >
                Availability
              </th>
              <th
                className="nodeAttributeSmall"
                style={{ width: '120px', minWidth: '120px' }}
              >
                IP
              </th>
              {theads.map((thead) => (
                <th
                  key={thead.key}
                  className={thead.props.className}
                  style={thead.props.style}
                  title={thead.props.title || ''}
                  onClick={thead.props.onClick}
                >
                  <div
                    className="header-wrap"
                    title={
                      typeof thead.props.children === 'string'
                        ? thead.props.children
                        : undefined
                    }
                  >
                    {thead.props.children}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{trows}</tbody>
        </Table>
      </div>
    </>
  )
}

export { DashboardComponent }
