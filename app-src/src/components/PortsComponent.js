import { Table, Card } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { servicesAtom } from '../common/store/atoms';

function PortsComponent() {
    const services = useAtomValue(servicesAtom);
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
                    <td><Link to={'/services/' + p.ServiceID}>{p.ServiceName}</Link></td>
                </tr>
            )
        });

    return (
        <Card bg='light'>
            <Card.Body>
                <Table id="portsTable" size="sm" striped hover>
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