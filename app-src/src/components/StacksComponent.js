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

// UI & internal imports
import { Card, Table } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { StackName } from './names/StackName'
import { ServiceName } from './names/ServiceName'
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
  const stacksData = useAtomValue(stacksAtom)

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
