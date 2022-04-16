import { useAtomValue } from 'jotai';
import { Table, Card } from 'react-bootstrap';
import { currentVariantAtom, currentVariantClassesAtom } from '../common/store/atoms';

function AboutComponent() {
    const currentVariant = useAtomValue(currentVariantAtom);
    const currentVariantClasses = useAtomValue(currentVariantClassesAtom);

    return (
        <Card bg={currentVariant} className={currentVariantClasses}>
            <Card.Body>
                <h1>
                    Docker Swarm Dashboard <small>by heckenmann</small>
                </h1>
                <Table variant={currentVariant}>
                    <tbody>
                        <tr>
                            <td>License:</td>
                            <td><a href="https://github.com/heckenmann/docker-swarm-dashboard/blob/master/LICENSE">https://github.com/heckenmann/docker-swarm-dashboard/blob/master/LICENSE</a></td>
                        </tr>
                        <tr>
                            <td>GitHub-Project:</td>
                            <td><a href="https://github.com/heckenmann/docker-swarm-dashboard">https://github.com/heckenmann/docker-swarm-dashboard</a></td>
                        </tr>
                        <tr>
                            <td>Docker Registry:</td>
                            <td><a href="https://github.com/heckenmann/docker-swarm-dashboard/pkgs/container/docker-swarm-dashboard">https://github.com/heckenmann/docker-swarm-dashboard/pkgs/container/docker-swarm-dashboard</a></td>
                        </tr>
                    </tbody>
                </Table>
            </Card.Body>
        </Card >
    );
}

export { AboutComponent };