import React, { Component } from 'react';
import { Table, Badge, Button } from 'react-bootstrap';
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
                <th key={'serviceTable-' + service['ID']} className="dataCol"><div className="rotated">{service['Spec']['Name']}</div></th>
            );
        });
        theads.push(<th key='serviceTable-empty'></th>);

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
                        <li key={'li' + task['NodeID'] + task['ServiceID'] + task['ID'] + task['Status']}><Badge variant={getStyleClassForState(task['Status']['State'])} className='w-100'>{task['Status']['State']}</Badge></li>
                    )
                });
                return (<td key={'td' + node['ID'] + service['ID']}><ul>{tasks}</ul></td>);

            });
            trows.push(
                <tr key={'tr' + node['ID']} className={node['Status']['State'] === 'ready' ? null : 'danger'}>
                    <td>
                        <NodeDetailComponent node={node} show={this.state.nodeDetailDialog === node['ID']} closeHandler={this.hideNodeDetails} />
                        <Button variant="link" size="sm" onClick={() => this.showNodeDetails(node['ID'])}>{node['Description']['Hostname']}</Button>
                    </td>
                    <td>{node['Spec']['Role']}</td>
                    <td>
                        {
                            node['Status']['State'] === 'ready' &&
                            <Badge variant="success" className='w-100'>Ready</Badge>
                            ||
                            node['Status']['State'] === 'down' &&
                            <Badge variant='danger' className='w-100'>Down</Badge>
                            ||
                            <Badge variant='warning' className='w-100'>{node['Status']['State']}</Badge>
                        }
                    </td>
                    <td>
                        {
                            node['Spec']['Availability'] === 'active' && <Badge variant='success' className='w-100'>{node['Spec']['Availability']}</Badge>
                            ||
                            <Badge variant='warning' className='w-100'>{node['Spec']['Availability']}</Badge>
                        }
                    </td>
                    <td>{node['Status']['Addr']}</td>
                    {dataCols}
                    <td></td>
                </tr>
            );
        });

        return (
            <Table key="serviceTable" id="serviceTable" striped hover>
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