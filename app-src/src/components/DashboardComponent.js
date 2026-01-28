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
import { servicesDetailId } from '../common/navigationConstants'
import { serviceFilter } from '../common/utils'
import { Table, Badge, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { NodeName } from './names/NodeName'
import { ServiceName } from './names/ServiceName'
import ServiceStatusBadge from './ServiceStatusBadge'
import { DashboardSettingsComponent } from './DashboardSettingsComponent'

/**
 * DashboardComponent
 * Renders the main horizontal dashboard table showing nodes and services.
 * Keys are defensive: coerced to string with fallbacks to avoid duplicate or
 * [object Object] keys when mock data is malformed.
 */
function DashboardComponent() {
  const serviceNameFilter = useAtomValue(serviceNameFilterAtom)
  const stackNameFilter = useAtomValue(stackNameFilterAtom)
  const isDarkMode = useAtomValue(isDarkModeAtom)
  const currentVariant = useAtomValue(currentVariantAtom)
  const tableSize = useAtomValue(tableSizeAtom)
  const dashboardSettings = useAtomValue(dashboardSettingsAtom)
  const [, updateView] = useAtom(viewAtom)

  const theads = []
  const trows = []

  const dashboardhData = useAtomValue(dashboardHAtom) || {}
  const services = dashboardhData['Services'] || []
  const nodes = dashboardhData['Nodes'] || []

  // Columns
  const visibleServices = services.filter((service) =>
    serviceFilter(service, serviceNameFilter, stackNameFilter),
  )

  // build a lightweight descriptor for each visible service header
  const serviceHeaders = visibleServices.map((service, idx) => ({
    id: service.ID,
    name: service.Name || service['Name'],
    style: { width: '120px', minWidth: '120px' },
    onClick: () =>
      updateView((prev) => ({
        ...prev,
        id: servicesDetailId,
        detail: service.ID,
      })),
    key: `dashboardTable-${service.ID}`,
    index: idx,
  }))

  // quick lookup for service index
  const serviceIndexMap = Object.fromEntries(
    serviceHeaders.map((h) => [h.id, h.index]),
  )

  visibleServices.forEach((service) => {
    theads.push(
      <div
        key={
          'dashboardTable-' +
          (service && service.ID ? String(service.ID) : 'svc-unknown')
        }
        className="data-col"
        style={{ width: '120px', minWidth: '120px' }}
      >
        <ServiceName
          name={service['Name']}
          id={service.ID}
          useOverlay={true}
          tooltipText={service['Name']}
          nameClass="text-ellipsis d-inline-block"
        />
      </div>,
    )
  })
  theads.push(<th key="dashboardTable-empty"></th>)

  nodes.forEach((node) => {
    const dataCols = []
    for (let s = 0; s < visibleServices.length; s++) {
      const service = visibleServices[s]
      const idx = serviceIndexMap[service.ID]

      const tdKey =
        'td-' +
        (node && node.ID ? String(node.ID) : `node-unknown`) +
        '-' +
        (service && service.ID ? String(service.ID) : `service-unknown`)

      dataCols.push(
        <td
          className={`align-middle svc-index-${idx}`}
          key={tdKey}
          style={{ width: '120px', minWidth: '120px' }}
        >
          {node['Tasks'] && node['Tasks'][service['ID']] && (
            <ul>
              {node['Tasks'][service['ID']].map((task, id) => (
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
                    // include the map index to guarantee uniqueness even if ID repeats
                    (task && task.ID
                      ? String(task.ID) + `-${id}`
                      : `task-idx-${id}`) +
                    '-' +
                    // prefer a primitive status marker; fall back to index
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
                    serviceState={task?.Status?.State}
                    createdAt={task?.CreatedAt}
                    updatedAt={task?.UpdatedAt}
                    serviceError={task?.Status?.Err}
                    hiddenStates={dashboardSettings.hiddenServiceStates}
                  />
                </li>
              ))}
            </ul>
          )}
        </td>,
      )
    }

    trows.push(
      <tr
        key={'tr-' + (node && node.ID ? String(node.ID) : `node-unknown`)}
        className={node['StatusState'] === 'ready' ? null : 'danger'}
      >
        <td
          className="align-middle"
          style={{ width: '250px', minWidth: '250px' }}
        >
          <NodeName name={node['Hostname']} id={node.ID} />
          {node['Leader'] && (
            <OverlayTrigger
              placement="top"
              overlay={<Tooltip id={`leader-tt-${node.ID}`}>Leader</Tooltip>}
            >
              <span className="ms-1">
                <FontAwesomeIcon icon="star" />
              </span>
            </OverlayTrigger>
          )}
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
          className="dashboard-table"
          striped
          size={tableSize}
          role="table"
          aria-label="Docker Swarm Dashboard"
        >
          <thead role="rowgroup">
            {/* three header rows: fixed attributes span 3 rows, services distributed across rows */}
            <tr role="row">
              <th
                className="node-attribute"
                rowSpan={3}
                style={{ width: '250px', minWidth: '250px' }}
              >
                Node
              </th>
              <th
                className="node-attribute-small"
                rowSpan={3}
                style={{ width: '120px', minWidth: '120px' }}
              >
                Role
              </th>
              <th
                className="node-attribute-small"
                rowSpan={3}
                style={{ width: '120px', minWidth: '120px' }}
              >
                State
              </th>
              <th
                className="node-attribute-small"
                rowSpan={3}
                style={{ width: '120px', minWidth: '120px' }}
              >
                Availability
              </th>
              <th
                className="node-attribute-small"
                rowSpan={3}
                style={{ width: '120px', minWidth: '120px' }}
              >
                IP
              </th>
              {serviceHeaders.map((h) =>
                h.index % 3 === 0 ? (
                  <th
                    key={h.key}
                    data-index={h.index}
                    className={`service-header row-${h.index % 3} data-col svc-index-${h.index} svc-start-${h.index % 3} hdr-row-0`}
                    style={h.style}
                  >
                    <ServiceName
                      name={h.name}
                      id={h.id}
                      useOverlay={false}
                      tooltipText={h.name}
                      nameClass="service-name-text"
                    />
                  </th>
                ) : (
                  <th
                    key={`ph-${h.key}`}
                    className={`data-col svc-index-${h.index} svc-start-${h.index % 3} hdr-row-0`}
                    style={h.style}
                  />
                ),
              )}
            </tr>
            <tr role="row">
              {serviceHeaders.map((h) =>
                h.index % 3 === 1 ? (
                  <th
                    key={h.key}
                    data-index={h.index}
                    className={`service-header row-${h.index % 3} data-col svc-index-${h.index} svc-start-${h.index % 3} hdr-row-1`}
                    style={h.style}
                  >
                    <ServiceName
                      name={h.name}
                      id={h.id}
                      useOverlay={false}
                      tooltipText={h.name}
                      nameClass="service-name-text"
                    />
                  </th>
                ) : (
                  <th
                    key={`ph2-${h.key}`}
                    className={`data-col svc-index-${h.index} svc-start-${h.index % 3} hdr-row-1`}
                    style={h.style}
                  />
                ),
              )}
            </tr>
            <tr role="row">
              {serviceHeaders.map((h) =>
                h.index % 3 === 2 ? (
                  <th
                    key={h.key}
                    data-index={h.index}
                    className={`service-header row-${h.index % 3} data-col svc-index-${h.index} svc-start-${h.index % 3} hdr-row-2`}
                    style={h.style}
                  >
                    <ServiceName
                      name={h.name}
                      id={h.id}
                      useOverlay={false}
                      tooltipText={h.name}
                      nameClass="service-name-text"
                    />
                  </th>
                ) : (
                  <th
                    key={`ph3-${h.key}`}
                    className={`data-col svc-index-${h.index} svc-start-${h.index % 3} hdr-row-2`}
                    style={h.style}
                  />
                ),
              )}
            </tr>
          </thead>
          <tbody>{trows}</tbody>
        </Table>
      </div>
    </>
  )
}

export { DashboardComponent }
