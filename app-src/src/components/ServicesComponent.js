import React, { Component } from 'react';
import { Table, Label, Button } from 'react-bootstrap';
import { getStyleClassForState } from '../Helper';

class ServicesComponent extends Component {

    render() {
        if (!this.props.state || !this.props.state.initialized) {
            return (<div></div>);
        }
        let theads = [];
        let trows = [];

        // Columns
        this.props.state.services.forEach(service => {
            theads.push(
                <th className="dataCol"><div className="rotated">{service['Spec']['Name']}</div></th>
            );
        });
        theads.push(<th></th>);

        // Rows
        this.props.state.nodes.forEach(node => {
            let dataCols = this.props.state.services.map(service => {
                // Show only the last state. Array is sorted by timestamp.
                let lastTask = this.props.state.tasks.find(task => {
                    return task['ServiceID'] === service['ID']
                        && task['Status']['State'] !== 'shutdown'
                        && task['Status']['State'] !== 'complete';
                });
                if (lastTask && lastTask['NodeID'] === node['ID']) {
                    return (
                        <td><Label bsStyle={getStyleClassForState(lastTask['Status']['State'])}>{lastTask['Status']['State']}</Label></td>
                    )
                } else {
                    return (
                        <td></td>
                    )
                }
            });
            trows.push(
                <tr>
                    <td ref={node['ID']}>{node['Description']['Hostname']}</td>
                    <td>{node['Status']['Addr']}</td>
                    <td>{node['Spec']['Role']}</td>
                    {dataCols}
                    <td></td>
                </tr>
            );
        });

        return (
            <Table id="containerTable" striped condensed hover>
                <thead>
                    <tr>
                        <th className="nodeAttribute">Node</th>
                        <th className="nodeAttributeSmall">IP</th>
                        <th className="nodeAttributeSmall">Role</th>
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