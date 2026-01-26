import { useAtomValue } from 'jotai'
import {
  currentVariantAtom,
  currentVariantClassesAtom,
  portsAtom,
  serviceNameFilterAtom,
  stackNameFilterAtom,
  tableSizeAtom,
} from '../common/store/atoms'

// UI & internal imports
import { Card, Table } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { EntityName } from './names/EntityName'
import { StackName } from './names/StackName'
import { FilterComponent } from './FilterComponent'

/**
 * PortsComponent is a React functional component that renders a table of port mappings.
 * It uses various atoms from Jotai for state management and filtering.
 */
function PortsComponent() {
  const currentVariant = useAtomValue(currentVariantAtom)
  const currentVariantClasses = useAtomValue(currentVariantClassesAtom)
  const tableSize = useAtomValue(tableSizeAtom)
  const serviceNameFilter = useAtomValue(serviceNameFilterAtom)
  const stackNameFilter = useAtomValue(stackNameFilterAtom)

  const ports = useAtomValue(portsAtom)
  const renderedServices = ports
    .filter((p) =>
      serviceNameFilter ? p.ServiceName.includes(serviceNameFilter) : true,
    )
    .filter((p) => (stackNameFilter ? p.Stack.includes(stackNameFilter) : true))
    .map((p) => {
      return (
        <tr key={p.PublishedPort}>
          <td>
            <FontAwesomeIcon icon="building" />
          </td>
          <td>{p.PublishedPort}</td>
          <td>
            <FontAwesomeIcon icon="arrow-right" />
          </td>
          <td>{p.TargetPort}</td>
          <td>{p.Protocol}</td>
          <td>{p.PublishMode}</td>
          <td>
            <EntityName name={p.ServiceName} id={p.ServiceID} />
          </td>
          <td>
            <StackName name={p.Stack} />
          </td>
        </tr>
      )
    })

  return (
    <Card bg={currentVariant} className={currentVariantClasses}>
      <Card.Header>
        <FilterComponent />
      </Card.Header>
      <Table
        id="portsTable"
        variant={currentVariant}
        striped
        size={tableSize}
        className="mt-2"
      >
        <thead>
          <tr>
            <th style={{ width: '25px' }}></th>
            <th id="publishedPort">PublishedPort</th>
            <th id="arrow"></th>
            <th id="targetPort">TargetPort</th>
            <th id="protocol">Protocol</th>
            <th id="publishMode">PublishMode</th>
            <th id="serviceName">ServiceName</th>
            <th id="stack">Stack</th>
          </tr>
        </thead>
        <tbody>{renderedServices}</tbody>
      </Table>
    </Card>
  )
}

export { PortsComponent }
