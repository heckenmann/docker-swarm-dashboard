import React, { useState, useCallback } from 'react'
import PropTypes from 'prop-types'
import { useAtomValue } from 'jotai'
import { Table } from 'react-bootstrap'
import { tableSizeAtom } from '../../../common/store/atoms/uiAtoms'
import { currentVariantAtom } from '../../../common/store/atoms/themeAtoms'
import ResourceName from '../../shared/names/ResourceName'
import NetworkName from '../../shared/names/NetworkName'
import MetricCard from '../../shared/MetricCard.jsx'
import SortableHeader from '../../shared/SortableHeader.jsx'
import { sortData } from '../../../common/sortUtils'

/**
 * Show the resource references declared in a service's container specification.
 * @param {object} props - Component properties.
 * @param {string} props.kind - Configs, secrets, or networks.
 * @param {Array<object>} [props.references] - Docker resource mount references.
 * @param {Array<object>} [props.virtualIPs] - Observed service VIPs joined by network ID.
 * @param {Array<object>} [props.ports] - Service-wide published port mappings.
 * @returns {React.ReactElement} Resource links and declared mount metadata.
 */
const ServiceResourcesTab = ({
  kind,
  references = [],
  virtualIPs = [],
  ports = [],
}) => {
  const size = useAtomValue(tableSizeAtom)
  const variant = useAtomValue(currentVariantAtom)
  const isNetwork = kind === 'networks'
  const isConfig = kind === 'configs'
  const title = isNetwork ? 'Networks' : isConfig ? 'Configs' : 'Secrets'
  const [sortBy, setSortBy] = useState(null)
  const [sortDirection, setSortDirection] = useState('asc')
  const handleSort = useCallback(
    (column) => {
      let nextBy = column
      let nextDirection = 'asc'
      if (sortBy === column) {
        if (sortDirection === 'asc') nextDirection = 'desc'
        else nextBy = null
      }
      setSortBy(nextBy)
      setSortDirection(nextDirection)
    },
    [sortBy, sortDirection],
  )
  const resources = sortData(
    references.filter(Boolean).map((reference) => ({
      ...reference,
      id:
        (isNetwork
          ? reference.Target
          : isConfig
            ? reference.ConfigID
            : reference.SecretID) || '',
      aliases: (reference.Aliases || []).join(', '),
      ips: virtualIPs
        .filter((vip) => vip.NetworkID === reference.Target)
        .map((vip) => vip.Addr)
        .join(', '),
      portsText: ports
        .map(
          (port) =>
            `${port.PublishedPort || 'Dynamic'} → ${port.TargetPort}/${port.Protocol || 'tcp'} (${port.PublishMode || 'ingress'})`,
        )
        .join(', '),
      name:
        (isNetwork
          ? reference.Target
          : isConfig
            ? reference.ConfigName
            : reference.SecretName) ||
        (isConfig ? reference.ConfigID : reference.SecretID) ||
        'Unknown resource',
      target:
        isConfig && reference.Runtime
          ? 'Runtime target'
          : reference.File?.Name || '',
      uid: reference.File?.UID || '',
      gid: reference.File?.GID || '',
      mode: reference.File?.Mode,
    })),
    sortBy,
    sortDirection,
    { mode: 'number' },
  )
  return (
    <MetricCard
      title={`${title} in this Service`}
      icon={isNetwork ? 'network-wired' : isConfig ? 'file' : 'key'}
      noBody
    >
      <Table
        responsive
        striped
        bordered
        hover
        className="mb-0 align-middle"
        variant={variant}
        size={size}
      >
        <thead>
          <tr>
            {(isNetwork
              ? [
                  ['name', 'Network'],
                  ['aliases', 'Aliases'],
                  ['ips', 'Virtual IPs'],
                  ['portsText', 'Published ports (service)'],
                ]
              : [
                  ['name', 'Name'],
                  ['id', 'ID'],
                  ['target', 'Target'],
                  ['uid', 'UID'],
                  ['gid', 'GID'],
                  ['mode', 'Mode'],
                ]
            ).map(([column, label]) => (
              <SortableHeader
                key={column}
                column={column}
                label={label}
                sortBy={sortBy}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
            ))}
          </tr>
        </thead>
        <tbody>
          {resources.map((reference, index) => {
            const { id, name, target, uid, gid, mode } = reference
            if (isNetwork)
              return (
                <tr key={`${id}:${index}`}>
                  <td className="text-nowrap">
                    <NetworkName name={name} id={id} />
                  </td>
                  <td>{reference.aliases || '—'}</td>
                  <td className="font-monospace text-nowrap">
                    {reference.ips || '—'}
                  </td>
                  <td className="text-nowrap">{reference.portsText || '—'}</td>
                </tr>
              )
            return (
              <tr key={`${id}:${index}`}>
                <td className="text-nowrap">
                  <ResourceName name={name} id={id} kind={kind} />
                </td>
                <td className="font-monospace text-nowrap">{id || '—'}</td>
                <td className="font-monospace text-break">{target || '—'}</td>
                <td className="text-nowrap">{uid || '—'}</td>
                <td className="text-nowrap">{gid || '—'}</td>
                <td className="font-monospace text-nowrap">
                  {typeof mode === 'number'
                    ? mode.toString(8).padStart(4, '0')
                    : '—'}
                </td>
              </tr>
            )
          })}
          {!resources.length && (
            <tr>
              <td
                colSpan={isNetwork ? 4 : 6}
                className="text-center text-muted py-3"
              >
                No {kind} linked to this service.
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </MetricCard>
  )
}

ServiceResourcesTab.propTypes = {
  kind: PropTypes.oneOf(['configs', 'secrets', 'networks']).isRequired,
  references: PropTypes.arrayOf(PropTypes.object),
  virtualIPs: PropTypes.arrayOf(PropTypes.object),
  ports: PropTypes.arrayOf(PropTypes.object),
}
export default ServiceResourcesTab
