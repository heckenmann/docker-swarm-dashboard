import { Table, Badge, Button } from 'react-bootstrap';
import { getStyleClassForState } from '../Helper';
import { DashboardSettingsComponent } from './DashboardSettingsComponent';
import { currentVariantAtom, isDarkModeAtom, nodesAtom, servicesAtom, tasksAtom, viewDetailId, viewDetailIdAtom, viewAtom } from '../common/store/atoms';
import { useAtom, useAtomValue } from 'jotai';
import { nodesDetailId, servicesDetailId } from '../common/navigationConstants';
import { waitForAll } from 'jotai/utils';

function DashboardVerticalComponent() {
    const [services, nodes, tasks] = useAtomValue(waitForAll([servicesAtom, nodesAtom, tasksAtom]));
    const isDarkMode = useAtomValue(isDarkModeAtom);
    const currentVariant = useAtomValue(currentVariantAtom);
    const [, updateView] = useAtom(viewAtom);

    const theads = [];
    const trows = [];

    // Columns
    nodes.forEach(node => {
        theads.push(
            <th key={'dashboardTable-' + node['ID']} className="dataCol"><div className="rotated"><Button variant='link' onClick={() => updateView({ 'id': nodesDetailId, 'detail': node.ID })}>{node.Description?.Hostname}</Button></div></th>
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
            <tr key={'tr' + service['ID']} className='cursorPointer' onClick={() => updateView({ 'id': servicesDetailId, 'detail': service.ID })}>
                <td>{service.Spec.Name}</td>
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
            <Table variant={isDarkMode ? currentVariant : null} key="dashboardTable" id="dashboardTable" striped>
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