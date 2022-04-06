import { Table, Badge, Card } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { currentVariantAtom, currentVariantClassesAtom, nodesAtom } from '../common/store/atoms';

function NodesComponent() {
    const nodes = useAtomValue(nodesAtom);
    const currentVariant = useAtomValue(currentVariantAtom);
    const currentVariantClasses = useAtomValue(currentVariantClassesAtom);
    const theads = [];
    const trows = [];

    theads.push(<th key='serviceTable-empty'></th>);

    // Rows
    nodes.forEach(node => {
        trows.push(
            <tr key={'tr' + node['ID']} className={node['Status']['State'] === 'ready' ? null : 'danger'}>
                <td className='align-middle text-nowrap'>
                    <Link to={'/nodes/' + node['ID']} >{node['Description']['Hostname']}  {node['ManagerStatus'] && node['ManagerStatus']['Leader'] && <FontAwesomeIcon icon='star' />}</Link>
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
                        node['Spec']['Availability'] === 'active' && <Badge bg='success' className='w-100'>{node['Spec']['Availability']}</Badge>
                        ||
                        <Badge bg='warning' className='w-100'>{node['Spec']['Availability']}</Badge>
                    }
                </td>
                <td className='align-middle col-md-1'>{node['ManagerStatus'] ? node['ManagerStatus']['Addr']?.split(':')[0] : node['Status']['Addr']}</td>
            </tr>
        );
    });

    return (
        <Card bg={currentVariant} className={currentVariantClasses}>
            <Card.Body>
                <Table variant={currentVariant} key="nodesTable" id="nodesTable" size='sm' striped>
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

export { NodesComponent };