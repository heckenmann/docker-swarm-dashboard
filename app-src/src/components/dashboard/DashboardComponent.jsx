import React from 'react'
import { useAtom, useAtomValue } from 'jotai'
import { Table, Badge, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  currentVariantAtom,
  isDarkModeAtom,
} from '../../common/store/atoms/themeAtoms'
import { dashboardHAtom } from '../../common/store/atoms/dashboardAtoms'
import { viewAtom } from '../../common/store/atoms/navigationAtoms'
import {
  hiddenServiceStatesAtom,
  serviceNameFilterAtom,
  stackNameFilterAtom,
  tableSizeAtom,
} from '../../common/store/atoms/uiAtoms'
import {
  servicesDetailId,
  tasksDetailId,
} from '../../common/navigationConstants'
import { serviceFilter } from '../../common/utils'
import DSDCard from '../common/DSDCard'
import NodeName from '../shared/names/NodeName'
import ServiceName from '../shared/names/ServiceName'
import ServiceStatusBadge from '../services/ServiceStatusBadge.jsx'
import DashboardSettingsComponent from './DashboardSettingsComponent'
import './Dashboard.css'

/**
 * DashboardComponent
 * Renders the main horizontal dashboard table showing nodes and services.
 * Keys are defensive: coerced to string with fallbacks to avoid duplicate or
 * malformed object keys.
 */
const DashboardComponent = React.memo(function DashboardComponent() {
  const serviceNameFilter = useAtomValue(serviceNameFilterAtom)
  const stackNameFilter = useAtomValue(stackNameFilterAtom)
  const isDarkMode = useAtomValue(isDarkModeAtom)
  const currentVariant = useAtomValue(currentVariantAtom)
  const tableSize = useAtomValue(tableSizeAtom)
  const hiddenServiceStates = useAtomValue(hiddenServiceStatesAtom)
  const [, updateView] = useAtom(viewAtom)

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
            <ul className="list-unstyled mb-0">
              {node['Tasks'][service['ID']].map((task, id) => (
                <li
                  key={
                    'badge-' +
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
                  style={{ cursor: 'pointer' }}
                  onClick={() =>
                    updateView({
                      id: tasksDetailId,
                      detail: task.ID,
                      timestamp: Date.now(),
                    })
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      updateView({
                        id: tasksDetailId,
                        detail: task.ID,
                        timestamp: Date.now(),
                      })
                    }
                  }}
                  tabIndex={0}
                  role="button"
                >
                  <ServiceStatusBadge
                    id={id}
                    serviceState={task?.Status?.State}
                    createdAt={task?.CreatedAt}
                    updatedAt={task?.UpdatedAt}
                    serviceError={task?.Status?.Err}
                    hiddenStates={hiddenServiceStates}
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
          className="align-middle node-attribute"
          style={{ width: '250px', minWidth: '250px' }}
        >
          <div className="d-flex align-items-center flex-nowrap">
            <NodeName name={node['Hostname']} id={node.ID} />
            {node['Leader'] && (
              <OverlayTrigger
                placement="top"
                overlay={<Tooltip id={`leader-tt-${node.ID}`}>Leader</Tooltip>}
              >
                <span className="ms-1 flex-shrink-0">
                  <FontAwesomeIcon icon="star" />
                </span>
              </OverlayTrigger>
            )}
          </div>
        </td>
        <td
          className="align-middle node-attribute-small"
          style={{ width: '120px', minWidth: '120px' }}
        >
          {node['Role']}
        </td>
        <td
          className="align-middle node-attribute-small"
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
          className="align-middle node-attribute-small"
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
          className="align-middle node-attribute-small"
          style={{ width: '120px', minWidth: '120px' }}
        >
          {node['IP']}
        </td>
        {dataCols}
        <td className="fill-col" />
      </tr>,
    )
  })

  return (
    <DSDCard
      icon="grip"
      title="Dashboard"
      headerActions={<DashboardSettingsComponent />}
      bodyClassName="p-0"
      body={
        <div className="dashboard-table-wrapper table-responsive">
          <Table
            variant={isDarkMode ? currentVariant : null}
            id="dashboardTable"
            key="dashboardTable"
            className="dashboard-table"
            striped
            size={tableSize}
            role="table"
            aria-label="Docker Swarm Dashboard"
          >
            <colgroup>
              <col style={{ width: '250px', minWidth: '250px' }} />
              <col style={{ width: '120px', minWidth: '120px' }} />
              <col style={{ width: '120px', minWidth: '120px' }} />
              <col style={{ width: '120px', minWidth: '120px' }} />
              <col style={{ width: '120px', minWidth: '120px' }} />
              {visibleServices.map((service) => (
                <col
                  key={`col-${service.ID}`}
                  style={{ width: '120px', minWidth: '120px' }}
                />
              ))}
              <col className="fill-col" />
            </colgroup>
            <thead role="rowgroup">
              {/* three header rows: fixed attributes span 3 rows, services distributed across rows */}
              <tr role="row">
                <th className="node-attribute" rowSpan={3}>
                  Node
                </th>
                <th className="node-attribute-small" rowSpan={3}>
                  Role
                </th>
                <th className="node-attribute-small" rowSpan={3}>
                  State
                </th>
                <th className="node-attribute-small" rowSpan={3}>
                  Availability
                </th>
                <th className="node-attribute-small" rowSpan={3}>
                  IP
                </th>
                {serviceHeaders.length > 0 ? (
                  serviceHeaders.map((h, idx) => {
                    const isLastColumn = idx === serviceHeaders.length - 1
                    if (h.index % 3 === 0) {
                      return (
                        <th
                          key={h.key}
                          data-index={h.index}
                          className={`service-header row-${h.index % 3} data-col svc-index-${h.index} svc-start-${h.index % 3} hdr-row-0`}
                          style={
                            isLastColumn
                              ? { ...h.style, width: 'auto' }
                              : h.style
                          }
                          colSpan={isLastColumn ? 2 : 1}
                        >
                          <div className="service-name-container">
                            <ServiceName
                              name={h.name}
                              id={h.id}
                              useOverlay={false}
                              tooltipText={h.name}
                              nameClass="service-name-text"
                            />
                          </div>
                        </th>
                      )
                    } else {
                      return (
                        <th
                          key={`ph-${h.key}`}
                          className={`data-col svc-index-${h.index} svc-start-${h.index % 3} hdr-row-0`}
                          style={
                            isLastColumn
                              ? { ...h.style, width: 'auto' }
                              : h.style
                          }
                          colSpan={isLastColumn ? 2 : 1}
                        />
                      )
                    }
                  })
                ) : (
                  <th className="fill-col" rowSpan={3} />
                )}
                {/* Filler column is now merged with the last service in row 0 */}
              </tr>
              <tr role="row">
                {serviceHeaders.map((h, idx) => {
                  const isLastColumn = idx === serviceHeaders.length - 1
                  if (h.index % 3 === 1) {
                    return (
                      <th
                        key={h.key}
                        data-index={h.index}
                        className={`service-header row-${h.index % 3} data-col svc-index-${h.index} svc-start-${h.index % 3} hdr-row-1`}
                        style={
                          isLastColumn ? { ...h.style, width: 'auto' } : h.style
                        }
                        colSpan={isLastColumn ? 2 : 1}
                      >
                        <div className="service-name-container">
                          <ServiceName
                            name={h.name}
                            id={h.id}
                            useOverlay={false}
                            tooltipText={h.name}
                            nameClass="service-name-text"
                          />
                        </div>
                      </th>
                    )
                  } else {
                    return (
                      <th
                        key={`ph2-${h.key}`}
                        className={`data-col svc-index-${h.index} svc-start-${h.index % 3} hdr-row-1`}
                        style={
                          isLastColumn ? { ...h.style, width: 'auto' } : h.style
                        }
                        colSpan={isLastColumn ? 2 : 1}
                      />
                    )
                  }
                })}
              </tr>
              <tr role="row">
                {serviceHeaders.map((h, idx) => {
                  const isLastColumn = idx === serviceHeaders.length - 1
                  if (h.index % 3 === 2) {
                    return (
                      <th
                        key={h.key}
                        data-index={h.index}
                        className={`service-header row-${h.index % 3} data-col svc-index-${h.index} svc-start-${h.index % 3} hdr-row-2`}
                        style={
                          isLastColumn ? { ...h.style, width: 'auto' } : h.style
                        }
                        colSpan={isLastColumn ? 2 : 1}
                      >
                        <div className="service-name-container">
                          <ServiceName
                            name={h.name}
                            id={h.id}
                            useOverlay={false}
                            tooltipText={h.name}
                            nameClass="service-name-text"
                          />
                        </div>
                      </th>
                    )
                  } else {
                    return (
                      <th
                        key={`ph3-${h.key}`}
                        className={`data-col svc-index-${h.index} svc-start-${h.index % 3} hdr-row-2`}
                        style={
                          isLastColumn ? { ...h.style, width: 'auto' } : h.style
                        }
                        colSpan={isLastColumn ? 2 : 1}
                      />
                    )
                  }
                })}
              </tr>
            </thead>
            <tbody>{trows}</tbody>
          </Table>
        </div>
      }
    />
  )
})

export default DashboardComponent
