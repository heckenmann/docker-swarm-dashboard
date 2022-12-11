import {Table, Badge, Button} from 'react-bootstrap';
import {getStyleClassForState} from '../Helper';
import {DashboardSettingsComponent} from './DashboardSettingsComponent';
import {
    currentVariantAtom,
    isDarkModeAtom,
    nodesAtom,
    servicesAtom,
    tasksAtom,
    viewDetailId,
    viewDetailIdAtom,
    viewAtom,
    useNewApiToogleAtom, dashboardHAtom, dashboardVAtom, tableSizeAtom
} from '../common/store/atoms';
import {useAtom, useAtomValue} from 'jotai';
import {nodesDetailId, servicesDetailId} from '../common/navigationConstants';
import {waitForAll} from 'jotai/utils';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";

function DashboardVerticalComponent() {
    const [services, nodes, tasks] = useAtomValue(waitForAll([servicesAtom, nodesAtom, tasksAtom]));
    const isDarkMode = useAtomValue(isDarkModeAtom);
    const currentVariant = useAtomValue(currentVariantAtom);
    const useNewApi = useAtomValue(useNewApiToogleAtom);
    const [, updateView] = useAtom(viewAtom);
    const tableSize = useAtomValue(tableSizeAtom);

    const theads = [];
    const trows = [];

    if (useNewApi) {
        const dashboardvData = useAtomValue(dashboardVAtom);
        const nodes = dashboardvData['Nodes']
        const services = dashboardvData['Services']
        // Columns
        nodes.forEach(node => {
            theads.push(
                <th key={'dashboardTable-' + node['ID']} className="dataCol cursorPointer"
                    onClick={() => updateView({'id': nodesDetailId, 'detail': node.ID})}>
                    <div className="rotated">{node['Hostname']}</div>
                </th>
            );
        });
        theads.push(<th key='dashboardTable-empty'></th>);

        services.forEach(service => {
                const dataCols = nodes.map(node =>
                    <td className='align-middle' key={'td' + node['ID'] + service['ID']}>
                        <ul>
                            {
                                service['Tasks'][node['ID']].map(task =>
                                    <li key={'li' + task['NodeID'] + task['ServiceID'] + task['ID'] + task['Status']}><Badge
                                        bg={getStyleClassForState(task['Status']['State'])}
                                        className='w-100'>{task['Status']['State']}</Badge></li>
                                )
                            }
                        </ul>
                    < /td>)

            trows.push(
                    <tr key={'tr' + service['ID']}>
                        <td className='cursorPointer' onClick={() => updateView({
                            'id': servicesDetailId,
                            'detail': service.ID
                        })}>{service['Name']}</td>
                        <td>{service['Stack']}</td>
                        <td>{service['Replication']}</td>
                        {dataCols}
                        <td></td>
                    </tr>
                );

            }
        )
    } else {
        // Columns
        nodes.forEach(node => {
            theads.push(
                <th key={'dashboardTable-' + node['ID']} className="dataCol cursorPointer"
                    onClick={() => updateView({'id': nodesDetailId, 'detail': node.ID})}>
                    <div className="rotated">{node.Description?.Hostname}</div>
                </th>
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
                        <li key={'li' + task['NodeID'] + task['ServiceID'] + task['ID'] + task['Status']}><Badge
                            bg={getStyleClassForState(task['Status']['State'])}
                            className='w-100'>{task['Status']['State']}</Badge></li>
                    )
                });
                return (<td className='align-middle' key={'td' + service['ID'] + node['ID']}>
                    <ul>{filteredTasks}</ul>
                </td>);

            });
            trows.push(
                <tr key={'tr' + service['ID']}>
                    <td className='cursorPointer' onClick={() => updateView({
                        'id': servicesDetailId,
                        'detail': service.ID
                    })}>{service.Spec.Name}</td>
                    <td>{service.Spec.Labels?.["com.docker.stack.namespace"]}</td>
                    <td>{service['Spec']['Mode']['Replicated'] ? service['Spec']['Mode']['Replicated']['Replicas'] : Object.keys(service['Spec']['Mode'])}</td>
                    {dataCols}
                    <td></td>
                </tr>
            );
        });
    }

    return (
        <>
            <DashboardSettingsComponent/>
            <Table variant={isDarkMode ? currentVariant : null} key="dashboardTable" id="dashboardTable" striped size={tableSize}>
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

export {DashboardVerticalComponent};