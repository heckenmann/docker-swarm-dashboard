import { Badge, Card, Table } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useAtom, useAtomValue } from 'jotai'
import {
  currentVariantAtom,
  currentVariantClassesAtom,
  nodesAtomNew,
  tableSizeAtom,
  viewAtom,
} from '../common/store/atoms'
import { nodesDetailId } from '../common/navigationConstants'

function NodesComponent() {
  const currentVariant = useAtomValue(currentVariantAtom)
  const currentVariantClasses = useAtomValue(currentVariantClassesAtom)
  const [, updateView] = useAtom(viewAtom)
  const tableSize = useAtomValue(tableSizeAtom)
  const theads = []
  const trows = []

  theads.push(<th key="serviceTable-empty"></th>)

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
        <td
          className="cursorPointer align-middle text-nowrap"
          onClick={() => updateView({ id: nodesDetailId, detail: node.ID })}
        >
          {node['Hostname']}
          {node['Leader'] && <FontAwesomeIcon icon="star" />}
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
