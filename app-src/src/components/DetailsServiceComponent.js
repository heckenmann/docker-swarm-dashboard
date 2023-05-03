import {Card, Tab, Tabs} from 'react-bootstrap';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {Light as SyntaxHighlighter} from 'react-syntax-highlighter';
import {useAtomValue} from 'jotai';
import {
    currentSyntaxHighlighterStyleAtom,
    currentVariantAtom,
    currentVariantClassesAtom,
    serviceDetailAtom,
} from '../common/store/atoms';
import {JsonTable} from './JsonTable';

function DetailsServiceComponent() {
    const currentVariant = useAtomValue(currentVariantAtom);
    const currentVariantClasses = useAtomValue(currentVariantClassesAtom);
    const currentSyntaxHighlighterStyle = useAtomValue(currentSyntaxHighlighterStyleAtom);

    let currentService;
    currentService = useAtomValue(serviceDetailAtom);

    if (!currentService) return <div>Service doesn't exist</div>;

    return (
        <Card className={currentVariantClasses}>
            <Card.Header><h5><FontAwesomeIcon icon="folder"/> Service "{currentService.Spec?.Name}"</h5></Card.Header>
            <Card.Body>
                <Tabs className="mb-3">
                    <Tab eventKey="table" title="Table">
                        <JsonTable json={currentService} variant={currentVariant}/>
                    </Tab>
                    <Tab eventKey="json" title="JSON">
                        <SyntaxHighlighter language="javascript"
                                           style={currentSyntaxHighlighterStyle}>{JSON.stringify(currentService, null, "\t")}</SyntaxHighlighter>
                    </Tab>
                </Tabs>
            </Card.Body>
        </Card>
    )
}

export {DetailsServiceComponent};