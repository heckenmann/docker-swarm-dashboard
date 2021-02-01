import React, { Component } from 'react';
import { Table, FormLabel, Button } from 'react-bootstrap';
import { getStyleClassForState } from '../Helper';
import { NodeDetailComponent } from './NodeDetailComponent'

class ServicesComponent extends Component {

    state = {
        nodeDetailDialog: null
    }

    showNodeDetails = (nodeId) => {
        let localState = this.state;
        localState.nodeDetailDialog = nodeId;
        this.setState(localState);
    }

    hideNodeDetails = () => {
        let localState = this.state;
        localState.nodeDetailDialog = null;
        this.setState(localState);
    }

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
                        <li><FormLabel bsStyle={getStyleClassForState(task['Status']['State'])}>{task['Status']['State']}</FormLabel></li>
                    )
                });
                return (<td><ul>{tasks}</ul></td>);

            });
            trows.push(
                <tr className={node['Status']['State'] === 'ready' ? null : 'danger'}>
                    <td>
                        <NodeDetailComponent node={node} show={this.state.nodeDetailDialog === node['ID']} closeHandler={this.hideNodeDetails} />
                        <Button bsStyle="link" onClick={() => this.showNodeDetails(node['ID'])}>{node['Description']['Hostname']}</Button>
                        {
                            node['ManagerStatus'] && node['ManagerStatus']['Leader'] &&
                            <FormLabel bsStyle='primary'>Leader</FormLabel>
                        }
                    </td>
                    <td>{node['Spec']['Role']}</td>
                    <td>
                        {
                            node['Status']['State'] === 'ready' &&
                            <FormLabel bsStyle='success'>Ready</FormLabel>
                            ||
                            node['Status']['State'] === 'down' &&
                            <FormLabel bsStyle='danger'>Down</FormLabel>
                            ||
                            <FormLabel bsStyle='warning'>{node['Status']['State']}</FormLabel>
                        }
                    </td>
                    <td>
                        {
                            node['Spec']['Availability'] === 'active' && <FormLabel bsStyle='success'>{node['Spec']['Availability']}</FormLabel>
                            ||
                            <FormLabel bsStyle='warning'>{node['Spec']['Availability']}</FormLabel>
                        }
                    </td>
                    <td>{node['Status']['Addr']}</td>
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
                        <th className="nodeAttributeSmall">Role</th>
                        <th className="nodeAttributeSmall">State</th>
                        <th className="nodeAttributeSmall">Availability</th>
                        <th className="nodeAttributeSmall">IP</th>
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