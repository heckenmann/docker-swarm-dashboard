import React, { Component } from 'react';
import { Table, Label } from 'react-bootstrap';
import { getStyleClassForState } from '../Helper';

class TasksComponent extends Component {

    state = {
        initialized: false,
        nodes: [],
        services: [],
        tasks: []
    }

    async loadData() {
        let localState = this.state;
        localState.nodes = (await (await fetch("/docker/nodes")).json()).sort((a, b) => { return a['Description']['Hostname'] > b['Description']['Hostname'] ? 1 : -1; });
        localState.services = (await (await fetch("/docker/services")).json()).sort((a, b) => { return a['Spec']['Name'] > b['Spec']['Name'] ? 1 : -1; });
        localState.tasks = (await (await fetch("/docker/tasks")).json()).sort((a, b) => { return a['Status']['Timestamp'] < b['Status']['Timestamp'] ? 1 : -1; });
        localState.initialized = true;
        this.setState(localState);
    }

    componentDidMount() {
        this.loadData();
    }

    render() {
        let rows = this.state.tasks.map(task => {
            let currentNode = this.state.nodes.find(node => node['ID'] === task['NodeID']);
            let currentService = this.state.services.find(service => service['ID'] === task['ServiceID']);

            let currentNodeName = currentNode == null ? "" : currentNode['Description']['Hostname'];
            let currentServiceName = currentService == null ? "" : currentService['Spec']['Name'];
            let currentError = task['Status']['Err'] == null ? "" : task['Status']['Err'];
            return (
                <tr>
                    <td>{new Date(task['Status']['Timestamp']).toLocaleString()}</td>
                    <td><Label bsStyle={getStyleClassForState(task['Status']['State'])} className="ds-label">{task['Status']['State']} </Label></td>
                    <td>{task['DesiredState']}</td>
                    <td>{currentServiceName}</td>
                    <td>{currentNodeName}</td>
                    <td>{currentError}</td>
                </tr>
            );
        });
        return (
            <Table striped bordered condensed hover id="tasksTable">
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
        )
    }

}

export { TasksComponent };