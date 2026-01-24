import { Card, Table, Button } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useAtom, useAtomValue } from 'jotai'
import {
  currentVariantAtom,
  currentVariantClassesAtom,
  portsAtom,
  serviceNameFilterAtom,
  stackNameFilterAtom,
  filterTypeAtom,
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
  const [, setServiceFilterName] = useAtom(serviceNameFilterAtom)
  const [, setStackFilterName] = useAtom(stackNameFilterAtom)
  const [, setFilterType] = useAtom(filterTypeAtom)

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
            <span className="me-2">{p.ServiceName}</span>
            {p.ServiceName && (
              <>
                <Button
                  className="service-open-btn me-1"
                  size="sm"
                  title={`Open service: ${p.ServiceName}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    updateView({ id: servicesDetailId, detail: p.ServiceID })
                  }}
                >
                  <FontAwesomeIcon icon="search" />
                </Button>
                <Button
                  className="stack-filter-btn"
                  size="sm"
                  title={`Filter service: ${p.ServiceName}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    setServiceFilterName(p.ServiceName || '')
                    setStackFilterName('')
                    setFilterType('service')
                  }}
                >
                  <FontAwesomeIcon icon="filter" />
                </Button>
              </>
            )}
          </td>
          <td>
            <span className="me-2">{p.Stack}</span>
            {p.Stack && (
              <Button
                className="stack-filter-btn"
                size="sm"
                title={`Filter stack: ${p.Stack}`}
                onClick={() => {
                  setStackFilterName(p.Stack || '')
                  setServiceFilterName('')
                  setFilterType('stack')
                }}
              >
                <FontAwesomeIcon icon="filter" />
              </Button>
            )}
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
