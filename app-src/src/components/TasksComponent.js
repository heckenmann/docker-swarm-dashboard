import { useAtom, useAtomValue } from 'jotai';
import { Table, Badge, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { toDefaultDateTimeString } from '../common/DefaultDateTimeFormat';
import { nodesAtom, servicesAtom, tasksAtom } from '../common/store/atoms';
import { getStyleClassForState } from '../Helper';

function TasksComponent() {
    const services = useAtomValue(servicesAtom);
    const nodes = useAtomValue(nodesAtom);
    const tasks = useAtomValue(tasksAtom);

    const rows = tasks.map(task => {
        const currentNode = nodes.find(node => node['ID'] === task['NodeID']);
        const currentService = services.find(service => service['ID'] === task['ServiceID']);

        const currentNodeName = currentNode == null ? "" : currentNode['Description']['Hostname'];
        const currentServiceName = currentService == null ? "" : currentService['Spec']['Name'];
        const currentError = task['Status']['Err'] == null ? "" : task['Status']['Err'];
        return (
            <tr key={'tasksTable-' + task['ID']}>
                <td>{toDefaultDateTimeString(new Date(task['Status']['Timestamp']))}</td>
                <td><Badge className='w-100' bg={getStyleClassForState(task['Status']['State'])}>{task['Status']['State']} </Badge></td>
                <td>{task['DesiredState']}</td>
                <td><Link to={'/services/' + currentService.ID}>{currentServiceName}</Link></td>
                <td><Link to={'/nodes/' + currentNode.ID}>{currentNodeName}</Link></td>
                <td>{currentError}</td>
            </tr>
        );
    });
    return (
        <Card bg='light'>
            <Card.Body>
                <Table striped hover id="tasksTable" size="sm">
                    <thead>
                        <tr>
                            <th id="timestampCol">Timestamp</th>
                            <th id="stateCol">State</th>
                            <th id="desiredstateCol">DesiredState</th>
                            <th id="serviceCol">ServiceName</th>
                            <th id="nodeCol">Node</th>
                            <th>Error</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows}
                    </tbody>
                </Table>
            </Card.Body>
        </Card>
    )
}

export { TasksComponent };