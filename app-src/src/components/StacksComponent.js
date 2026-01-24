import { Card, Table, Button } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { toDefaultDateTimeString } from '../common/DefaultDateTimeFormat'
import {
  currentVariantAtom,
  currentVariantClassesAtom,
  dashboardSettingsAtom,
  serviceNameFilterAtom,
  stackNameFilterAtom,
  stacksAtom,
  filterTypeAtom,
  viewAtom,
} from '../common/store/atoms'
import { useAtom, useAtomValue } from 'jotai'
import { servicesDetailId } from '../common/navigationConstants'
import { FilterComponent } from './FilterComponent'

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
  const [, setServiceFilterName] = useAtom(serviceNameFilterAtom)
  const [, setStackFilterName] = useAtom(stackNameFilterAtom)
  const [, setFilterType] = useAtom(filterTypeAtom)

  const stacksData = useAtomValue(stacksAtom)
  const [, updateView] = useAtom(viewAtom)
  const createServicesForStack = (stack) => {
    const normalize = (s) =>
      (s || '').toString().toLowerCase().replace(/[-_]/g, '')
    const fname = normalize(serviceNameFilter)
    return stack['Services']
      .filter((service) => {
        if (!serviceNameFilter) return true
        const shortName = normalize(service['ShortName'] || '')
        const fullName = normalize(service['ServiceName'] || '')
        return shortName.includes(fname) || fullName.includes(fname)
      })
      .map((service) => (
        <tr key={service['ID']}>
          <td className="text-nowrap">
            <span className="me-2">
              {service['ShortName']
                ? service['ShortName']
                : service['ServiceName']}
            </span>
            {(service['ShortName'] || service['ServiceName']) && (
              <>
                <Button
                  className="service-open-btn me-1"
                  size="sm"
                  title={`Open service: ${service['ShortName'] ? service['ShortName'] : service['ServiceName']}`}
                  onClick={() =>
                    updateView({ id: servicesDetailId, detail: service['ID'] })
                  }
                >
                  <FontAwesomeIcon icon="search" />
                </Button>
                <Button
                  className="stack-filter-btn"
                  size="sm"
                  title={`Filter service: ${service['ShortName'] ? service['ShortName'] : service['ServiceName']}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    setServiceFilterName(
                      (service['ShortName']
                        ? service['ShortName']
                        : service['ServiceName']) || '',
                    )
                    setStackFilterName('')
                    setFilterType('service')
                  }}
                >
                  <FontAwesomeIcon icon="filter" />
                </Button>
              </>
            )}
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
            <FontAwesomeIcon icon="cubes" /> {stack['Name']}
            {stack['Name'] && (
              <Button
                className="stack-filter-btn"
                size="sm"
                title={`Filter stack: ${stack['Name']}`}
                onClick={() => {
                  setStackFilterName(stack['Name'] || '')
                  setServiceFilterName('')
                  setFilterType('stack')
                }}
              >
                <FontAwesomeIcon icon="filter" />
              </Button>
            )}
          </h5>
        </Card.Header>
        <Table variant={currentVariant} size="sm" hover>
          <thead>
            <tr>
              <th>Service Name</th>
              <th className="col-md-1">Replication</th>
              <th className="col-md-2">Created</th>
              <th className="col-md-2">Updated</th>
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
