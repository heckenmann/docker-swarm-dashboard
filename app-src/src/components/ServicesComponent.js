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
                let tasks = this.props.state.tasks.filter((task) => {
                    return task['ServiceID'] === service['ID']
                        && task['NodeID'] === node['ID']
                        && task['Status']['State'] !== 'shutdown'
                        && task['Status']['State'] !== 'complete';
                }).map(task => {
                    return (
                        <li><Label bsStyle={getStyleClassForState(task['Status']['State'])}>{task['Status']['State']}</Label></li>
                    )
                });
                return (<td><ul>{tasks}</ul></td>);

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