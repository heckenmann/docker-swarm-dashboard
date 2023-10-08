import { Card, Table } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { toDefaultDateTimeString } from '../common/DefaultDateTimeFormat'
import {
  currentVariantAtom,
  currentVariantClassesAtom,
  viewAtom,
  stacksAtom,
} from '../common/store/atoms'
import { useAtom, useAtomValue } from 'jotai'
import { servicesDetailId } from '../common/navigationConstants'

function findServicesForStack(services, stackName) {
  const [, updateView] = useAtom(viewAtom)

  return services
    .filter(
      (service) =>
        service['Spec']['Labels']['com.docker.stack.namespace'] === stackName,
    )
    .sort((s0, s1) => s0 - s1)
    .map((service) => (
      <tr key={service.ID}>
        <td
          className="cursorPointer text-nowrap"
          onClick={() => {
            updateView({ id: servicesDetailId, detail: service.ID })
          }}
        >
          {stackName
            ? service['Spec']['Name']?.substring(
                stackName.length + 1,
                service['Spec']['Name'].length,
              )
            : service['Spec']['Name']}
        </td>
        <td>
          {service['Spec']['Mode']['Replicated']
            ? service['Spec']['Mode']['Replicated']['Replicas']
            : Object.keys(service['Spec']['Mode'])}
        </td>
        <td>{toDefaultDateTimeString(new Date(service['CreatedAt']))}</td>
        <td>{toDefaultDateTimeString(new Date(service['UpdatedAt']))}</td>
      </tr>
    ))
}

function StacksComponent() {
  const currentVariant = useAtomValue(currentVariantAtom)
  const currentVariantClasses = useAtomValue(currentVariantClassesAtom)

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
        <td>{toDefaultDateTimeString(new Date(service['Created']))}</td>
        <td>{toDefaultDateTimeString(new Date(service['Updated']))}</td>
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
