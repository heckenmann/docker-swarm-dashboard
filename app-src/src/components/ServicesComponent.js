import React, { Component } from 'react';
import { Table, Label, Button } from 'react-bootstrap';
import { getStyleClassForState } from '../Helper';

class ServicesComponent extends Component {

    state = {
        initialized: false,
        nodes: [],
        services: [],
        tasks: []
    }

    componentDidMount() {
        this.loadData();
    }

    async loadData() {
        let localState = this.state;
        localState.nodes = (await (await fetch("/docker/nodes")).json()).sort((a, b) => { return a['Description']['Hostname'] > b['Description']['Hostname'] ? 1 : -1; });
        localState.services = (await (await fetch("/docker/services")).json()).sort((a, b) => { return a['Spec']['Name'] > b['Spec']['Name'] ? 1 : -1; });
        localState.tasks = (await (await fetch("/docker/tasks")).json()).sort((a, b) => { return a['Status']['Timestamp'] < b['Status']['Timestamp'] ? 1 : -1; });
        localState.initialized = true;
        this.setState(localState);
    }

    render() {
        if (!this.state.initialized) {
            return (<div></div>);
        }
        let theads = [];
        let trows = [];

        // Columns
        this.state.services.forEach(service => {
            theads.push(
                <th className="dataCol"><div className="rotated">{service['Spec']['Name']}</div></th>
            );
        });
        theads.push(<th></th>);

        // Rows
        this.state.nodes.forEach(node => {
            let dataCols = this.state.services.map(service => {
                let label = this.state.tasks.filter(task => {
                    return task['NodeID'] === node['ID']
                        && task['ServiceID'] === service['ID']
                        && task['Status']['State'] !== 'shutdown'
                        && task['Status']['State'] !== 'complete';
                }).map(task => {
                    return (
                        <div><Label bsStyle={getStyleClassForState(task['Status']['State'])}>{task['Status']['State']}</Label></div>
                    )
                });
                return (
                    <td>{label}</td>
                )
            });
            trows.push(
                <tr>
                    <td ref={node['ID']}>{node['Description']['Hostname']} {node['Status']['Addr']}</td>
                    {dataCols}
                    <td></td>
                </tr>
            );
        });

        return (
            <Table id="containerTable" striped condensed hover>
                <thead>
                    <tr>
                        <th id="firstCol"></th>
                        {theads}
                    </tr>
                </thead>
                <tbody>
                    {trows}
                </tbody>
            </Table>
        );
    }
}

export { ServicesComponent };