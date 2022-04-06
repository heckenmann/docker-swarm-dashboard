import { Card, Tab, Tabs } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useParams } from 'react-router-dom';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import docco from 'react-syntax-highlighter/dist/esm/styles/hljs/docco';
import { JsonToTable } from 'react-json-to-table';
import cleanDeep from 'clean-deep';

function DetailsServiceComponent(props) {
    if (!props?.isInitialized) return <div></div>;
    let { id } = useParams();
    let currentService = props.services.find(s => s.ID == id);
    if (!currentService) return <div>Service doesn't exist</div>;

    return (
        <Card bg='light'>
            <Card.Header><h5><FontAwesomeIcon icon="folder" /> Service "{currentService.Spec?.Name}"</h5></Card.Header>
            <Card.Body>
                <Tabs className="mb-3">
                    <Tab eventKey="table" title="Table">
                        <JsonToTable json={cleanDeep(currentService)} />
                    </Tab>
                    <Tab eventKey="json" title="JSON">
                        <SyntaxHighlighter language="javascript" style={docco}>{JSON.stringify(currentService, null, "\t")}</SyntaxHighlighter>
                    </Tab>
                </Tabs>
            </Card.Body>
        </Card>
    )
}

export { DetailsServiceComponent };