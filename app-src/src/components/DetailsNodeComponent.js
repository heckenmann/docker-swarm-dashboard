import { Card, Tab, Table, Tabs } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useParams } from 'react-router-dom';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { useAtomValue } from 'jotai';
import { currentSyntaxHighlighterStyleAtom, currentVariantAtom, currentVariantClassesAtom, nodesAtom } from '../common/store/atoms';
import { JsonTable } from './JsonTable';

function DetailsNodeComponent() {
    const nodes = useAtomValue(nodesAtom);
    const { id } = useParams();
    const currentNode = nodes.find(s => s.ID == id);
    const currentVariant = useAtomValue(currentVariantAtom);
    const currentVariantClasses = useAtomValue(currentVariantClassesAtom);
    const currentSyntaxHighlighterStyle = useAtomValue(currentSyntaxHighlighterStyleAtom);

    if (!currentNode) return <div>Node doesn't exist</div>;



    return (
        <Card className={currentVariantClasses}>
            <Card.Header><h5><FontAwesomeIcon icon="server" /> Node "{currentNode.Description?.Hostname}"</h5></Card.Header>
            <Card.Body>
                <Tabs className="mb-3">
                    <Tab eventKey="table" title="Table">
                        <JsonTable json={currentNode} variant={currentVariant} />
                    </Tab>
                    <Tab eventKey="json" title="JSON">
                        <SyntaxHighlighter language="javascript" style={currentSyntaxHighlighterStyle}>{JSON.stringify(currentNode, null, "\t")}</SyntaxHighlighter>
                    </Tab>
                </Tabs>
            </Card.Body>
        </Card>

    )
}

export { DetailsNodeComponent };