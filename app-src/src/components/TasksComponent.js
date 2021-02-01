import React, { Component } from 'react';
import { Table, Badge, Card } from 'react-bootstrap';
import { getStyleClassForState } from '../Helper';

class TasksComponent extends Component {

    render() {
        let rows = this.props.state.tasks.map(task => {
            let currentNode = this.props.state.nodes.find(node => node['ID'] === task['NodeID']);
            let currentService = this.props.state.services.find(service => service['ID'] === task['ServiceID']);

            let currentNodeName = currentNode == null ? "" : currentNode['Description']['Hostname'];
            let currentServiceName = currentService == null ? "" : currentService['Spec']['Name'];
            let currentError = task['Status']['Err'] == null ? "" : task['Status']['Err'];
            return (
                <tr>
                    <td>{new Date(task['Status']['Timestamp']).toLocaleString()}</td>
                    <td><Badge bsStyle={getStyleClassForState(task['Status']['State'])} className="ds-label full-width">{task['Status']['State']} </Badge></td>
                    <td>{task['DesiredState']}</td>
                    <td>{currentServiceName}</td>
                    <td>{currentNodeName}</td>
                    <td>{currentError}</td>
                </tr>
            );
        });
        return (
            <Card>
                <Card.Body>
                    <Table striped condensed hover id="tasksTable">
                        <thead>
                            <tr>
                                <th id="timestampCol">Timestamp</th>
                                <th id="stateCol">State</th>
                                <th id="desiredstateCol">DesiredState</th>
                                <th id="serviceCol">ServiceName</th>
                                <th id="nodeCol">Node</th>
                                <th>Error</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>
        )
    }

}

export { TasksComponent };