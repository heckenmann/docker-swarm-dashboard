import { Table, Card } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAtom, useAtomValue } from 'jotai';
import {
    currentVariantAtom,
    currentVariantClassesAtom,
    servicesAtom,
    viewDetailIdAtom,
    viewAtom,
    tableSizeAtom
} from '../common/store/atoms';
import { servicesDetailId } from '../common/navigationConstants';

function PortsComponent() {
    const services = useAtomValue(servicesAtom);
    const currentVariant = useAtomValue(currentVariantAtom);
    const currentVariantClasses = useAtomValue(currentVariantClassesAtom);
    const [, updateView] = useAtom(viewAtom);
    const tableSize = useAtomValue(tableSizeAtom);

    const ports = [];
    services.filter(s => s.Spec && s.Spec.Name && s.Endpoint && s.Endpoint.Ports)
        .forEach(s => {
            s.Endpoint.Ports.forEach(port => {
                port.ServiceName = s.Spec.Name;
                port.ServiceID = s.ID;
                ports.push(port);
            });
        });

    const renderedServices = ports
        .sort((p1, p2) => p1.PublishedPort - p2.PublishedPort)
        .map(p => {
            return (
                <tr key={p.PublishedPort}>
                    <td>{p.PublishedPort}</td>
                    <td><FontAwesomeIcon icon="arrow-right" /></td>
                    <td>{p.TargetPort}</td>
                    <td>{p.Protocol}</td>
                    <td>{p.PublishMode}</td>
                    <td className='cursorPointer' onClick={() => updateView({'id': servicesDetailId, 'detail': p.ServiceID})}>{p.ServiceName}</td>
                </tr>
            )
        });

    return (
        <Card bg={currentVariant} className={currentVariantClasses}>
            <Card.Body>
                <Table id="portsTable" variant={currentVariant} size="sm" striped size={tableSize}>
                    <thead>
                        <tr>
                            <th id="publishedPort">PublishedPort</th>
                            <th id="arrow"></th>
                            <th id="targetPort">TargetPort</th>
                            <th id="protocol">Protocol</th>
                            <th id="publishMode">PublishMode</th>
                            <th id="serviceName">ServiceName</th>
                        </tr>
                    </thead>
                    <tbody>
                        {renderedServices}
                    </tbody>
                </Table>
            </Card.Body>
        </Card>
    )
}

export { PortsComponent };