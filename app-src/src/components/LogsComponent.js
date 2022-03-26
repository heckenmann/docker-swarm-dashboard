import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { Component } from 'react';
import { Card, Form, Row, Col, Button } from 'react-bootstrap';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import Websocket from 'react-websocket';

class LogsComponent extends Component {

    constructor(props) {
        super(props);
        this.state = {
            showLogs: false,
            logs: [],
            numberOfLines: 20
        }
    }

    toggleLogs = () => {
        console.log("submit")
        this.setState({ showLogs: !this.state.showLogs });
    };

    hideLogs = () => {
        this.setState({ showLogs: false, logs: [] });
    };

    showLogs = () => {
        this.setState({
            showLogs: true,
            logs: [],
            numberOfLines: this.inputTail.value > this.state.numberOfLines ? this.inputTail.value : this.state.numberOfLines,
            serviceId: this.inputServiceId.value,
            serviceName: (this.props.services.find(s => s['ID'] === this.inputServiceId.value))?.Spec.Name,
            tail: this.inputTail.value,
            since: this.inputSince.value,
            follow: this.inputFollow.checked,
            timestamps: this.inputTimestamps.checked,
            stdout: this.inputStdout.checked,
            stderr: this.inputStderr.checked,
            details: this.inputDetails.checked
        });
    };

    addLogMessage = (message) => {
        let toRemove = this.state.logs.length - this.state.numberOfLines + 1;
        let newLogs = this.state.logs
        newLogs.splice(0, toRemove)
        newLogs.push(message)
        this.setState({ logs: newLogs })
    }

    onWebsocketOpen = () => {
        console.log("WebSocket opened for " + this.state.serviceId)
    }

    render() {
        if (!this.props || !this.props.isInitialized) {
            return (<div></div>);
        }
        let serviceOptions = [];

        // Service Options
        this.props.services.forEach(service => {
            serviceOptions.push(
                <option key={'serviceDropdown-' + service['ID']} value={service['ID']}>{service['Spec']['Name']}</option>
            );
        });

        let logPrinter = <>
            <SyntaxHighlighter>{this.state.logs.join('\n')}</SyntaxHighlighter>
            <Websocket url={'ws://' + window.location.host + '/docker/logs/' + this.state.serviceId
                + '?tail=' + this.state.tail
                + '&since=' + this.state.since
                + '&follow=' + this.state.follow
                + '&timestamps=' + this.state.timestamps
                + '&stdout=' + this.state.stdout
                + '&stderr=' + this.state.stderr
                + '&details=' + this.state.details} onOpen={this.onWebsocketOpen} onMessage={this.addLogMessage} reconnect={this.state.follow} />
        </>;

        let logPrinterOptions = <Form>
            <Form.Group as={Row} className='mb-3' controlId="logprinterservicename">
                <Form.Label column sm="2">
                    Service
                </Form.Label>
                <Col sm="10">
                    <Form.Control type="text" defaultValue={this.state.serviceName} disabled={true} />
                </Col>
            </Form.Group>

            <Form.Group as={Row} className='mb-3' controlId="logprinternumberoflines">
                <Form.Label column sm="2">
                    Number of lines
                </Form.Label>
                <Col sm="10">
                    <Form.Control type="text" value={this.state.numberOfLines} onChange={(e) => this.setState({ numberOfLines: e.target.value })} />
                </Col>
            </Form.Group>

            <Form.Group as={Row} className='mb-3' controlId="logprinterkeyword">
                <Form.Label column sm="2">
                    Search keyword
                </Form.Label>
                <Col sm="10">
                    <Form.Control type="text" disabled={true} />
                </Col>
            </Form.Group>

            <Form.Group as={Row}>
                <Col sm={{ span: 10, offset: 2 }}>
                    <Button type="button" onClick={this.hideLogs}><FontAwesomeIcon icon="align-left" /> Hide logs</Button>
                </Col>
            </Form.Group>
        </Form>

        return (
            <Card bg='light'>
                <Card.Body>
                    {!this.state.showLogs && <Form onSubmit={this.showLogs}>
                        <Form.Group as={Row} className='mb-3' controlId="logsformservice">
                            <Form.Label column sm="2">
                                Service
                            </Form.Label>
                            <Col sm="10">
                                <Form.Control as="select" ref={node => (this.inputServiceId = node)}>
                                    {serviceOptions}
                                </Form.Control>
                            </Col>
                        </Form.Group>
                        <Form.Group as={Row} className='mb-3' controlId="logsformtail">
                            <Form.Label column sm="2">
                                Tail
                            </Form.Label>
                            <Col sm="10">
                                <Form.Control type="text" defaultValue="5" ref={node => (this.inputTail = node)} />
                            </Col>
                        </Form.Group>
                        <Form.Group as={Row} className='mb-3' controlId="logsformsince">
                            <Form.Label column sm="2">
                                Since
                            </Form.Label>
                            <Col sm="10">
                                <Form.Control type="text" defaultValue="1h" ref={node => (this.inputSince = node)} />
                            </Col>
                        </Form.Group>
                        <Form.Group as={Row} className='mb-3' controlId="logsformfollow">
                            <Form.Label column sm="2">
                                Follow
                            </Form.Label>
                            <Col sm="10">
                                <Form.Check ref={node => (this.inputFollow = node)} />
                            </Col>
                        </Form.Group>
                        <Form.Group as={Row} className='mb-3' controlId="logsformtimestamps">
                            <Form.Label column sm="2">
                                Timestamps
                            </Form.Label>
                            <Col sm="10">
                                <Form.Check defaultChecked={false} ref={node => (this.inputTimestamps = node)} />
                            </Col>
                        </Form.Group>
                        <Form.Group as={Row} className='mb-3' controlId="logsformstdout">
                            <Form.Label column sm="2">
                                Stdout
                            </Form.Label>
                            <Col sm="10">
                                <Form.Check defaultChecked={true} ref={node => (this.inputStdout = node)} />
                            </Col>
                        </Form.Group>
                        <Form.Group as={Row} className='mb-3' controlId="logsformstderr">
                            <Form.Label column sm="2">
                                Stderr
                            </Form.Label>
                            <Col sm="10">
                                <Form.Check defaultChecked={true} ref={node => (this.inputStderr = node)} />
                            </Col>
                        </Form.Group>
                        <Form.Group as={Row} className='mb-3' controlId="logsformdetails">
                            <Form.Label column sm="2">
                                Details
                            </Form.Label>
                            <Col sm="10">
                                <Form.Check defaultChecked={false} ref={node => (this.inputDetails = node)} />
                            </Col>
                        </Form.Group>

                        <Form.Group as={Row}>
                            <Col sm={{ span: 10, offset: 2 }}>
                                <Button type="submit" disabled={!this.props.services || this.props.services.length === 0}><FontAwesomeIcon icon="desktop" /> Show logs</Button>
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