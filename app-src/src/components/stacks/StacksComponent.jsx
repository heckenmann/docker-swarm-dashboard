import React from 'react'
import { toDefaultDateTimeString } from '../../common/DefaultDateTimeFormat'
import { currentVariantAtom } from '../../common/store/atoms/themeAtoms'
import { stacksAtom } from '../../common/store/atoms/dashboardAtoms'
import {
  localeAtom,
  timeZoneAtom,
  serviceNameFilterAtom,
  stackNameFilterAtom,
  tableSizeAtom,
} from '../../common/store/atoms/uiAtoms'
import { useAtomValue } from 'jotai'
import { useState, useCallback } from 'react'

// UI & internal imports
import { Table } from 'react-bootstrap'
import StackName from '../shared/names/StackName'
import ServiceName from '../shared/names/ServiceName'
import FilterComponent from '../shared/FilterComponent'
import SortableHeader from '../shared/SortableHeader.jsx'
import { sortData } from '../../common/sortUtils'
import DSDCard from '../common/DSDCard.jsx'

/**
 * StacksComponent is a React functional component that renders a list of stacks.
 * Each stack contains a list of services, which are displayed in a table format.
 * The component uses various atoms from Jotai for state management and filtering.
 */
const StacksComponent = React.memo(function StacksComponent() {
  const currentVariant = useAtomValue(currentVariantAtom)
  const locale = useAtomValue(localeAtom)
  const timeZone = useAtomValue(timeZoneAtom)
  const serviceNameFilter = useAtomValue(serviceNameFilterAtom)
  const stackNameFilter = useAtomValue(stackNameFilterAtom)
  const stacksData = useAtomValue(stacksAtom)
  const _tableSize = useAtomValue(tableSizeAtom)

  // Shared sorting state for all stack tables
  const [sortBy, setSortBy] = useState(null)
  const [sortDirection, setSortDirection] = useState('asc')

  /**
   * Handle sorting - applies to all stack tables
   * Implements 3-click cycle: asc -> desc -> reset (null)
   * @param {string} column - The column name to sort by
   */
  const handleSort = useCallback(
    (column) => {
      let newSortBy = column
      let newSortDirection = 'asc'

      if (sortBy === column) {
        // Same column clicked
        if (sortDirection === 'asc') {
          // First click was asc, now go to desc
          newSortDirection = 'desc'
        } else {
          // Second click was desc, now reset (clear sort)
          newSortBy = null
          newSortDirection = 'asc'
        }
      }
      // else: Different column clicked, start with asc

      setSortBy(newSortBy)
      setSortDirection(newSortDirection)
    },
    [sortBy, sortDirection],
  )

  const createServicesForStack = (stack) => {
    const normalize = (s) =>
      (s || '').toString().toLowerCase().replace(/[-_]/g, '')
    const fname = normalize(serviceNameFilter)

    // Filter services
    const filteredServices = stack['Services'].filter((service) => {
      if (!serviceNameFilter) return true
      const shortName = normalize(service['ShortName'] || '')
      const fullName = normalize(service['ServiceName'] || '')
      return shortName.includes(fname) || fullName.includes(fname)
    })

    // Prepare services with sortable fields
    const servicesWithSortableFields = filteredServices.map((service) => ({
      ...service,
      ServiceNameSortable: service['ShortName'] || service['ServiceName'] || '',
      ReplicationSortable: service['Replication'] || 0,
      CreatedSortable: service['Created'] || '',
      UpdatedSortable: service['Updated'] || '',
    }))

    // Define column types for proper sorting
    const columnTypes = {
      ServiceNameSortable: 'string',
      ReplicationSortable: 'number',
      CreatedSortable: 'date',
      UpdatedSortable: 'date',
    }

    // Sort the services using shared sorting state
    const sortedServices = sortData(
      servicesWithSortableFields,
      sortBy,
      sortDirection,
      columnTypes,
    )

    return sortedServices.map((service) => (
      <tr key={service['ID']}>
        <td className="text-nowrap">
          <ServiceName
            name={
              service['ShortName']
                ? service['ShortName']
                : service['ServiceName']
            }
            id={service['ID']}
          />
        </td>
        <td>{service['Replication']}</td>
        <td>
          {toDefaultDateTimeString(
            new Date(service['Created']),
            locale,
            timeZone,
          )}
        </td>
        <td>
          {toDefaultDateTimeString(
            new Date(service['Updated']),
            locale,
            timeZone,
          )}
        </td>
      </tr>
    ))
  }
  const stacks = stacksData
    .filter((stack) =>
      stackNameFilter ? stack['Name'].includes(stackNameFilter) : true,
    )
    .filter((stack) => createServicesForStack(stack).length > 0)
    .map((stack) => (
      <DSDCard
        icon="cubes"
        title={<StackName name={stack['Name']} />}
        body={
          <Table variant={currentVariant} size="sm" hover>
            <thead>
              <tr>
                <SortableHeader
                  column="ServiceNameSortable"
                  label="Service Name"
                  sortBy={sortBy}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <SortableHeader
                  column="ReplicationSortable"
                  label="Replication"
                  sortBy={sortBy}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                  className="col-md-1"
                />
                <SortableHeader
                  column="CreatedSortable"
                  label="Created"
                  sortBy={sortBy}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                  className="col-md-2"
                />
                <SortableHeader
                  column="UpdatedSortable"
                  label="Updated"
                  sortBy={sortBy}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                  className="col-md-2"
                />
              </tr>
            </thead>
            <tbody>{createServicesForStack(stack)}</tbody>
          </Table>
        }
        key={'card_' + stack['Name']}
      />
    ))

  return (
    <>
      <DSDCard
        icon="cubes"
        title="Stacks"
        headerActions={<FilterComponent />}
      />
      {stacks}
    </>
  )
})

export default StacksComponent
