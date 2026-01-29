import { toDefaultDateTimeString } from '../common/DefaultDateTimeFormat'
import {
  currentVariantAtom,
  currentVariantClassesAtom,
  stacksAtom,
  dashboardSettingsAtom,
  serviceNameFilterAtom,
  stackNameFilterAtom,
} from '../common/store/atoms'
import { useAtomValue } from 'jotai'
import { useState, useCallback } from 'react'

// UI & internal imports
import { Card, Table } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { StackName } from './names/StackName'
import { ServiceName } from './names/ServiceName'
import { FilterComponent } from './FilterComponent'
import { SortableHeader } from './SortableHeader'
import { sortData } from '../common/sortUtils'

/**
 * StacksComponent is a React functional component that renders a list of stacks.
 * Each stack contains a list of services, which are displayed in a table format.
 * The component uses various atoms from Jotai for state management and filtering.
 */
function StacksComponent() {
  const currentVariant = useAtomValue(currentVariantAtom)
  const currentVariantClasses = useAtomValue(currentVariantClassesAtom)
  const dashBoardSettings = useAtomValue(dashboardSettingsAtom)
  const serviceNameFilter = useAtomValue(serviceNameFilterAtom)
  const stackNameFilter = useAtomValue(stackNameFilterAtom)
  const stacksData = useAtomValue(stacksAtom)

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
            dashBoardSettings.locale,
            dashBoardSettings.timeZone,
          )}
        </td>
        <td>
          {toDefaultDateTimeString(
            new Date(service['Updated']),
            dashBoardSettings.locale,
            dashBoardSettings.timeZone,
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
      <Card
        bg={currentVariant}
        className={currentVariantClasses + ' mb-3'}
        key={'card_' + stack['Name']}
      >
        <Card.Header>
          <h5>
            <FontAwesomeIcon icon="cubes" />
            <StackName name={stack['Name']} />
          </h5>
        </Card.Header>
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
      </Card>
    ))

  return (
    <>
      <Card className={currentVariantClasses + ' mb-3'} key={'card_filter'}>
        <Card.Header>
          <FilterComponent />
        </Card.Header>
      </Card>
      {stacks}
    </>
  )
}

export { StacksComponent }
