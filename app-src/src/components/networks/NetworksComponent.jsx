import React, { useState, useCallback } from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import { Alert, Table, Row, Col, Badge } from 'react-bootstrap'
import { loadable } from '../../common/store/loadable'
import {
  networksAtom,
  networkDetailAtom,
} from '../../common/store/atoms/dashboardAtoms'
import { viewAtom } from '../../common/store/atoms/navigationAtoms'
import {
  tableSizeAtom,
  stackNameFilterAtom,
  serviceNameFilterAtom,
  filterTypeAtom,
  localeAtom,
  timeZoneAtom,
} from '../../common/store/atoms/uiAtoms'
import { currentVariantAtom } from '../../common/store/atoms/themeAtoms'
import {
  networksDetailId,
  stacksId,
  portsId,
} from '../../common/navigationConstants'
import { toDefaultDateTimeString } from '../../common/DefaultDateTimeFormat'
import NetworkName from '../shared/names/NetworkName'
import ServiceName from '../shared/names/ServiceName'
import EntityName from '../shared/names/EntityName'
import DSDCard from '../common/DSDCard'
import SortableHeader from '../shared/SortableHeader.jsx'
import MetricCard from '../shared/MetricCard.jsx'
import { sortData } from '../../common/sortUtils'

const inventoryLoadable = loadable(networksAtom, true)
const detailLoadable = loadable(networkDetailAtom, true)

/**
 * Display network configuration using the shared inventory and entity patterns.
 * @returns {React.ReactElement} Network inventory or selected detail.
 */
export default function NetworksComponent() {
  const view = useAtomValue(viewAtom)
  const setView = useSetAtom(viewAtom)
  const setStack = useSetAtom(stackNameFilterAtom)
  const setService = useSetAtom(serviceNameFilterAtom)
  const setFilterType = useSetAtom(filterTypeAtom)
  const detail = view?.id === networksDetailId
  const result = useAtomValue(detail ? detailLoadable : inventoryLoadable)
  const size = useAtomValue(tableSizeAtom)
  const variant = useAtomValue(currentVariantAtom)
  const locale = useAtomValue(localeAtom)
  const timeZone = useAtomValue(timeZoneAtom)
  // Each table retains its own three-click sort cycle.
  const [sorts, setSorts] = useState({})
  const handleSort = useCallback((table, column) => {
    setSorts((previous) => {
      const current = previous[table] || {}
      const repeated = current.column === column
      return {
        ...previous,
        [table]: {
          column: repeated && current.direction === 'desc' ? null : column,
          direction: repeated && current.direction === 'asc' ? 'desc' : 'asc',
        },
      }
    })
  }, [])
  const sorted = (table, rows, types = {}) =>
    sortData(
      rows,
      sorts[table]?.column,
      sorts[table]?.direction || 'asc',
      types,
    )
  const headers = (table, columns) => (
    <tr>
      {columns.map(([column, label]) => (
        <SortableHeader
          key={column}
          column={column}
          label={label}
          sortBy={sorts[table]?.column || null}
          sortDirection={sorts[table]?.direction || 'asc'}
          onSort={(column) => handleSort(table, column)}
        />
      ))}
    </tr>
  )
  const tableProps = {
    responsive: true,
    striped: true,
    bordered: true,
    hover: true,
    size,
    variant,
    className: 'mb-0 align-middle',
  }
  const empty = (columns, message) => (
    <tr>
      <td colSpan={columns} className="text-center text-body-secondary py-3">
        {message}
      </td>
    </tr>
  )
  const date = (value) =>
    value && !value.startsWith('0001-')
      ? toDefaultDateTimeString(value, locale, timeZone)
      : '—'
  const flag = (value) =>
    typeof value === 'boolean' ? (value ? 'Yes' : 'No') : 'Unknown'
  const stackName = (value) =>
    value ? (
      <EntityName
        name={value}
        entityType="stack"
        showOpen={false}
        showFilter
        onFilter={(name) => {
          setStack(name)
          setService('')
          setFilterType('stack')
          setView({ id: stacksId })
        }}
      />
    ) : (
      '—'
    )
  if (result.state === 'hasError')
    return (
      <Alert variant="danger">Failed to load networks. Refresh to retry.</Alert>
    )
  if (result.state !== 'hasData') return <p role="status">Loading networks…</p>
  const data = result.data
  if (detail && data && data.network.Id !== view.detail)
    return <p role="status">Loading network details…</p>
  if (!data)
    return (
      <Alert variant="warning">
        This network is no longer in the inventory.
      </Alert>
    )
  const network = data.network
  const entries = detail
    ? []
    : data.networks.map((entry) => ({
        ...entry,
        ...entry.network,
        stack: entry.network.Labels?.['com.docker.stack.namespace'] || '',
        serviceCount: entry.services.length,
      }))
  return (
    <>
      {!detail ? (
        <DSDCard
          title="Networks"
          headerClassName="flex-wrap gap-2"
          icon="network-wired"
        >
          <Table {...tableProps} aria-label="Networks">
            <thead>
              {headers('networks', [
                ['Name', 'Name'],
                ['Id', 'ID'],
                ['Driver', 'Driver'],
                ['Scope', 'Scope'],
                ['stack', 'Stack'],
                ['Ingress', 'Ingress'],
                ['Internal', 'Internal'],
                ['Attachable', 'Attachable'],
                ['serviceCount', 'Services'],
                ['Created', 'Created'],
              ])}
            </thead>
            <tbody>
              {sorted('networks', entries, {
                serviceCount: 'number',
                Created: 'date',
              }).map((entry) => (
                <tr key={entry.Id}>
                  <td className="text-nowrap">
                    <NetworkName name={entry.Name || entry.Id} id={entry.Id} />
                    {entry.missing && (
                      <Badge bg="warning" text="dark" className="ms-2">
                        Missing
                      </Badge>
                    )}
                  </td>
                  <td className="font-monospace text-nowrap">{entry.Id}</td>
                  <td>{entry.Driver || '—'}</td>
                  <td>{entry.Scope || '—'}</td>
                  <td className="text-nowrap">{stackName(entry.stack)}</td>
                  {['Ingress', 'Internal', 'Attachable'].map((key) => (
                    <td key={key} className="text-nowrap">
                      {entry.missing ? 'Unknown' : flag(entry[key])}
                    </td>
                  ))}
                  <td className="text-end">{entry.serviceCount}</td>
                  <td className="text-nowrap">{date(entry.Created)}</td>
                </tr>
              ))}
              {!entries.length && empty(10, 'No networks.')}
            </tbody>
          </Table>
        </DSDCard>
      ) : (
        <>
          <DSDCard
            title={`Network "${network.Name || network.Id}"`}
            icon="network-wired"
            body={
              <>
                <Row className="g-3">
                  {[
                    [
                      'ID',
                      <code className="text-break" key="id">
                        {network.Id}
                      </code>,
                    ],
                    ['Driver', network.Driver || '—'],
                    ['Scope', network.Scope || '—'],
                    [
                      'Stack',
                      stackName(network.Labels?.['com.docker.stack.namespace']),
                    ],
                    ['Created', date(network.Created)],
                    ...['Ingress', 'Internal', 'Attachable'].map((key) => [
                      key,
                      data.missing ? 'Unknown' : flag(network[key]),
                    ]),
                    [
                      'Encryption',
                      Object.hasOwn(network.Options || {}, 'encrypted')
                        ? 'Configured'
                        : 'Not reported',
                    ],
                  ].map(([label, value]) => (
                    <Col xs={label === 'ID' ? 12 : 6} md={6} xl={4} key={label}>
                      <div className="small text-body-secondary">{label}</div>
                      {value}
                    </Col>
                  ))}
                </Row>
                {data.missing && (
                  <Alert variant="warning" className="mt-3 mb-0">
                    Docker did not return this referenced network. It may have
                    been deleted during refresh. Configuration is unavailable or
                    from the last list observation.
                  </Alert>
                )}
              </>
            }
          />

          <DSDCard title="Associated services" icon="folder">
            <Table {...tableProps} aria-label="Associated services">
              <thead>
                {headers('services', [
                  ['name', 'Service'],
                  ['stack', 'Stack'],
                  ['aliasesText', 'Aliases'],
                  ['endpointMode', 'Endpoint mode'],
                  ['virtualIPsText', 'Virtual IPs'],
                  ['portsText', 'Published ports'],
                ])}
              </thead>
              <tbody>
                {sorted(
                  'services',
                  data.services.map((service) => ({
                    ...service,
                    aliasesText: service.aliases.join(', '),
                    virtualIPsText: service.virtualIPs.join(', '),
                    portsText: service.ports
                      .map(
                        (port) =>
                          `${port.PublishedPort || 'Dynamic'} → ${port.TargetPort}/${port.Protocol || 'tcp'} (${port.PublishMode || 'ingress'})`,
                      )
                      .join(', '),
                  })),
                ).map((service) => (
                  <tr key={service.id}>
                    <td className="text-nowrap">
                      <ServiceName id={service.id} name={service.name} />
                    </td>
                    <td className="text-nowrap">{stackName(service.stack)}</td>
                    <td>{service.aliasesText || '—'}</td>
                    <td>{service.endpointMode || '—'}</td>
                    <td className="font-monospace text-nowrap">
                      {service.virtualIPsText || '—'}
                    </td>
                    <td>
                      {service.ports.length ? (
                        <EntityName
                          name={service.portsText}
                          id={service.id}
                          entityType="ports"
                          showFilter={false}
                          onOpen={() => {
                            setService(service.name)
                            setStack('')
                            setFilterType('service')
                            setView({ id: portsId })
                          }}
                        />
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
                {!data.services.length &&
                  empty(6, 'No associated service specifications.')}
              </tbody>
            </Table>
          </DSDCard>
          <DSDCard title="IP address management" icon="network-wired">
            <Table {...tableProps} aria-label="IP address management">
              <thead>
                {headers('ipam', [
                  ['Subnet', 'Subnet'],
                  ['Gateway', 'Gateway'],
                  ['IPRange', 'IP range'],
                ])}
              </thead>
              <tbody>
                {sorted('ipam', network.IPAM?.Config || []).map(
                  (config, index) => (
                    <tr key={index}>
                      <td className="font-monospace">{config.Subnet || '—'}</td>
                      <td className="font-monospace">
                        {config.Gateway || '—'}
                      </td>
                      <td className="font-monospace">
                        {config.IPRange || '—'}
                      </td>
                    </tr>
                  ),
                )}
                {!network.IPAM?.Config?.length &&
                  empty(3, 'IPAM subnets and gateways are not reported.')}
              </tbody>
            </Table>
          </DSDCard>

          <Row>
            {[
              ['Options', 'network-wired', network.Options],
              ['Labels', 'tags', network.Labels],
              ['IPAM options', 'network-wired', network.IPAM?.Options],
            ].map(([title, icon, values]) => (
              <Col xl={4} key={title}>
                <DSDCard title={title} icon={icon}>
                  <Table {...tableProps} aria-label={title}>
                    <thead>
                      {headers(title, [
                        ['key', 'Key'],
                        ['value', 'Value'],
                      ])}
                    </thead>
                    <tbody>
                      {sorted(
                        title,
                        Object.entries(values || {}).map(([key, value]) => ({
                          key,
                          value,
                        })),
                      ).map(({ key, value }) => (
                        <tr key={key}>
                          <td className="text-break">{key}</td>
                          <td className="text-break">{value || '(empty)'}</td>
                        </tr>
                      ))}
                      {!Object.keys(values || {}).length &&
                        empty(2, 'Not reported.')}
                    </tbody>
                  </Table>
                </DSDCard>
              </Col>
            ))}
          </Row>
          <Row>
            <Col xl={8}>
              <DSDCard title="Daemon-local endpoints" icon="network-wired">
                <Table {...tableProps} aria-label="Daemon-local endpoints">
                  <thead>
                    {headers('endpoints', [
                      ['Name', 'Name'],
                      ['IPv4Address', 'IPv4 address'],
                      ['IPv6Address', 'IPv6 address'],
                      ['MacAddress', 'MAC address'],
                      ['EndpointID', 'Endpoint ID'],
                    ])}
                  </thead>
                  <tbody>
                    {sorted(
                      'endpoints',
                      Object.values(network.Containers || {}),
                    ).map((endpoint, index) => (
                      <tr key={endpoint.EndpointID || index}>
                        <td className="text-nowrap">{endpoint.Name || '—'}</td>
                        {[
                          'IPv4Address',
                          'IPv6Address',
                          'MacAddress',
                          'EndpointID',
                        ].map((key) => (
                          <td className="font-monospace text-nowrap" key={key}>
                            {endpoint[key] || '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {!Object.keys(network.Containers || {}).length &&
                      empty(
                        5,
                        'No daemon-local endpoints reported; remote endpoints may be absent.',
                      )}
                  </tbody>
                </Table>
              </DSDCard>
            </Col>
            <Col xl={4}>
              <DSDCard title="Observed peers" icon="network-wired">
                <Table {...tableProps} aria-label="Observed peers">
                  <thead>
                    {headers('peers', [
                      ['Name', 'Name'],
                      ['IP', 'IP address'],
                    ])}
                  </thead>
                  <tbody>
                    {sorted('peers', network.Peers || []).map((peer, index) => (
                      <tr key={peer.Name || index}>
                        <td>{peer.Name || '—'}</td>
                        <td className="font-monospace">{peer.IP || '—'}</td>
                      </tr>
                    ))}
                    {!network.Peers?.length &&
                      empty(2, 'No peers reported by this Docker daemon.')}
                  </tbody>
                </Table>
              </DSDCard>
            </Col>
          </Row>
          <MetricCard title="Raw JSON" icon="code" className="mb-3">
            <pre
              style={{
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
                fontSize: 12,
              }}
              className="mb-0"
            >
              <code>{JSON.stringify(data, null, '\t')}</code>
            </pre>
          </MetricCard>
        </>
      )}
    </>
  )
}
