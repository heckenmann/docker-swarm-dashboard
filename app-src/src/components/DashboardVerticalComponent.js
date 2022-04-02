import { Table, Badge } from 'react-bootstrap';
import { getStyleClassForState } from '../Helper';
import { Link } from 'react-router-dom';
import { DashboardSettingsComponent } from './DashboardSettingsComponent';
import { nodesAtom, servicesAtom, tasksAtom } from '../common/store/atoms';
import { useAtomValue } from 'jotai';

function DashboardVerticalComponent() {
    const services = useAtomValue(servicesAtom);
    const nodes = useAtomValue(nodesAtom);
    const tasks = useAtomValue(tasksAtom);

    const theads = [];
    const trows = [];

    // Columns
    nodes.forEach(node => {
        theads.push(
            <th key={'dashboardTable-' + node['ID']} className="dataCol"><div className="rotated"><Link to={'/nodes/' + node.ID}>{node.Description?.Hostname}</Link></div></th>
        );
    });
    theads.push(<th key='dashboardTable-empty'></th>);

    // Rows
    services.forEach(service => {
        const dataCols = nodes.map((node) => {
            const filteredTasks = tasks.filter((task) => {
                return task['ServiceID'] === service['ID']
                    && task['NodeID'] === node['ID']
                    && task['Status']['State'] !== 'shutdown'
                    && task['Status']['State'] !== 'complete';
            }).map(task => {
                return (
                    <li key={'li' + task['NodeID'] + task['ServiceID'] + task['ID'] + task['Status']}><Badge bg={getStyleClassForState(task['Status']['State'])} className='w-100'>{task['Status']['State']}</Badge></li>
                )
            });
            return (<td className='align-middle' key={'td' + service['ID'] + node['ID']}><ul>{filteredTasks}</ul></td>);

        });
        trows.push(
            <tr key={'tr' + service['ID']}>
                <td><Link to={'/services/' + service.ID}>{service.Spec.Name}</Link></td>
                <td>{service.Spec.Labels?.["com.docker.stack.namespace"]}</td>
                <td>{service['Spec']['Mode']['Replicated'] ? service['Spec']['Mode']['Replicated']['Replicas'] : Object.keys(service['Spec']['Mode'])}</td>
                {dataCols}
                <td></td>
            </tr>
        );
    });

    return (
        <>
            <DashboardSettingsComponent />
            <Table key="dashboardTable" id="dashboardTable" striped hover>
                <thead>
                    <tr>
                        <th className='col-md-4'>Service</th>
                        <th className='col-md-2'>Stack</th>
                        <th className='col-md-1'>Replication</th>
                        {theads}
                    </tr>
                </thead>
                <tbody>
                    {trows}
                </tbody>
            </Table>
        </>
    );
}

export { DashboardVerticalComponent };