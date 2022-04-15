import { Card, Tab, Table, Tabs } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { useAtomValue } from 'jotai';
import { currentSyntaxHighlighterStyleAtom, currentVariantAtom, currentVariantClassesAtom, nodesAtom, viewAtom, viewDetailIdAtom } from '../common/store/atoms';
import { JsonTable } from './JsonTable';

function DetailsNodeComponent() {
    const nodes = useAtomValue(nodesAtom);
    const view = useAtomValue(viewAtom);
    const currentNode = nodes.find(s => s.ID == view?.detail);
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