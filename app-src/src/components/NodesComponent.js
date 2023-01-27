import {Badge, Card, Table} from 'react-bootstrap';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {useAtom, useAtomValue} from 'jotai';
import {
    currentVariantAtom,
    currentVariantClassesAtom,
    nodesAtom, nodesAtomNew,
    tableSizeAtom,
    useNewApiToogleAtom,
    viewAtom
} from '../common/store/atoms';
import {nodesDetailId} from '../common/navigationConstants';

function NodesComponent() {
    const useNewApi = useAtomValue(useNewApiToogleAtom);
    const currentVariant = useAtomValue(currentVariantAtom);
    const currentVariantClasses = useAtomValue(currentVariantClassesAtom);
    const [, updateView] = useAtom(viewAtom);
    const tableSize = useAtomValue(tableSizeAtom);
    const theads = [];
    const trows = [];


    theads.push(<th key='serviceTable-empty'></th>);

    if (useNewApi) {
        const nodes = useAtomValue(nodesAtomNew);
        nodes.forEach(node => {
            trows.push(
                <tr key={'tr' + node['ID']} className={node['State'] === 'ready' ? null : 'table-warning'}>
                    <td className='cursorPointer align-middle text-nowrap'
                        onClick={() => updateView({'id': nodesDetailId, 'detail': node.ID})}>
                        {node['Hostname']} {node['Leader'] &&
                        <FontAwesomeIcon icon='star'/>}
                    </td>
                    <td className='align-middle col-md-1'>{node['Role']}</td>
                    <td className='align-middle col-md-1'>
                        {
                            node['State'] === 'ready' &&
                            <Badge bg="success" className='w-100'>Ready</Badge>
                            ||
                            node['State'] === 'down' &&
                            <Badge bg='danger' className='w-100'>Down</Badge>
                            ||
                            <Badge bg='warning' className='w-100'>{node['State']}</Badge>
                        }
                    </td>
                    <td className='align-middle col-md-1'>
                        {
                            node['Availability'] === 'active' &&
                            <Badge bg='success' className='w-100'>{node['Availability']}</Badge>
                            ||
                            <Badge bg='warning' className='w-100'>{node['Availability']}</Badge>
                        }
                    </td>
                    <td className='align-middle col-md-1'>{node['StatusAddr']}</td>
                </tr>
            );
        });
    } else {
        const nodes = useAtomValue(nodesAtom);
        // Rows
        nodes.forEach(node => {
            trows.push(
                <tr key={'tr' + node['ID']} className={node['Status']['State'] === 'ready' ? null : 'danger'}>
                    <td className='cursorPointer align-middle text-nowrap'
                        onClick={() => updateView({'id': nodesDetailId, 'detail': node.ID})}>
                        {node['Description']['Hostname']} {node['ManagerStatus'] && node['ManagerStatus']['Leader'] &&
                        <FontAwesomeIcon icon='star'/>}
                    </td>
                    <td className='align-middle col-md-1'>{node['Spec']['Role']}</td>
                    <td className='align-middle col-md-1'>
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
                    <td className='align-middle col-md-1'>
                        {
                            node['Spec']['Availability'] === 'active' &&
                            <Badge bg='success' className='w-100'>{node['Spec']['Availability']}</Badge>
                            ||
                            <Badge bg='warning' className='w-100'>{node['Spec']['Availability']}</Badge>
                        }
                    </td>
                    <td className='align-middle col-md-1'>{node['ManagerStatus'] ? node['ManagerStatus']['Addr']?.split(':')[0] : node['Status']['Addr']}</td>
                </tr>
            );
        });
    }

    return (
        <Card bg={currentVariant} className={currentVariantClasses}>
            <Card.Body>
                <Table variant={currentVariant} key="nodesTable" id="nodesTable" striped size={tableSize}>
                    <thead>
                    <tr>
                        <th className="nodeAttribute">Node</th>
                        <th className="nodeAttributeSmall">Role</th>
                        <th className="nodeAttributeSmall">State</th>
                        <th className="nodeAttributeSmall">Availability</th>
                        <th className="nodeAttributeSmall">IP</th>
                    </tr>
                    </thead>
                    <tbody>
                    {trows}
                    </tbody>
                </Table>
            </Card.Body>
        </Card>
    );
}

export {NodesComponent};