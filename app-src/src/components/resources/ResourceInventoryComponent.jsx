import React, { useState, useCallback } from 'react'
import PropTypes from 'prop-types'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { Alert, Button, Table } from 'react-bootstrap'
import { loadable } from '../../common/store/loadable'
import {
  configsAtom,
  secretsAtom,
} from '../../common/store/atoms/dashboardAtoms'
import { viewAtom } from '../../common/store/atoms/navigationAtoms'
import {
  localeAtom,
  timeZoneAtom,
  tableSizeAtom,
  stackNameFilterAtom,
} from '../../common/store/atoms/uiAtoms'
import { stacksId } from '../../common/navigationConstants'
import ResourceName from '../shared/names/ResourceName'
import { toDefaultDateTimeString } from '../../common/DefaultDateTimeFormat'
import DSDCard from '../common/DSDCard'
import SortableHeader from '../shared/SortableHeader.jsx'
import { sortData } from '../../common/sortUtils'
import { currentVariantAtom } from '../../common/store/atoms/themeAtoms'

const configsLoadable = loadable(configsAtom, true)
const secretsLoadable = loadable(secretsAtom, true)

/**
 * Display a resource inventory with links to dedicated detail pages.
 * @param {object} props - Component properties.
 * @param {string} props.kind - Configs or secrets inventory.
 * @returns {React.ReactElement} Resource inventory.
 */
const ResourceInventoryComponent = ({ kind }) => {
  const result = useAtomValue(
    kind === 'configs' ? configsLoadable : secretsLoadable,
  )
  const [, setView] = useAtom(viewAtom)
  const setStackFilter = useSetAtom(stackNameFilterAtom)
  const size = useAtomValue(tableSizeAtom)
  const variant = useAtomValue(currentVariantAtom)
  const locale = useAtomValue(localeAtom)
  const timeZone = useAtomValue(timeZoneAtom)
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
  const title = kind === 'configs' ? 'Configs' : 'Secrets'
  if (result.state === 'hasError')
    return (
      <Alert variant="danger">Failed to load {kind}. Refresh to retry.</Alert>
    )
  if (result.state !== 'hasData') return <p role="status">Loading {kind}…</p>
  const data = result.data
  const resources = data.resources
  const date = (value) => toDefaultDateTimeString(value, locale, timeZone)
  const stackLink = (value) =>
    value ? (
      <Button
        variant="link"
        size="sm"
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
  const sortedResources = sortData(
    resources.map((resource) => ({
      ...resource,
      displayName: resource.name || resource.id,
    })),
    sortBy,
    sortDirection,
    { created: 'date', updated: 'date' },
  )
  return (
    <>
      {!data.usageKnown && (
        <Alert variant="warning">
          {data.message || 'Service usage is unknown.'}
        </Alert>
      )}
      <DSDCard title={title} icon={kind === 'configs' ? 'file' : 'key'}>
        <>
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
                  ['displayName', 'Name'],
                  ['id', 'ID'],
                  ['stack', 'Stack'],
                  ['created', 'Created'],
                  ['updated', 'Updated'],
                  ['usage', 'Usage'],
                ].map(([column, label]) => (
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
              {sortedResources.map((resource) => (
                <tr key={resource.id}>
                  <td className="text-nowrap">
                    <ResourceName
                      name={resource.name || resource.id}
                      id={resource.id}
                      kind={kind}
                    />
                  </td>
                  <td className="font-monospace text-nowrap">{resource.id}</td>
                  <td>{stackLink(resource.stack)}</td>
                  <td className="text-nowrap">
                    {resource.missing ? '—' : date(resource.created)}
                  </td>
                  <td className="text-nowrap">
                    {resource.missing ? '—' : date(resource.updated)}
                  </td>
                  <td>
                    {resource.usage}
                    {resource.usage === 'unreferenced' &&
                      ' — cleanup candidate'}
                    {resource.missing && ' — missing resource'}
                  </td>
                </tr>
              ))}
              {!resources.length && (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-3">
                    No {kind}.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </>
      </DSDCard>
    </>
  )
}
ResourceInventoryComponent.propTypes = {
  kind: PropTypes.oneOf(['configs', 'secrets']).isRequired,
}
export default ResourceInventoryComponent
