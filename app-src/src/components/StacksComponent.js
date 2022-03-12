import { Card, Table } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { toDefaultDateTimeString } from '../common/DefaultDateTimeFormat'
import { Link } from 'react-router-dom';


function findServicesForStack(props, stackName) {
    return props.state.services.filter(service => service['Spec']['Labels']['com.docker.stack.namespace'] === stackName).sort((s0, s1) => s0 - s1).map(service =>
        <tr>
            <td className='text-nowrap'><Link to={'/services/' + service.ID} >{stackName ? service['Spec']['Name']?.substring(stackName.length + 1, service['Spec']['Name'].length) : service['Spec']['Name']}</Link></td>
            <td>{service['Spec']['Mode']['Replicated'] ? service['Spec']['Mode']['Replicated']['Replicas'] : Object.keys(service['Spec']['Mode'])}</td>
            <td>{toDefaultDateTimeString(new Date(service['CreatedAt']))}</td>
            <td>{toDefaultDateTimeString(new Date(service['UpdatedAt']))}</td>
        </tr>
    )
}

function StacksComponent(props) {

    if (!props.state || !props.state.initialized) {
        return (<></>);
    }

    let stacks = props.state.services.map(service => service['Spec']['Labels']['com.docker.stack.namespace']).filter((v, i, a) => a.indexOf(v) === i).sort((s0, s1) => s0 - s1).map(stack =>
        <Card bg='light' className='mb-3' key={stack}>
            <Card.Header>
                <h5><FontAwesomeIcon icon="cubes" />{' '}{stack ? stack : '(without stack)'}</h5>
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
                        {findServicesForStack(props, stack)}
                    </tbody>
                </Table>
            </Card.Body>
        </Card>
    )

    return (
        <>
            {stacks}
        </>

    );
}

export { StacksComponent };
