import { Card, Table } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { toDefaultDateTimeString } from '../common/DefaultDateTimeFormat'
import {
  currentVariantAtom,
  currentVariantClassesAtom,
  dashboardSettingsAtom,
  stacksAtom,
  viewAtom,
} from '../common/store/atoms'
import { useAtom, useAtomValue } from 'jotai'
import { servicesDetailId } from '../common/navigationConstants'
function StacksComponent() {
  const currentVariant = useAtomValue(currentVariantAtom)
  const currentVariantClasses = useAtomValue(currentVariantClassesAtom)
  const dashBoardSettings = useAtomValue(dashboardSettingsAtom)

  let stacks
  const stacksData = useAtomValue(stacksAtom)
  const [, updateView] = useAtom(viewAtom)
  let createServicesForStack = (stack) => {
    return stack['Services'].map((service) => (
      <tr key={service['ID']}>
        <td
          className="cursorPointer text-nowrap"
          onClick={() => {
            updateView({ id: servicesDetailId, detail: service['ID'] })
          }}
        >
          {service['ShortName'] ? service['ShortName'] : service['ServiceName']}
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
  stacks = stacksData.map((stack) => (
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
      <Card.Body>
        <Table variant={currentVariant} size="sm" striped hover>
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
      </Card.Body>
    </Card>
  ))

  return <>{stacks}</>
}

export { StacksComponent }
