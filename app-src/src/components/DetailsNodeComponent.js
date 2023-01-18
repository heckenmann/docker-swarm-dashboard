import {Card, Tab, Tabs} from 'react-bootstrap';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {Light as SyntaxHighlighter} from 'react-syntax-highlighter';
import {useAtomValue} from 'jotai';
import {
    currentSyntaxHighlighterStyleAtom,
    currentVariantAtom,
    currentVariantClassesAtom,
    nodeDetailAtom,
    nodesAtom,
    useNewApiToogleAtom,
    viewAtom
} from '../common/store/atoms';
import {JsonTable} from './JsonTable';

function DetailsNodeComponent() {
    const currentVariant = useAtomValue(currentVariantAtom);
    const currentVariantClasses = useAtomValue(currentVariantClassesAtom);
    const currentSyntaxHighlighterStyle = useAtomValue(currentSyntaxHighlighterStyleAtom);

    const useNewApi = useAtomValue(useNewApiToogleAtom);
    let currentNode;
    if (useNewApi) {
        currentNode = useAtomValue(nodeDetailAtom);
    } else {
        const nodes = useAtomValue(nodesAtom);
        const view = useAtomValue(viewAtom);
        currentNode = nodes.find(s => s.ID == view?.detail);
    }

    if (!currentNode) return <div>Node doesn't exist</div>;

    return (
        <Card className={currentVariantClasses}>
            <Card.Header><h5><FontAwesomeIcon icon="server"/> Node "{currentNode.Description?.Hostname}"</h5>
            </Card.Header>
            <Card.Body>
                <Tabs className="mb-3">
                    <Tab eventKey="table" title="Table">
                        <JsonTable json={currentNode} variant={currentVariant}/>
                    </Tab>
                    <Tab eventKey="json" title="JSON">
                        <SyntaxHighlighter language="javascript"
                                           style={currentSyntaxHighlighterStyle}>{JSON.stringify(currentNode, null, "\t")}</SyntaxHighlighter>
                    </Tab>
                </Tabs>
            </Card.Body>
        </Card>

    )
}

export {DetailsNodeComponent};