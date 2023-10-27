import { Card, Table } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useAtom, useAtomValue } from 'jotai'
import {
  currentVariantAtom,
  currentVariantClassesAtom,
  portsAtom,
  tableSizeAtom,
  viewAtom,
} from '../common/store/atoms'
import { servicesDetailId } from '../common/navigationConstants'

function PortsComponent() {
  const currentVariant = useAtomValue(currentVariantAtom)
  const currentVariantClasses = useAtomValue(currentVariantClassesAtom)
  const [, updateView] = useAtom(viewAtom)
  const tableSize = useAtomValue(tableSizeAtom)

  let renderedServices

  const ports = useAtomValue(portsAtom)
  renderedServices = ports.map((p) => {
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
      </tr>
    )
  })

  return (
    <Card bg={currentVariant} className={currentVariantClasses}>
      <Card.Body>
        <Table
          id="portsTable"
          variant={currentVariant}
          size="sm"
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
            </tr>
          </thead>
          <tbody>{renderedServices}</tbody>
        </Table>
      </Card.Body>
    </Card>
  )
}

export { PortsComponent }
