import React, { useState } from 'react'
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
  filterTypeAtom,
  tableSizeAtom,
  viewAtom,
} from '../common/store/atoms'
import { useAtom, useAtomValue } from 'jotai'
import { nodesDetailId, servicesDetailId } from '../common/navigationConstants'
import ServiceStatusBadge from './ServiceStatusBadge'
import { EntityName } from './names/EntityName'
import { NodeName } from './names/NodeName'
import { ServiceName } from './names/ServiceName'
import { serviceFilter } from '../common/utils'

function DashboardComponent() {
  const serviceNameFilter = useAtomValue(serviceNameFilterAtom)
  const stackNameFilter = useAtomValue(stackNameFilterAtom)

  const [, setServiceFilterName] = useAtom(serviceNameFilterAtom)
  const [, setStackFilterName] = useAtom(stackNameFilterAtom)
  const [, setFilterType] = useAtom(filterTypeAtom)

  const isDarkMode = useAtomValue(isDarkModeAtom)
  const currentVariant = useAtomValue(currentVariantAtom)
  const tableSize = useAtomValue(tableSizeAtom)
  const dashboardSettings = useAtomValue(dashboardSettingsAtom)
  const [, updateView] = useAtom(viewAtom)

  const [shifted, setShifted] = useState(new Set())

  const theads = []
  const trows = []

  const dashboardhData = useAtomValue(dashboardHAtom)
  const services = dashboardhData['Services']
  const nodes = dashboardhData['Nodes']

  // Columns
  const visibleServices = services.filter((service) =>
    serviceFilter(service, serviceNameFilter, stackNameFilter),
  )

  // build a lightweight descriptor for each visible service header
  const serviceHeaders = visibleServices.map((service, idx) => ({
    id: service.ID,
    name: service.Name || service['Name'],
    style: { width: '120px', minWidth: '120px' },
    onClick: () => updateView({ id: servicesDetailId, detail: service.ID }),
    key: `dashboardTable-${service.ID}`,
    index: idx,
  }))

  // quick lookup for service index
  const serviceIndexMap = Object.fromEntries(
    serviceHeaders.map((h) => [h.id, h.index]),
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
          className="dataCol"
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
      const key = 'td' + node['ID'] + service['ID']

      dataCols.push(
        <td
          className={`align-middle svc-index-${idx}`}
          key={key}
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
        </td>,
      )
    }

    trows.push(
      <tr
        key={'tr' + node['ID']}
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
          id="dashboardTable"
          striped
          size={tableSize}
          role="table"
          aria-label="Docker Swarm Dashboard"
        >
          <thead role="rowgroup">
            {/* three header rows: fixed attributes span 3 rows, services distributed across rows */}
            <tr role="row">
              <th
                className="nodeAttribute"
                rowSpan={3}
                style={{ width: '250px', minWidth: '250px' }}
              >
                Node
              </th>
              <th
                className="nodeAttributeSmall"
                rowSpan={3}
                style={{ width: '120px', minWidth: '120px' }}
              >
                Role
              </th>
              <th
                className="nodeAttributeSmall"
                rowSpan={3}
                style={{ width: '120px', minWidth: '120px' }}
              >
                State
              </th>
              <th
                className="nodeAttributeSmall"
                rowSpan={3}
                style={{ width: '120px', minWidth: '120px' }}
              >
                Availability
              </th>
              <th
                className="nodeAttributeSmall"
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
                    className={`service-header row-${h.index % 3} dataCol svc-index-${h.index} svc-start-${h.index % 3} hdr-row-0 ${shifted.has(h.index) ? 'header-shift' : ''}`}
                    style={h.style}
                  >
                    <span className="service-name-text" title={h.name}>
                      {h.name}
                    </span>
                    {h.name && (
                      <>
                        <Button
                          className="name-open-btn me-1"
                          size="sm"
                          title={`Open service: ${h.name}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            updateView({ id: servicesDetailId, detail: h.id })
                          }}
                        >
                          <FontAwesomeIcon icon="search" />
                        </Button>
                        <Button
                          className="name-filter-btn"
                          size="sm"
                          title={`Filter service: ${h.name}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            setServiceFilterName(h.name || '')
                            setStackFilterName('')
                            setFilterType('service')
                          }}
                        >
                          <FontAwesomeIcon icon="filter" />
                        </Button>
                      </>
                    )}
                  </th>
                ) : (
                  <th
                    key={`ph-${h.key}`}
                    className={`dataCol svc-index-${h.index} svc-start-${h.index % 3} hdr-row-0`}
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
                    className={`service-header row-${h.index % 3} dataCol svc-index-${h.index} svc-start-${h.index % 3} hdr-row-1 ${shifted.has(h.index) ? 'header-shift' : ''}`}
                    style={h.style}
                  >
                    <span className="service-name-text" title={h.name}>
                      {h.name}
                    </span>
                    {h.name && (
                      <>
                        <Button
                          className="name-open-btn me-1"
                          size="sm"
                          title={`Open service: ${h.name}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            updateView({ id: servicesDetailId, detail: h.id })
                          }}
                        >
                          <FontAwesomeIcon icon="search" />
                        </Button>
                        <Button
                          className="name-filter-btn"
                          size="sm"
                          title={`Filter service: ${h.name}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            setServiceFilterName(h.name || '')
                            setStackFilterName('')
                            setFilterType('service')
                          }}
                        >
                          <FontAwesomeIcon icon="filter" />
                        </Button>
                      </>
                    )}
                  </th>
                ) : (
                  <th
                    key={`ph2-${h.key}`}
                    className={`dataCol svc-index-${h.index} svc-start-${h.index % 3} hdr-row-1`}
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
                    className={`service-header row-${h.index % 3} dataCol svc-index-${h.index} svc-start-${h.index % 3} hdr-row-2 ${shifted.has(h.index) ? 'header-shift' : ''}`}
                    style={h.style}
                  >
                    <span className="service-name-text" title={h.name}>
                      {h.name}
                    </span>
                    {h.name && (
                      <>
                        <Button
                          className="name-open-btn me-1"
                          size="sm"
                          title={`Open service: ${h.name}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            updateView({ id: servicesDetailId, detail: h.id })
                          }}
                        >
                          <FontAwesomeIcon icon="search" />
                        </Button>
                        <Button
                          className="name-filter-btn"
                          size="sm"
                          title={`Filter service: ${h.name}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            setServiceFilterName(h.name || '')
                            setStackFilterName('')
                            setFilterType('service')
                          }}
                        >
                          <FontAwesomeIcon icon="filter" />
                        </Button>
                      </>
                    )}
                  </th>
                ) : (
                  <th
                    key={`ph3-${h.key}`}
                    className={`dataCol svc-index-${h.index} svc-start-${h.index % 3} hdr-row-2`}
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
