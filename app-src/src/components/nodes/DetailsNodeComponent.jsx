import React from 'react'
import { useAtomValue } from 'jotai'
import { Card, Tabs, Tab, Row, Col } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { currentVariantClassesAtom } from '../../common/store/atoms/themeAtoms'
import { nodeDetailAtom } from '../../common/store/atoms/navigationAtoms'
import JsonTable from '../shared/JsonTable.jsx'
import NodeMetricsComponent from './NodeMetricsComponent'
import NodeTasksTab from './details/NodeTasksTab'

import MetricCard from '../shared/MetricCard.jsx'

/**
 * DetailsNodeComponent - Displays comprehensive details for a single Docker Swarm node.
 *
 * Shows node metrics (CPU, memory, disk, network), running tasks, a structured
 * properties table, and raw JSON output in tabbed sections.
 *
 * @returns {JSX.Element|null} The node details view or null if no node is selected
 */
const DetailsNodeComponent = React.memo(function DetailsNodeComponent() {
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
                  <MetricCard
                    title="Node Properties"
                    icon="table"
                    noBody={true}
                  >
                    <JsonTable json={currentNode.node} />
                  </MetricCard>
                </Tab>
                <Tab eventKey="json" title="JSON">
                  <MetricCard title="Raw JSON" icon="code">
                    <pre
                      style={{
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'monospace',
                        fontSize: 12,
                      }}
                      className="mb-0"
                    >
                      <code>
                        {JSON.stringify(currentNode.node, null, '\t')}
                      </code>
                    </pre>
                  </MetricCard>
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  )
})

export default DetailsNodeComponent
