import React from 'react'
import { useAtom, useAtomValue } from 'jotai'
import { Table } from 'react-bootstrap'
import {
  currentVariantAtom,
  isDarkModeAtom,
} from '../../common/store/atoms/themeAtoms'
import { dashboardSettingsAtom } from '../../common/store/atoms/foundationAtoms'
import { dashboardVAtom } from '../../common/store/atoms/dashboardAtoms'
import {
  serviceNameFilterAtom,
  stackNameFilterAtom,
  tableSizeAtom,
} from '../../common/store/atoms/uiAtoms'
import { viewAtom } from '../../common/store/atoms/navigationAtoms'
import { serviceFilter } from '../../common/utils'
import DSDCard from '../common/DSDCard'
import NodeName from '../shared/names/NodeName'
import ServiceName from '../shared/names/ServiceName'
import StackName from '../shared/names/StackName'
import ServiceStatusBadge from '../services/ServiceStatusBadge.jsx'
import DashboardSettingsComponent from './DashboardSettingsComponent'
import { tasksDetailId } from '../../common/navigationConstants'
import './Dashboard.css'

/**
 * DashboardVerticalComponent is a React functional component that renders
 * a vertical dashboard table with nodes and services information.
 */
const DashboardVerticalComponent = React.memo(
  function DashboardVerticalComponent() {
    const isDarkMode = useAtomValue(isDarkModeAtom)
    const currentVariant = useAtomValue(currentVariantAtom)
    const tableSize = useAtomValue(tableSizeAtom)
    const dashboardSettings = useAtomValue(dashboardSettingsAtom)
    const serviceNameFilter = useAtomValue(serviceNameFilterAtom)
    const stackNameFilter = useAtomValue(stackNameFilterAtom)
    const [, setView] = useAtom(viewAtom)

    const dashboardvData = useAtomValue(dashboardVAtom) || {}
    const nodes = dashboardvData['Nodes'] || []
    const services = dashboardvData['Services'] || []

    const theads = []
    const trows = []

    // Header Columns
    if (nodes.length > 0) {
      nodes.forEach((node, idx) => {
        const isLast = idx === nodes.length - 1
        theads.push(
          <th
            key={'dashboardTable-' + (node?.ID || idx)}
            className="service-header data-col"
            style={
              isLast ? { width: 'auto' } : { width: '120px', minWidth: '120px' }
            }
            colSpan={isLast ? 2 : 1}
          >
            <div className="service-name-container">
              <NodeName
                name={node?.Hostname || 'Unknown'}
                id={node?.ID}
                showFilter={false}
                nameClass="service-name-text"
              />
            </div>
          </th>,
        )
      })
    } else {
      theads.push(<th key="fill-col-empty" className="fill-col" />)
    }

    // Data Rows
    services
      .filter((service) =>
        serviceFilter(service, serviceNameFilter, stackNameFilter),
      )
      .forEach((service) => {
        const dataCols = nodes.map((node, idx) => (
          <td
            className={`align-middle svc-index-${idx}`}
            key={
              'td-' +
              (node && node.ID ? String(node.ID) : `node-${idx}`) +
              '-' +
              (service && service.ID ? String(service.ID) : 'service-unknown')
            }
            style={{ width: '120px', minWidth: '120px' }}
          >
            {service?.Tasks?.[node?.ID] && (
              <ul className="list-unstyled mb-0">
                {service?.Tasks?.[node?.ID].map((task, id) => (
                  <li
                    key={
                      'badge-' +
                      (task?.NodeID || 'no-node') +
                      '-' +
                      (task?.ID || id) +
                      '-' +
                      (task?.Status?.State || 'no-state')
                    }
                    style={{ cursor: 'pointer' }}
                    onClick={() =>
                      setView({
                        id: tasksDetailId,
                        detail: task.ID,
                        timestamp: Date.now(),
                      })
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setView({
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
                      hiddenStates={
                        dashboardSettings?.hiddenServiceStates || []
                      }
                    />
                  </li>
                ))}
              </ul>
            )}
          </td>
        ))

        trows.push(
          <tr key={'tr-' + (service?.ID || service?.Name)}>
            <td className="align-middle">
              <ServiceName name={service?.Name} id={service?.ID} />
            </td>
            <td className="align-middle stack-column">
              <StackName name={service?.Stack} />
            </td>
            <td className="align-middle">{service?.Replication}</td>
            {dataCols}
            <td className="fill-col" />
          </tr>,
        )
      })

    return (
      <DSDCard
        icon="grip-vertical"
        title="Dashboard"
        headerActions={<DashboardSettingsComponent />}
        bodyClassName="p-0"
        body={
          <div className="table-responsive">
            <Table
              variant={isDarkMode ? currentVariant : null}
              id="dashboardTable"
              key="dashboardTable"
              className="dashboard-table vertical-dashboard"
              striped
              size={tableSize}
              role="table"
              aria-label="Docker Swarm Dashboard (vertical)"
            >
              <colgroup>
                <col className="service-col-v" />
                <col className="stack-column" />
                <col style={{ width: '120px', minWidth: '120px' }} />
                {nodes.map((node, idx) => (
                  <col
                    key={`col-${node?.ID || idx}`}
                    style={{ width: '120px', minWidth: '120px' }}
                  />
                ))}
                <col className="fill-col" />
              </colgroup>
              <thead role="rowgroup">
                <tr role="row">
                  <th className="service-col-v">Service</th>
                  <th className="stack-column">Stack</th>
                  <th style={{ width: '120px', minWidth: '120px' }}>
                    Replication
                  </th>
                  {theads}
                </tr>
              </thead>
              <tbody>{trows}</tbody>
            </Table>
          </div>
        }
      />
    )
  },
)

export default DashboardVerticalComponent
