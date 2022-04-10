import { Button, Card, Table } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { toDefaultDateTimeString } from '../common/DefaultDateTimeFormat'
import { currentVariantAtom, currentVariantClassesAtom, servicesAtom, viewDetailIdAtom, viewIdAtom } from '../common/store/atoms';
import { useAtom, useAtomValue } from 'jotai';
import { servicesDetailId } from '../common/navigationConstants';


function findServicesForStack(services, stackName) {
    const [, updateViewId] = useAtom(viewIdAtom);
    const [, updateViewDetailId] = useAtom(viewDetailIdAtom);

    return services.filter(service => service['Spec']['Labels']['com.docker.stack.namespace'] === stackName).sort((s0, s1) => s0 - s1).map(service =>
        <tr key={service.ID}>
            <td className='cursorPointer text-nowrap' onClick={() => {updateViewId(servicesDetailId); updateViewDetailId(service.ID);}}>{stackName ? service['Spec']['Name']?.substring(stackName.length + 1, service['Spec']['Name'].length) : service['Spec']['Name']}</td>
            <td>{service['Spec']['Mode']['Replicated'] ? service['Spec']['Mode']['Replicated']['Replicas'] : Object.keys(service['Spec']['Mode'])}</td>
            <td>{toDefaultDateTimeString(new Date(service['CreatedAt']))}</td>
            <td>{toDefaultDateTimeString(new Date(service['UpdatedAt']))}</td>
        </tr>
    )
}

function StacksComponent() {
    const services = useAtomValue(servicesAtom);
    const currentVariant = useAtomValue(currentVariantAtom);
    const currentVariantClasses = useAtomValue(currentVariantClassesAtom);

    const stacks = services.map(service => service['Spec']['Labels']['com.docker.stack.namespace']).filter((v, i, a) => a.indexOf(v) === i).sort((s0, s1) => s0 - s1).map(stack =>
        <Card bg={currentVariant} className={currentVariantClasses + ' mb-3'} key={'card_' + stack}>
            <Card.Header>
                <h5><FontAwesomeIcon icon="cubes" />{' '}{stack ? stack : '(without stack)'}</h5>
            </Card.Header>
            <Card.Body>
                <Table variant={currentVariant} size='sm' striped hover>
                    <thead>
                        <tr>
                            <th>Service Name</th>
                            <th className='col-md-1'>Replication</th>
                            <th className='col-md-2'>Created</th>
                            <th className='col-md-2'>Updated</th>
                        </tr>
                    </thead>
                    <tbody>
                        {findServicesForStack(services, stack)}
                    </tbody>
                </Table>
            </Card.Body>
        </Card>
    )

    return (
        <>
            {stacks}
        </>

    );
}

export { StacksComponent };
