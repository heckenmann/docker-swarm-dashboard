import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {useAtomValue} from "jotai";
import {Card} from "react-bootstrap";
import {currentVariantAtom, currentVariantClassesAtom} from "../common/store/atoms";

function LoadingComponent() {
    const currentVariant = useAtomValue(currentVariantAtom);
    const currentVariantClasses = useAtomValue(currentVariantClassesAtom);
    return(
        <Card bg={currentVariant} className={currentVariantClasses}>
            <Card.Body>
                <h1><FontAwesomeIcon icon='spinner' className="rotating" /> Loading ...</h1>
            </Card.Body>
        </Card>
    )
}

export default LoadingComponent;