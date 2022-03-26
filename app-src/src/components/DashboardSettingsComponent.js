import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, ButtonGroup } from "react-bootstrap";
import { matchPath, useLocation } from "react-router";
import { LinkContainer } from "react-router-bootstrap";

function DashboardSettingsComponent() {
    let location = useLocation();
    let vertical = matchPath({ path: "/dashboard/vertical", caseSensitive: false, end: true }, location.pathname);
    return (
        <>
            <ButtonGroup>
                <LinkContainer to="/dashboard/horizontal">
                    <Button size="xl" style='width: 300px' variant={vertical ? "outline-secondary" : "secondary"} ><FontAwesomeIcon icon="grip" /></Button>
                </LinkContainer>
                <LinkContainer to="/dashboard/vertical">
                    <Button size="xl" style='width: 300px' variant={vertical ? "secondary" : "outline-secondary"}><FontAwesomeIcon icon="grip-vertical" /></Button>
                </LinkContainer>
            </ButtonGroup>
        </>
    );
}

export { DashboardSettingsComponent };