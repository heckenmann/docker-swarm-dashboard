import { useAtom, useAtomValue } from 'jotai';
import { waitForAll } from 'jotai/utils';
import { Table, Badge, Card } from 'react-bootstrap';
import { toDefaultDateTimeString } from '../common/DefaultDateTimeFormat';
import { nodesDetailId, servicesDetailId } from '../common/navigationConstants';
import { currentVariantAtom, currentVariantClassesAtom, nodesAtom, servicesAtom, tasksAtom, viewDetailIdAtom, viewIdAtom } from '../common/store/atoms';
import { getStyleClassForState } from '../Helper';

function TasksComponent() {
    const [services, nodes, tasks] = useAtomValue(waitForAll([servicesAtom, nodesAtom, tasksAtom]));
    const currentVariant = useAtomValue(currentVariantAtom);
    const currentVariantClasses = useAtomValue(currentVariantClassesAtom);

    const rows = tasks.map(task => {
        const currentNode = nodes.find(node => node['ID'] === task['NodeID']);
        const currentService = services.find(service => service['ID'] === task['ServiceID']);
        const [, updateViewId] = useAtom(viewIdAtom);
        const [, updateViewDetailId] = useAtom(viewDetailIdAtom);

        const currentNodeName = currentNode == null ? "" : currentNode['Description']['Hostname'];
        const currentServiceName = currentService == null ? "" : currentService['Spec']['Name'];
        const currentError = task['Status']['Err'] == null ? "" : task['Status']['Err'];

        return (
            <tr key={'tasksTable-' + task['ID']}>
                <td>{toDefaultDateTimeString(new Date(task['Status']['Timestamp']))}</td>
                <td><Badge className='w-100' bg={getStyleClassForState(task['Status']['State'])}>{task['Status']['State']} </Badge></td>
                <td>{task['DesiredState']}</td>
                <td className='cursorPointer' key={currentService.ID} onClick={() => { updateViewId(servicesDetailId); updateViewDetailId(currentService.ID); }}>{currentServiceName}</td>
                <td className='cursorPointer' key={currentNode.ID} onClick={() => { updateViewId(nodesDetailId); updateViewDetailId(currentNode.ID); }}>{currentNodeName}</td>
                <td>{currentError}</td>
            </tr>
        );
    });
    return (
        <Card className={currentVariantClasses}>
            <Card.Body>
                <Table id="tasksTable" variant={currentVariant} striped size="sm">
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