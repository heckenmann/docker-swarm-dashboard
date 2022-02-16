import React, { Component } from 'react';
import { Card, Table, Badge, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { toDefaultDateTimeString } from '../common/DefaultDateTimeFormat'

class StacksComponent extends Component {

    findServicesForStack = (stackName) => {
        return this.props.state.services.filter(service => service['Spec']['Labels']['com.docker.stack.namespace'] === stackName).sort((s0, s1) => s0 - s1).map(service =>
            <>
                <tr>
                    <td className='text-nowrap'>{ stackName ? service['Spec']['Name']?.substring(stackName.length + 1, service['Spec']['Name'].length) : service['Spec']['Name'] }</td>
                    <td>{ service['Spec']['Mode']['Replicated'] ? service['Spec']['Mode']['Replicated']['Replicas'] : Object.keys(service['Spec']['Mode']) }</td>
                    <td>{ toDefaultDateTimeString(new Date(service['CreatedAt'])) }</td>
                    <td>{ toDefaultDateTimeString(new Date(service['UpdatedAt'])) }</td>
                </tr>
            </>
        )
    }

    render() {
        if (!this.props.state || !this.props.state.initialized) {
            return (<div></div>);
        }

        let stacks = this.props.state.services.map(service => service['Spec']['Labels']['com.docker.stack.namespace']).filter((v, i, a) => a.indexOf(v) === i).sort((s0, s1) => s0 - s1).map(s =>
            <>
                <Card bg='light'>
                    <Card.Header>
                        <h5><FontAwesomeIcon icon="cubes" />{' '}{s ? s : '(without stack)'}</h5>
                    </Card.Header>
                    <Card.Body>
                        <Table size='sm'>
                            <thead>
                                <tr>
                                    <th>Service Name</th>
                                    <th className='col-md-1'>Replication</th>
                                    <th className='col-md-2'>Created</th>
                                    <th className='col-md-2'>Updated</th>
                                </tr>
                            </thead>
                            <tbody>
                                { this.findServicesForStack(s) }
                            </tbody>
                        </Table>
                    </Card.Body>
                </Card>
                <br />
            </>
        )

        return (
            <>
                {stacks}
            </>

        );
    }
}

export { StacksComponent };
