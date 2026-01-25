import {
  Badge,
  Card,
  Table,
  Button,
  OverlayTrigger,
  Tooltip,
} from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useAtom, useAtomValue } from 'jotai'
import { NodeName } from './names/NodeName'
import {
  currentVariantAtom,
  currentVariantClassesAtom,
  nodesAtomNew,
  tableSizeAtom,
  viewAtom,
} from '../common/store/atoms'
import { nodesDetailId } from '../common/navigationConstants'

/**
 * NodesComponent is a React functional component that renders a table of nodes.
 * It uses various atoms from Jotai for state management and displays node details
 * such as hostname, role, state, availability, and IP address.
 */
function NodesComponent() {
  const currentVariant = useAtomValue(currentVariantAtom)
  const currentVariantClasses = useAtomValue(currentVariantClassesAtom)
  const [, updateView] = useAtom(viewAtom)
  const tableSize = useAtomValue(tableSizeAtom)
  const trows = []

  const nodes = useAtomValue(nodesAtomNew)
  nodes.forEach((node) => {
    trows.push(
      <tr
        key={'tr' + node['ID']}
        className={node['State'] === 'ready' ? null : 'table-warning'}
      >
        <td>
          <FontAwesomeIcon icon="server" />
        </td>
        <td className="align-middle text-nowrap">
          <NodeName name={node['Hostname']} id={node.ID} />
          {node['Leader'] && (
            <OverlayTrigger
              placement="top"
              overlay={<Tooltip id={`leader-tt-${node.ID}`}>Leader</Tooltip>}
            >
              <span className="ms-1">
                <FontAwesomeIcon icon="star" />
              </span>
            </OverlayTrigger>
          )}
        </td>
        <td className="align-middle col-md-1">{node['Role']}</td>
        <td className="align-middle col-md-1">
          {(node['State'] === 'ready' && (
            <Badge bg="success" className="w-100">
              Ready
            </Badge>
          )) ||
            (node['State'] === 'down' && (
              <Badge bg="danger" className="w-100">
                Down
              </Badge>
            )) || (
              <Badge bg="warning" className="w-100">
                {node['State']}
              </Badge>
            )}
        </td>
        <td className="align-middle col-md-1">
          {(node['Availability'] === 'active' && (
            <Badge bg="success" className="w-100">
              {node['Availability']}
            </Badge>
          )) || (
            <Badge bg="warning" className="w-100">
              {node['Availability']}
            </Badge>
          )}
        </td>
        <td className="align-middle col-md-1">{node['StatusAddr']}</td>
      </tr>,
    )
  })

  return (
    <Card bg={currentVariant} className={currentVariantClasses}>
      <Card.Header></Card.Header>
      <Table
        variant={currentVariant}
        key="nodesTable"
        id="nodesTable"
        striped
        hover
        size={tableSize}
      >
        <thead>
          <tr>
            <th style={{ width: '25px' }}></th>
            <th className="nodeAttribute">Node</th>
            <th className="nodeAttributeSmall">Role</th>
            <th className="nodeAttributeSmall">State</th>
            <th className="nodeAttributeSmall">Availability</th>
            <th className="nodeAttributeSmall">IP</th>
          </tr>
        </thead>
        <tbody>{trows}</tbody>
      </Table>
    </Card>
  )
}

export { NodesComponent }
