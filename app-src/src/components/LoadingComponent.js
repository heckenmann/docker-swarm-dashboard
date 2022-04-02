import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Card } from "react-bootstrap";
import { CSSTransition } from 'react-transition-group';

function LoadingComponent() {
    return(
        <Card bg='light' className='mb-3'>
            <Card.Body>
                <h1><FontAwesomeIcon icon='spinner' /> Loading...</h1>
            </Card.Body>
        </Card>
    )
}

export default LoadingComponent;