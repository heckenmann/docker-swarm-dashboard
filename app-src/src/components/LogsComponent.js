import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {useAtom, useAtomValue} from 'jotai';
import {useResetAtom} from 'jotai/utils';
import {Card, Form, Row, Col, Button} from 'react-bootstrap';
import {Light as SyntaxHighlighter} from 'react-syntax-highlighter';
import {
    currentSyntaxHighlighterStyleAtom,
    currentVariantAtom,
    currentVariantClassesAtom,
    logsConfigAtom,
    logsLinesAtom,
    logsNumberOfLinesAtom, logsServicesAtom,
    logsShowLogsAtom,
    logsWebsocketAtom,
    logsWebsocketUrlAtom,
    servicesAtom,
    useNewApiToogleAtom
} from '../common/store/atoms';
import useWebSocket, {ReadyState} from 'react-use-websocket';
import {useEffect} from 'react';

function LogsComponent() {
    const useNewApi = useAtomValue(useNewApiToogleAtom);
    const [logsLines, setLogsLines] = useAtom(logsLinesAtom);
    const resetLogsLines = useResetAtom(logsLinesAtom);
    const [logsNumberOfLines, setLogsNumberOfLines] = useAtom(logsNumberOfLinesAtom);
    const resetLogsNumberOfLines = useResetAtom(logsNumberOfLinesAtom);
    const [logsShowLogs, setLogsShowLogs] = useAtom(logsShowLogsAtom);
    const [logsConfig, setLogsConfig] = useAtom(logsConfigAtom);
    const currentVariant = useAtomValue(currentVariantAtom);
    const currentVariantClasses = useAtomValue(currentVariantClassesAtom);
    const logsWebsocketUrl = useAtomValue(logsWebsocketUrlAtom);
    const {
        _,
        lastMessage,
        readyState
    } = useWebSocket(logsWebsocketUrl, {
        onOpen: () => console.log('logger-websocket connected'),
        onClose: () => console.log('logger-websocket closed'),
        shouldReconnect: (closeEvent) => logsShowLogs && logsConfig?.follow
    }, logsShowLogs);
    const currentSyntaxHighlighterStyle = useAtomValue(currentSyntaxHighlighterStyleAtom);

    // Inputs
    let inputServiceId;
    let inputTail;
    let inputSince;
    let inputFollow;
    let inputTimestamps;
    let inputStdout;
    let inputStderr;
    let inputDetails;

    useEffect(() => {
        if (lastMessage !== null) {
            console.log(lastMessage.data);
            const toRemove = logsLines.length - logsNumberOfLines + 1;
            const newLogs = logsLines;
            newLogs.splice(0, toRemove);
            newLogs.push(lastMessage.data);
            setLogsLines(newLogs);
        }
    }, [lastMessage, setLogsLines]);

    const hideLogs = () => {
        resetLogsLines();
        setLogsConfig(null);
        setLogsShowLogs(false);
    };

    const showLogs = () => {
        if (inputTail?.value > 0) setLogsNumberOfLines(inputTail.value); else resetLogsNumberOfLines();
        const newLogsConfig = {
            serviceId: inputServiceId.value,
            serviceName: (services.find(s => s['ID'] === inputServiceId.value))?.Spec.Name,
            tail: inputTail.value,
            since: inputSince.value,
            follow: inputFollow.checked,
            timestamps: inputTimestamps.checked,
            stdout: inputStdout.checked,
            stderr: inputStderr.checked,
            details: inputDetails.checked
        };
        setLogsConfig(newLogsConfig);
        setLogsShowLogs(true);
    };

    const serviceOptions = [];

    if (useNewApi) {
        const services = useAtomValue(logsServicesAtom);
        services.forEach(service => {
            serviceOptions.push(
                <option key={'serviceDropdown-' + service['ID']}
                        value={service['ID']}>{service['Name']}</option>
            );
        });
    } else {
        const services = useAtomValue(servicesAtom);
        // Service Options
        services.forEach(service => {
            serviceOptions.push(
                <option key={'serviceDropdown-' + service['ID']}
                        value={service['ID']}>{service['Spec']['Name']}</option>
            );
        });
    }

    const logPrinterOptions = <Form>
        <Form.Group as={Row} className='mb-3' controlId="logprinterservicename">
            <Form.Label column sm="2">
                Service
            </Form.Label>
            <Col sm="10">
                <Form.Control type="text" defaultValue={logsConfig?.serviceName} disabled={true}/>
            </Col>
        </Form.Group>

        <Form.Group as={Row} className='mb-3' controlId="logprinternumberoflines">
            <Form.Label column sm="2">
                Number of lines
            </Form.Label>
            <Col sm="10">
                <Form.Control type="text" value={logsNumberOfLines}
                              onChange={(e) => setLogsNumberOfLines(e.target.value)}/>
            </Col>
        </Form.Group>

        <Form.Group as={Row} className='mb-3' controlId="logprinterkeyword">
            <Form.Label column sm="2">
                Search keyword
            </Form.Label>
            <Col sm="10">
                <Form.Control type="text" disabled={true}/>
            </Col>
        </Form.Group>

        <Form.Group as={Row}>
            <Col sm={{span: 10, offset: 2}}>
                <Button type="button" onClick={hideLogs}><FontAwesomeIcon icon="align-left"/> Hide logs</Button>
            </Col>
        </Form.Group>
    </Form>

    return (
        <Card bg={currentVariant} className={currentVariantClasses}>
            <Card.Body>
                {!logsShowLogs && <Form onSubmit={showLogs}>
                    <Form.Group as={Row} className='mb-3' controlId="logsformservice">
                        <Form.Label column sm="2">
                            Service
                        </Form.Label>
                        <Col sm="10">
                            <Form.Control as="select" ref={node => (inputServiceId = node)}>
                                {serviceOptions}
                            </Form.Control>
                        </Col>
                    </Form.Group>
                    <Form.Group as={Row} className='mb-3' controlId="logsformtail">
                        <Form.Label column sm="2">
                            Tail
                        </Form.Label>
                        <Col sm="10">
                            <Form.Control type="text" defaultValue="20" ref={node => (inputTail = node)}/>
                        </Col>
                    </Form.Group>
                    <Form.Group as={Row} className='mb-3' controlId="logsformsince">
                        <Form.Label column sm="2">
                            Since
                        </Form.Label>
                        <Col sm="10">
                            <Form.Control type="text" defaultValue="1h" ref={node => (inputSince = node)}/>
                        </Col>
                    </Form.Group>
                    <Form.Group as={Row} className='mb-3' controlId="logsformfollow">
                        <Form.Label column sm="2">
                            Follow
                        </Form.Label>
                        <Col sm="10">
                            <Form.Check ref={node => (inputFollow = node)}/>
                        </Col>
                    </Form.Group>
                    <Form.Group as={Row} className='mb-3' controlId="logsformtimestamps">
                        <Form.Label column sm="2">
                            Timestamps
                        </Form.Label>
                        <Col sm="10">
                            <Form.Check defaultChecked={false} ref={node => (inputTimestamps = node)}/>
                        </Col>
                    </Form.Group>
                    <Form.Group as={Row} className='mb-3' controlId="logsformstdout">
                        <Form.Label column sm="2">
                            Stdout
                        </Form.Label>
                        <Col sm="10">
                            <Form.Check defaultChecked={true} ref={node => (inputStdout = node)}/>
                        </Col>
                    </Form.Group>
                    <Form.Group as={Row} className='mb-3' controlId="logsformstderr">
                        <Form.Label column sm="2">
                            Stderr
                        </Form.Label>
                        <Col sm="10">
                            <Form.Check defaultChecked={true} ref={node => (inputStderr = node)}/>
                        </Col>
                    </Form.Group>
                    <Form.Group as={Row} className='mb-3' controlId="logsformdetails">
                        <Form.Label column sm="2">
                            Details
                        </Form.Label>
                        <Col sm="10">
                            <Form.Check defaultChecked={false} ref={node => (inputDetails = node)}/>
                        </Col>
                    </Form.Group>

                    <Form.Group as={Row}>
                        <Col sm={{span: 10, offset: 2}}>
                            <Button type="submit" disabled={!serviceOptions || serviceOptions.length === 0}><FontAwesomeIcon
                                icon="desktop"/> Show logs</Button>
                        </Col>
                    </Form.Group>
                </Form>}
                {
                    logsShowLogs && logPrinterOptions
                }
            </Card.Body>
            {
                logsShowLogs &&
                <SyntaxHighlighter style={currentSyntaxHighlighterStyle}>{logsLines?.join('\n')}</SyntaxHighlighter>
            }
        </Card>
    );
}

export {LogsComponent};