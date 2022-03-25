import { Card, Tab, Tabs } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useParams } from 'react-router-dom';
import { JsonToTable } from 'react-json-to-table';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import docco from 'react-syntax-highlighter/dist/esm/styles/hljs/docco';
import cleanDeep from 'clean-deep';

function DetailsNodeComponent(props) {
    if (!props?.isInitialized) return <div></div>;
    let { id } = useParams();
    let currentNode = props.nodes.find(s => s.ID == id);
    if (!currentNode) return <div>Node doesn't exist</div>;

    return (
        <Card bg='light'>
            <Card.Header><h5><FontAwesomeIcon icon="server" /> Node "{currentNode.Description?.Hostname}"</h5></Card.Header>
            <Card.Body>
                <Tabs className="mb-3">
                    <Tab eventKey="table" title="Table">
                        <JsonToTable json={cleanDeep(currentNode)} />
                    </Tab>
                    <Tab eventKey="json" title="JSON">
                        <SyntaxHighlighter language="javascript" style={docco}>{JSON.stringify(currentNode, null, "\t")}</SyntaxHighlighter>
                    </Tab>
                </Tabs>
            </Card.Body>
        </Card>

    )
}

export { DetailsNodeComponent };