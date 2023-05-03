import { Badge, Table } from 'react-bootstrap';
import { getStyleClassForState } from '../Helper';
import { DashboardSettingsComponent } from './DashboardSettingsComponent';
import {
    currentVariantAtom,
    dashboardVAtom,
    isDarkModeAtom,
    tableSizeAtom,
    viewAtom
} from '../common/store/atoms';
import { useAtom, useAtomValue } from 'jotai';
import { nodesDetailId, servicesDetailId } from '../common/navigationConstants';

function DashboardVerticalComponent() {

    const isDarkMode = useAtomValue(isDarkModeAtom);
    const currentVariant = useAtomValue(currentVariantAtom);
    const [, updateView] = useAtom(viewAtom);
    const tableSize = useAtomValue(tableSizeAtom);

    const theads = [];
    const trows = [];

    const dashboardvData = useAtomValue(dashboardVAtom);
    const nodes = dashboardvData['Nodes']
    const services = dashboardvData['Services']
    // Columns
    nodes.forEach(node => {
        theads.push(
            <th key={'dashboardTable-' + node['ID']} className="dataCol cursorPointer"
                onClick={() => updateView({ 'id': nodesDetailId, 'detail': node.ID })}>
                <div className="rotated">{node['Hostname']}</div>
            </th>
        );
    });
    theads.push(<th key='dashboardTable-empty'></th>);

    services.forEach(service => {
        const dataCols = nodes.map(node =>
            <td className='align-middle' key={'td' + node['ID'] + service['ID']}>
                {
                    service['Tasks'][node['ID']] &&
                    <ul>
                        {
                            service['Tasks'][node['ID']].map(task =>
                                <li key={'li' + task['NodeID'] + task['ServiceID'] + task['ID'] + task['Status']}>
                                    <Badge
                                        bg={getStyleClassForState(task['Status']['State'])}
                                        className='w-100'>{task['Status']['State']}</Badge></li>
                            )
                        }
                    </ul>
                }
            </td>)

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

    })


    return (
        <>
            <DashboardSettingsComponent />
            <Table variant={isDarkMode ? currentVariant : null} key="dashboardTable" id="dashboardTable" striped
                size={tableSize}>
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