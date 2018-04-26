import React, { Component } from 'react';
import { Table, Panel, Well } from 'react-bootstrap';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import faArrowRight from '@fortawesome/fontawesome-free-solid/faArrowRight';

class PortsComponent extends Component {

    render() {
        let services = this.props.state.services;
        let ports = [];
        services.filter(s => s.Spec && s.Spec.Name && s.Endpoint && s.Endpoint.Ports)
            .forEach(s => {
                s.Endpoint.Ports.forEach(port => {
                    port.ServiceName = s.Spec.Name;
                    ports.push(port);
                });
            });

        let renderedServices = ports
            .sort((p1, p2) => p1.PublishedPort - p2.PublishedPort)
            .map(p => {
                return (
                    <tr key={p.PublishedPort}>
                        <td>{p.PublishedPort}</td>
                        <td><FontAwesomeIcon icon={faArrowRight} /></td>
                        <td>{p.TargetPort}</td>
                        <td>{p.Protocol}</td>
                        <td>{p.PublishMode}</td>
                        <td>{p.ServiceName}</td>
                    </tr>
                )
            });

        return (
            <Well>
                <Panel>
                    <Panel.Body>
                        <Table id="portsTable" striped condensed hover>
                            <thead>
                                <tr>
                                    <th id="publishedPort">PublishedPort</th>
                                    <th id="arrow"></th>
                                    <th id="targetPort">TargetPort</th>
                                    <th id="protocol">Protocol</th>
                                    <th id="publishMode">PublishMode</th>
                                    <th id="serviceName">ServiceName</th>
                                </tr>
                            </thead>
                            <tbody>
                                {renderedServices}
                            </tbody>
                        </Table>
                    </Panel.Body>
                </Panel>
            </Well>
        )
    }
}

export { PortsComponent };