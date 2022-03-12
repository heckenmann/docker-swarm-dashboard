import { Table, Badge, Button } from 'react-bootstrap';
import { getStyleClassForState } from '../Helper';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link } from 'react-router-dom';

function ServicesComponent(props) {
    if (!props.state || !props.state.initialized) {
        return (<div></div>);
    }
    let theads = [];
    let trows = [];

    // Columns
    props.state.services.forEach(service => {
        theads.push(
            <th key={'serviceTable-' + service['ID']} className="dataCol"><div className="rotated"><Link to={'/services/' + service.ID}>{service['Spec']['Name']}</Link></div></th>
        );
    });
    theads.push(<th key='serviceTable-empty'></th>);

    // Rows
    props.state.nodes.forEach(node => {
        let dataCols = props.state.services.map(service => {
            let tasks = props.state.tasks.filter((task) => {
                return task['ServiceID'] === service['ID']
                    && task['NodeID'] === node['ID']
                    && task['Status']['State'] !== 'shutdown'
                    && task['Status']['State'] !== 'complete';
            }).map(task => {
                return (
                    <li key={'li' + task['NodeID'] + task['ServiceID'] + task['ID'] + task['Status']}><Badge bg={getStyleClassForState(task['Status']['State'])} className='w-100'>{task['Status']['State']}</Badge></li>
                )
            });
            return (<td className='align-middle' key={'td' + node['ID'] + service['ID']}><ul>{tasks}</ul></td>);

        });
        trows.push(
            <tr key={'tr' + node['ID']} className={node['Status']['State'] === 'ready' ? null : 'danger'}>
                <td className='align-middle'>
                    <Link to={'/nodes/' + node['ID']} ><Button variant="secondary" size="sm" className='w-100 text-nowrap'>{node['Description']['Hostname']}  {node['ManagerStatus'] && node['ManagerStatus']['Leader'] && <FontAwesomeIcon icon='star' />}</Button></Link>
                </td>
                <td className='align-middle'>{node['Spec']['Role']}</td>
                <td className='align-middle'>
                    {
                        node['Status']['State'] === 'ready' &&
                        <Badge bg="success" className='w-100'>Ready</Badge>
                        ||
                        node['Status']['State'] === 'down' &&
                        <Badge bg='danger' className='w-100'>Down</Badge>
                        ||
                        <Badge bg='warning' className='w-100'>{node['Status']['State']}</Badge>
                    }
                </td>
                <td className='align-middle'>
                    {
                        node['Spec']['Availability'] === 'active' && <Badge bg='success' className='w-100'>{node['Spec']['Availability']}</Badge>
                        ||
                        <Badge bg='warning' className='w-100'>{node['Spec']['Availability']}</Badge>
                    }
                </td>
                <td className='align-middle'>{node['ManagerStatus'] ? node['ManagerStatus']['Addr']?.split(':')[0] : node['Status']['Addr']}</td>
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

export { ServicesComponent };