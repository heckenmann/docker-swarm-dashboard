import React, { useState, useCallback } from 'react'
import PropTypes from 'prop-types'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { Alert, Button, Table, Row, Col } from 'react-bootstrap'
import { loadable } from '../../common/store/loadable'
import {
  configDetailAtom,
  secretDetailAtom,
} from '../../common/store/atoms/dashboardAtoms'
import { viewAtom } from '../../common/store/atoms/navigationAtoms'
import {
  localeAtom,
  timeZoneAtom,
  tableSizeAtom,
  stackNameFilterAtom,
} from '../../common/store/atoms/uiAtoms'
import { stacksId } from '../../common/navigationConstants'
import { toDefaultDateTimeString } from '../../common/DefaultDateTimeFormat'
import DSDCard from '../common/DSDCard'
import CodeField from '../shared/CodeField.jsx'
import ServiceName from '../shared/names/ServiceName'
import SortableHeader from '../shared/SortableHeader.jsx'
import { sortData } from '../../common/sortUtils'
import { currentVariantAtom } from '../../common/store/atoms/themeAtoms'

const configLoadable = loadable(configDetailAtom, true)
const secretLoadable = loadable(secretDetailAtom, true)

/**
 * Display one resource on a dedicated detail page.
 * @param {object} props - Component properties.
 * @param {string} props.kind - Configs or secrets.
 * @returns {React.ReactElement} Resource details and consuming services.
 */
const DetailsResourceComponent = ({ kind }) => {
  const detail = useAtomValue(
    kind === 'configs' ? configLoadable : secretLoadable,
  )
  const [view, setView] = useAtom(viewAtom)
  const setStackFilter = useSetAtom(stackNameFilterAtom)
  const size = useAtomValue(tableSizeAtom)
  const variant = useAtomValue(currentVariantAtom)
  const locale = useAtomValue(localeAtom)
  const timeZone = useAtomValue(timeZoneAtom)
  const [consumerSortBy, setConsumerSortBy] = useState(null)
  const [consumerSortDirection, setConsumerSortDirection] = useState('asc')
  const handleConsumerSort = useCallback(
    (column) => {
      let nextBy = column
      let nextDirection = 'asc'
      if (consumerSortBy === column) {
        if (consumerSortDirection === 'asc') nextDirection = 'desc'
        else nextBy = null
      }
      setConsumerSortBy(nextBy)
      setConsumerSortDirection(nextDirection)
    },
    [consumerSortBy, consumerSortDirection],
  )
  if (detail.state === 'loading')
    return <p role="status">Loading resource details…</p>
  if (detail.state === 'hasError')
    return (
      <Alert variant="danger">
        Failed to load resource details. Refresh to retry.
      </Alert>
    )
  const selected = detail.data
  if (selected && selected.id !== view?.detail)
    return <p role="status">Loading resource details…</p>
  if (!selected)
    return (
      <>
        <Alert variant="warning">
          This resource is no longer in the inventory.
        </Alert>
      </>
    )
  const date = (value) => toDefaultDateTimeString(value, locale, timeZone)
  const stackLink = (value) =>
    value ? (
      <Button
        size="sm"
        variant="link"
        onClick={() => {
          setStackFilter(value)
          setView({ id: stacksId })
        }}
      >
        {value}
      </Button>
    ) : (
      '—'
    )
  const sortedConsumers = sortData(
    selected.consumers,
    consumerSortBy,
    consumerSortDirection,
    { mode: 'string' },
  )
  return (
    <>
      <DSDCard
        title={`${kind === 'configs' ? 'Config' : 'Secret'} "${selected.name || selected.id}"`}
        icon={kind === 'configs' ? 'file' : 'key'}
        body={
          <>
            <Row className="g-3">
              <Col md={6} xl={4}>
                <div className="small text-muted">ID</div>
                <code className="text-break">{selected.id}</code>
              </Col>
              <Col md={6} xl={2}>
                <div className="small text-muted">Version</div>
                <span>{selected.version ?? '—'}</span>
              </Col>
              <Col md={6} xl={3}>
                <div className="small text-muted">Created</div>
                <span>{selected.missing ? '—' : date(selected.created)}</span>
              </Col>
              <Col md={6} xl={3}>
                <div className="small text-muted">Updated</div>
                <span>{selected.missing ? '—' : date(selected.updated)}</span>
              </Col>
              <Col md={6}>
                <div className="small text-muted">Stack</div>
                {stackLink(selected.stack)}
              </Col>
              <Col md={6}>
                <div className="small text-muted">Usage</div>
                <span>
                  {selected.usage}
                  {selected.usage === 'unreferenced' && ' — cleanup candidate'}
                </span>
              </Col>
            </Row>
            {selected.missing && (
              <Alert variant="warning">
                Referenced resource was not returned by Docker. The inventory
                may have changed during refresh.
              </Alert>
            )}
          </>
        }
      />

      <DSDCard title="Labels" icon="tags">
        {Object.keys(selected.labels || {}).length ? (
          <dl className="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-0 mb-0">
            {Object.entries(selected.labels).map(([key, value]) => (
              <div key={key} className="col p-3 border-bottom">
                <dt className="small text-muted fw-normal text-break mb-1">
                  {key}
                </dt>
                <dd className="text-break mb-0">
                  <code className="text-body">{value || '—'}</code>
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="m-3 text-muted">No labels.</p>
        )}
      </DSDCard>
      <DSDCard title="Consuming services and mounts" icon="folder">
        <Table
          responsive
          striped
          bordered
          hover
          variant={variant}
          className="mb-0 align-middle"
          size={size}
        >
          <thead>
            <tr>
              {[
                ['serviceName', 'Service'],
                ['stack', 'Stack'],
                ['target', 'Target'],
                ['uid', 'UID'],
                ['gid', 'GID'],
                ['mode', 'Mode'],
              ].map(([column, label]) => (
                <SortableHeader
                  key={column}
                  column={column}
                  label={label}
                  sortBy={consumerSortBy}
                  sortDirection={consumerSortDirection}
                  onSort={handleConsumerSort}
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedConsumers.map((consumer, index) => (
              <tr key={consumer.serviceId + ':' + index}>
                <td>
                  <ServiceName
                    name={consumer.serviceName}
                    id={consumer.serviceId}
                  />
                </td>
                <td>{stackLink(consumer.stack)}</td>
                <td className="font-monospace text-break">
                  {consumer.runtime ? 'Runtime target' : consumer.target || '—'}
                </td>
                <td className="text-nowrap">{consumer.uid || '—'}</td>
                <td className="text-nowrap">{consumer.gid || '—'}</td>
                <td className="font-monospace text-nowrap">
                  {consumer.mode || '—'}
                </td>
              </tr>
            ))}
            {!selected.consumers.length && (
              <tr>
                <td colSpan={6} className="text-center text-muted py-3">
                  {selected.usage !== 'unknown'
                    ? 'No consuming services.'
                    : 'Consuming services are unknown.'}
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </DSDCard>
      {kind === 'configs' && (
        <DSDCard
          title="Config content"
          icon="code"
          body={
            <section aria-label="Config content">
              {selected.content && (
                <>
                  {selected.content.status === 'hidden' && (
                    <p>
                      Content is hidden. Set DSD_HIDE_CONFIG_CONTENT=false on
                      the server to display it.
                    </p>
                  )}
                  {selected.content.status === 'unavailable' && (
                    <Alert variant="warning">{selected.content.message}</Alert>
                  )}
                  {selected.content.status === 'available' && (
                    <>
                      {selected.content.encoding === 'base64' && (
                        <p>Binary content (Base64)</p>
                      )}
                      <CodeField
                        key={selected.id}
                        value={selected.content.value}
                        binary={selected.content.encoding === 'base64'}
                      />
                      {selected.content.value === '' && (
                        <p>This config is empty.</p>
                      )}
                    </>
                  )}
                </>
              )}
            </section>
          }
        />
      )}
    </>
  )
}
DetailsResourceComponent.propTypes = {
  kind: PropTypes.oneOf(['configs', 'secrets']).isRequired,
}
export default DetailsResourceComponent
