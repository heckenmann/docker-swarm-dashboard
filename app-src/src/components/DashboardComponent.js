import {Table, Badge, Button} from 'react-bootstrap';
import {getStyleClassForState} from '../Helper';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {DashboardSettingsComponent} from './DashboardSettingsComponent';
import {
    currentVariantAtom,
    isDarkModeAtom,
    nodesAtom,
    servicesAtom,
    tasksAtom,
    viewDetailIdAtom,
    viewAtom,
    useNewApiToogleAtom,
    dashboardHAtom,
    tableSizeAtom
} from '../common/store/atoms';
import {useAtom, useAtomValue} from 'jotai';
import {nodesDetailId, servicesDetailId} from '../common/navigationConstants';
import {waitForAll} from 'jotai/utils';

function DashboardComponent() {
    const isDarkMode = useAtomValue(isDarkModeAtom);
    const currentVariant = useAtomValue(currentVariantAtom);
    const useNewApi = useAtomValue(useNewApiToogleAtom);
    const [, updateView] = useAtom(viewAtom);
    const tableSize = useAtomValue(tableSizeAtom);

    const theads = [];
    const trows = [];

    if (useNewApi) {
        const dashboardhData = useAtomValue(dashboardHAtom);
        const services = dashboardhData['Services'];
        const nodes = dashboardhData['Nodes'];

        // Columns
        services.forEach(service => {
            theads.push(
                <th key={'dashboardTable-' + service['ID']} className="dataCol cursorPointer"
                    onClick={() => updateView({'id': servicesDetailId, 'detail': service.ID})}>
                    <div className="rotated">{service['Name']}</div>
                </th>
            );
        });
        theads.push(<th key='dashboardTable-empty'></th>);

        nodes.forEach(node => {
                const dataCols = services.filter(service => node['Tasks'][service['ID']]).map(service =>
                    <td className='align-middle' key={'td' + node['ID'] + service['ID']}>
                        <ul>
                            {
                                node['Tasks'][service['ID']].map(task =>
                                    <li key={'li' + task['NodeID'] + task['ServiceID'] + task['ID'] + task['Status']}><Badge
                                        bg={getStyleClassForState(task['Status']['State'])}
                                        className='w-100'>{task['Status']['State']}</Badge></li>
                                )
                            }
                        </ul>
                    < /td>
                )

                trows.push(
                    <tr key={'tr' + node['ID']} className={node['StatusState'] === 'ready' ? null : 'danger'}>
                        <td className='align-middle'>
                            <Button onClick={() => updateView({'id': nodesDetailId, 'detail': node.ID})}
                                    variant="secondary"
                                    size="sm"
                                    className='w-100 text-nowrap'>{node['Hostname']} {node['Leader'] &&
                                <FontAwesomeIcon icon='star'/>}</Button>
                        </td>
                        <td className='align-middle'>{node['Role']}</td>
                        <td className='align-middle'>
                            {
                                node['StatusState'] === 'ready' &&
                                <Badge bg="success" className='w-100'>Ready</Badge>
                                ||
                                node['StatusState'] === 'down' &&
                                <Badge bg='danger' className='w-100'>Down</Badge>
                                ||
                                <Badge bg='warning' className='w-100'>{node['StatusState']}</Badge>
                            }
                        </td>
                        <td className='align-middle'>
                            {
                                node['Availability'] === 'active' &&
                                <Badge bg='success' className='w-100'>{node['Availability']}</Badge>
                                ||
                                <Badge bg='warning' className='w-100'>{node['Availability']}</Badge>
                            }
                        </td>
                        <td className='align-middle'>{node['IP']}</td>
                        {dataCols}
                        <td></td>
                    </tr>
                )
            }
        )
    } else {
        const [services, nodes, tasks] = useAtomValue(waitForAll([servicesAtom, nodesAtom, tasksAtom]));
        // Columns
        services.forEach(service => {
            theads.push(
                <th key={'dashboardTable-' + service['ID']} className="dataCol cursorPointer"
                    onClick={() => updateView({'id': servicesDetailId, 'detail': service.ID})}>
                    <div className="rotated">{service['Spec']['Name']}</div>
                </th>
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
                        <li key={'li' + task['NodeID'] + task['ServiceID'] + task['ID'] + task['Status']}><Badge
                            bg={getStyleClassForState(task['Status']['State'])}
                            className='w-100'>{task['Status']['State']}</Badge></li>
                    )
                });
                return (<td className='align-middle' key={'td' + node['ID'] + service['ID']}>
                    <ul>{filteredTasks}</ul>
                </td>);

            });
            trows.push(
                <tr key={'tr' + node['ID']} className={node['Status']['State'] === 'ready' ? null : 'danger'}>
                    <td className='align-middle'>
                        <Button onClick={() => updateView({'id': nodesDetailId, 'detail': node.ID})} variant="secondary"
                                size="sm"
                                className='w-100 text-nowrap'>{node['Description']['Hostname']} {node['ManagerStatus'] && node['ManagerStatus']['Leader'] &&
                            <FontAwesomeIcon icon='star'/>}</Button>
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
                            node['Spec']['Availability'] === 'active' &&
                            <Badge bg='success' className='w-100'>{node['Spec']['Availability']}</Badge>
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
    }

    return (
        <>
            <DashboardSettingsComponent/>
            <Table variant={isDarkMode ? currentVariant : null} key="dashboardTable" id="dashboardTable"
                   striped size={tableSize}>
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

export {DashboardComponent};