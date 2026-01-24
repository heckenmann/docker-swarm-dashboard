import { Card, Tab, Tabs } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter'
import { useAtomValue } from 'jotai'
import {
  currentSyntaxHighlighterStyleAtom,
  currentVariantAtom,
  currentVariantClassesAtom,
  nodeDetailAtom,
} from '../common/store/atoms'
import { JsonTable } from './JsonTable'

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

  return (
    <Card className={currentVariantClasses}>
      <Card.Header>
        <h5>
          <FontAwesomeIcon icon="server" /> Node "
          {currentNode.Description?.Hostname}"
        </h5>
      </Card.Header>
      <Card.Body>
        <Tabs className="mb-3">
          <Tab eventKey="table" title="Table">
            <JsonTable json={currentNode} variant={currentVariant} />
          </Tab>
          <Tab eventKey="json" title="JSON">
            <SyntaxHighlighter
              language="javascript"
              style={currentSyntaxHighlighterStyle}
            >
              {JSON.stringify(currentNode, null, '\t')}
            </SyntaxHighlighter>
          </Tab>
        </Tabs>
      </Card.Body>
    </Card>
  )
}

export { DetailsNodeComponent }
