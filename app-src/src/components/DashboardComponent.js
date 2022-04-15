import { Table, Badge, Button } from 'react-bootstrap';
import { getStyleClassForState } from '../Helper';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { DashboardSettingsComponent } from './DashboardSettingsComponent';
import { currentVariantAtom, isDarkModeAtom, nodesAtom, servicesAtom, tasksAtom, viewDetailIdAtom, viewAtom } from '../common/store/atoms';
import { useAtom, useAtomValue } from 'jotai';
import { nodesDetailId, servicesDetailId } from '../common/navigationConstants';
import { waitForAll } from 'jotai/utils';

function DashboardComponent() {
    const [services, nodes, tasks] = useAtomValue(waitForAll([servicesAtom, nodesAtom, tasksAtom]));
    const isDarkMode = useAtomValue(isDarkModeAtom);
    const currentVariant = useAtomValue(currentVariantAtom);
    const [, updateView] = useAtom(viewAtom);

    const theads = [];
    const trows = [];

    // Columns
    services.forEach(service => {
        theads.push(
            <th key={'dashboardTable-' + service['ID']} className="dataCol"><div className="rotated"><Button variant='link' onClick={() => updateView({'id': servicesDetailId, 'detail': service.ID})}>{service['Spec']['Name']}</Button></div></th>
        );
    });
    theads.push(<th key='dashboardTable-empty'></th>);

    // Rows
    nodes.forEach(node => {
        const dataCols = services.map(service => {
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
            return (<td className='align-middle' key={'td' + node['ID'] + service['ID']}><ul>{filteredTasks}</ul></td>);

        });
        trows.push(
            <tr key={'tr' + node['ID']} className={node['Status']['State'] === 'ready' ? null : 'danger'}>
                <td className='align-middle'>
                    <Button onClick={() => updateView({'id': nodesDetailId, 'detail': node.ID})} variant="secondary" size="sm" className='w-100 text-nowrap'>{node['Description']['Hostname']}  {node['ManagerStatus'] && node['ManagerStatus']['Leader'] && <FontAwesomeIcon icon='star' />}</Button>
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
        <>
            <DashboardSettingsComponent />
            <Table variant={isDarkMode ? currentVariant : null} key="dashboardTable" id="dashboardTable" striped>
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
        </>
    );
}

export { DashboardComponent };