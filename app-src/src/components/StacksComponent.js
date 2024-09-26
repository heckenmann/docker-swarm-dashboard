import { Card, Table } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { toDefaultDateTimeString } from '../common/DefaultDateTimeFormat'
import {
  currentVariantAtom,
  currentVariantClassesAtom,
  dashboardSettingsAtom,
  serviceNameFilterAtom,
  stackNameFilterAtom,
  stacksAtom,
  viewAtom,
} from '../common/store/atoms'
import { useAtom, useAtomValue } from 'jotai'
import { servicesDetailId } from '../common/navigationConstants'
import { FilterComponent } from './FilterComponent'

function StacksComponent() {
  const currentVariant = useAtomValue(currentVariantAtom)
  const currentVariantClasses = useAtomValue(currentVariantClassesAtom)
  const dashBoardSettings = useAtomValue(dashboardSettingsAtom)
  const serviceNameFilter = useAtomValue(serviceNameFilterAtom)
  const stackNameFilter = useAtomValue(stackNameFilterAtom)

  let stacks
  const stacksData = useAtomValue(stacksAtom)
  const [, updateView] = useAtom(viewAtom)
  let createServicesForStack = (stack) => {
    return stack['Services']
      .filter((service) =>
        serviceNameFilter
          ? service['ShortName'].includes(serviceNameFilter)
          : true,
      )
      .map((service) => (
        <tr key={service['ID']}>
          <td
            className="cursorPointer text-nowrap"
            onClick={() => {
              updateView({ id: servicesDetailId, detail: service['ID'] })
            }}
          >
            {service['ShortName']
              ? service['ShortName']
              : service['ServiceName']}
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
  stacks = stacksData
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
