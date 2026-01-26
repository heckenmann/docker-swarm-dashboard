import { useAtomValue } from 'jotai'
import {
  currentSyntaxHighlighterStyleAtom,
  currentVariantAtom,
  currentVariantClassesAtom,
  nodeDetailAtom,
} from '../common/store/atoms'
import { toDefaultDateTimeString } from '../common/DefaultDateTimeFormat'
import { Card, Tabs, Tab, Table } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { JsonTable } from './JsonTable'
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter'
import { ServiceName } from './names/ServiceName'
import ServiceStatusBadge from './ServiceStatusBadge'

/**
 * Component to display details of a node.
 * It uses various atoms to get the current state and displays the node details
 * in a card with tabs for table and JSON views.
 */
function DetailsNodeComponent() {
  const currentVariant = useAtomValue(currentVariantAtom)
  const currentVariantClasses = useAtomValue(currentVariantClassesAtom)
  const currentSyntaxHighlighterStyle = useAtomValue(
    currentSyntaxHighlighterStyleAtom,
  )

  const currentNode = useAtomValue(nodeDetailAtom)

  if (!currentNode) return <div>Node doesn't exist</div>

  // Only use the attached Service object on tasks. No fallback to legacy fields.
  const taskServiceName = (task) => {
    if (!task || !task.Service) return null
    return task.Service?.Spec?.Name || task.Service?.Spec?.Annotations?.Name || null
  }

  const taskServiceId = (task) => {
    if (!task || !task.Service) return null
    return task.Service?.ID || null
  }

  return (
    <div
      style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}
    >
      <Card className={currentVariantClasses}>
        <Card.Header>
          <h5>
            <FontAwesomeIcon icon="server" /> Node "
            {currentNode.node?.Description?.Hostname}"
          </h5>
        </Card.Header>
        <Card.Body style={{ overflowY: 'auto' }}>
          <Tabs className="mb-3">
            <Tab eventKey="table" title="Table">
              <JsonTable json={currentNode.node} variant={currentVariant} />
            </Tab>
            <Tab eventKey="json" title="JSON">
              <SyntaxHighlighter
                language="javascript"
                style={currentSyntaxHighlighterStyle}
              >
                {JSON.stringify(currentNode.node, null, '\t')}
              </SyntaxHighlighter>
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>
      <Card className={currentVariantClasses}>
        <Card.Header>
          <h5>
            <FontAwesomeIcon icon="tasks" /> Tasks on{' '}
            {currentNode.node?.Description?.Hostname}
          </h5>
        </Card.Header>
        <Table striped bordered hover size="sm" variant={currentVariant}>
          <thead>
            <tr>
              <th>Service</th>
              <th>State</th>
              <th>Desired State</th>
              <th>Created</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {currentNode.tasks &&
              currentNode.tasks.map((task, idx) => (
                <tr
                  key={
                    (task && task.ID ? String(task.ID) : `task-idx-${idx}`) +
                    `-${idx}`
                  }
                >
                  <td>
                    <ServiceName name={taskServiceName(task)} id={taskServiceId(task)} />
                  </td>
                  <td>
                    <ServiceStatusBadge
                      id={task.ID}
                      serviceState={task.Status?.State || task.State}
                    />
                  </td>
                  <td>{task.DesiredState}</td>
                  <td>
                    {toDefaultDateTimeString(task.CreatedAt || task.Timestamp)}
                  </td>
                  <td>
                    {toDefaultDateTimeString(
                      task.UpdatedAt || task.CreatedAt || task.Timestamp,
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </Table>
      </Card>
    </div>
  )
}

export { DetailsNodeComponent }
