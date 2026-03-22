import { useAtomValue } from 'jotai'
import {
  currentVariantClassesAtom,
  nodeDetailAtom,
} from '../../common/store/atoms'
import { Card, Tabs, Tab, Row, Col } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { JsonTable } from '../shared/JsonTable.jsx'
import { NodeMetricsComponent } from './NodeMetricsComponent'
import { NodeTasksTab } from './details/NodeTasksTab'

/**
 * Displays full details for a node: metrics, tasks, structured table and raw JSON.
 */
function DetailsNodeComponent() {
  const currentVariantClasses = useAtomValue(currentVariantClassesAtom)
  const currentNode = useAtomValue(nodeDetailAtom)

  if (!currentNode) return <div>Node doesn&apos;t exist</div>

  return (
    <div>
      <Row>
        <Col xs={12}>
          <Card className={currentVariantClasses}>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <div>
                <FontAwesomeIcon icon="server" className="me-2" />
                <strong>
                  Node &quot;{currentNode.node?.Description?.Hostname}&quot;
                </strong>
              </div>
            </Card.Header>
            <Card.Body>
              <Tabs className="mb-3" defaultActiveKey="metrics">
                <Tab eventKey="metrics" title="Metrics">
                  <NodeMetricsComponent nodeId={currentNode.node?.ID} />
                </Tab>
                <Tab eventKey="tasks" title="Tasks">
                  <NodeTasksTab />
                </Tab>
                <Tab eventKey="table" title="Table">
                  <JsonTable json={currentNode.node} />
                </Tab>
                <Tab eventKey="json" title="JSON">
                  <pre
                    style={{
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'monospace',
                      fontSize: 12,
                    }}
                  >
                    <code>{JSON.stringify(currentNode.node, null, '\t')}</code>
                  </pre>
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export { DetailsNodeComponent }
