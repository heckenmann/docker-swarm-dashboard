import { Card, Table } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useAtom, useAtomValue } from 'jotai'
import {
  currentVariantAtom,
  currentVariantClassesAtom,
  portsAtom,
  serviceNameFilterAtom,
  stackNameFilterAtom,
  tableSizeAtom,
  viewAtom,
} from '../common/store/atoms'
import { servicesDetailId } from '../common/navigationConstants'
import { FilterComponent } from './FilterComponent'

/**
 * PortsComponent is a React functional component that renders a table of port mappings.
 * It uses various atoms from Jotai for state management and filtering.
 */
function PortsComponent() {
  const currentVariant = useAtomValue(currentVariantAtom)
  const currentVariantClasses = useAtomValue(currentVariantClassesAtom)
  const [, updateView] = useAtom(viewAtom)
  const tableSize = useAtomValue(tableSizeAtom)
  const serviceNameFilter = useAtomValue(serviceNameFilterAtom)
  const stackNameFilter = useAtomValue(stackNameFilterAtom)

  let renderedServices

  const ports = useAtomValue(portsAtom)
  renderedServices = ports
    .filter((p) =>
      serviceNameFilter ? p.ServiceName.includes(serviceNameFilter) : true,
    )
    .filter((p) => (stackNameFilter ? p.Stack.includes(stackNameFilter) : true))
    .map((p) => {
      return (
        <tr key={p.PublishedPort}>
          <td>{p.PublishedPort}</td>
          <td>
            <FontAwesomeIcon icon="arrow-right" />
          </td>
          <td>{p.TargetPort}</td>
          <td>{p.Protocol}</td>
          <td>{p.PublishMode}</td>
          <td
            className="cursorPointer"
            onClick={() =>
              updateView({
                id: servicesDetailId,
                detail: p.ServiceID,
              })
            }
          >
            {p.ServiceName}
          </td>
          <td>{p.Stack}</td>
        </tr>
      )
    })

  return (
    <Card bg={currentVariant} className={currentVariantClasses}>
      <Card.Header>
        <FilterComponent />
      </Card.Header>
      <Card.Body>
        <Table
          id="portsTable"
          variant={currentVariant}
          striped
          size={tableSize}
        >
          <thead>
            <tr>
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
      </Card.Body>
    </Card>
  )
}

export { PortsComponent }
