import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { Component } from 'react';
import { Card, Form, Row, Col, Button } from 'react-bootstrap';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import js from 'react-syntax-highlighter/dist/esm/languages/hljs/javascript';
import docco from 'react-syntax-highlighter/dist/esm/styles/hljs/docco';
import Websocket from 'react-websocket';
SyntaxHighlighter.registerLanguage('javascript', js);

class LogsComponent extends Component {

    constructor(props) {
        super(props);
        this.state = {
            showLogs: false,
            logs: [],
            numberOfLines: 20
        }
    }

    componentDidMount() {
    }

    toggleLogs = () => {
        console.log("submit")
        this.setState({ showLogs: !this.state.showLogs });
    };

    hideLogs = () => {
        this.setState({ showLogs: false, logs: [] });
    };

    showLogs = () => {
        this.setState({ showLogs: true, logs: [], serviceId: this.inputServiceId.value });
    };

    addLogMessage = (message) => {
        let toRemove = this.state.logs.length - this.state.numberOfLines + 1;
        let newLogs = this.state.logs
        newLogs.splice(0, toRemove)
        newLogs.push(message)
        this.setState({ logs: newLogs})
    }

    onWebsocketOpen = () => {
        console.log("WebSocket opened for " + this.state.serviceId)
    }

    render() {
        if (!this.props.state || !this.props.state.initialized) {
            return (<div></div>);
        }
        let serviceOptions = [];

        // Service Options
        this.props.state.services.forEach(service => {
            serviceOptions.push(
                <option key={'serviceDropdown-' + service['ID']} value={service['ID']}>{service['Spec']['Name']}</option>
            );
        });

        let logPrinter = <>
            <SyntaxHighlighter language="javascript" style={docco}>{this.state.logs.join('\n')}</SyntaxHighlighter>
            <Websocket url={'ws://localhost:8080/docker/logs/' + this.state.serviceId} onOpen={this.onWebsocketOpen} onMessage={this.addLogMessage} />
        </>;

        let logPrinterOptions = <Form>
            <Form.Group as={Row} controlId="logprinternumberoflines">
                <Form.Label column sm="2">
                    Number of lines
             </Form.Label>
                <Col sm="10">
                    <Form.Control type="text" value={this.state.numberOfLines} onChange={(e) => this.setState({numberOfLines: e.target.value})} />
                </Col>
            </Form.Group>
            <Form.Group as={Row} controlId="logprinterkeyword">
                <Form.Label column sm="2">
                    Search keyword
             </Form.Label>
                <Col sm="10">
                    <Form.Control type="text" />
                </Col>
            </Form.Group>
            <Form.Group as={Row}>
                <Col sm={{ span: 10, offset: 2 }}>
                    <Button type="button" onClick={this.hideLogs}><FontAwesomeIcon icon="align-left" /> Hide logs</Button>
                </Col>
            </Form.Group>
        </Form>

        return (
            <Card>
                <Card.Body>
                    {!this.state.showLogs && <Form onSubmit={this.showLogs}>
                        <Form.Group as={Row} controlId="logsformservice">
                            <Form.Label column sm="2">
                                Service
                            </Form.Label>
                            <Col sm="10">
                                <Form.Control as="select" value={this.state.serviceId} ref={node => (this.inputServiceId = node)}>
                                    {serviceOptions}
                                </Form.Control>
                            </Col>
                        </Form.Group>
                        <Form.Group as={Row} controlId="logsformtail">
                            <Form.Label column sm="2">
                                Tail
                            </Form.Label>
                            <Col sm="10">
                                <Form.Control type="text" defaultValue="50" />
                            </Col>
                        </Form.Group>
                        <Form.Group as={Row} controlId="logsformsince">
                            <Form.Label column sm="2">
                                Since
                            </Form.Label>
                            <Col sm="10">
                                <Form.Control type="text" defaultValue="5m" />
                            </Col>
                        </Form.Group>
                        <Form.Group as={Row} controlId="logsformfollow">
                            <Form.Label column sm="2">
                                Follow
                            </Form.Label>
                            <Col sm="10">
                                <Form.Check />
                            </Col>
                        </Form.Group>
                        <Form.Group as={Row} controlId="logsformtimestamps">
                            <Form.Label column sm="2">
                                Timestamps
                            </Form.Label>
                            <Col sm="10">
                                <Form.Check defaultChecked={true} />
                            </Col>
                        </Form.Group>

                        <Form.Group as={Row}>
                            <Col sm={{ span: 10, offset: 2 }}>
                                <Button type="submit"><FontAwesomeIcon icon="desktop" /> Show logs</Button>
                            </Col>
                        </Form.Group>
                    </Form>}
                    {this.state.showLogs && logPrinterOptions}
                </Card.Body>
                {
                    this.state.showLogs && logPrinter
                }
            </Card>
        );
    }
}

export { LogsComponent };