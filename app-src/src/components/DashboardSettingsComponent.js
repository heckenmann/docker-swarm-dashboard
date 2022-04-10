import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useAtom } from "jotai";
import { Button, ButtonGroup } from "react-bootstrap";
import { dashboardHId, dashboardVId } from "../common/navigationConstants";
import { viewIdAtom } from "../common/store/atoms";

function DashboardSettingsComponent() {
    const [viewId, updateViewId] = useAtom(viewIdAtom);
    const vertical = viewId == dashboardVId;
    return (
        <>
            <ButtonGroup>
                <Button size="xl" variant={vertical ? "outline-secondary" : "secondary"} onClick={() => updateViewId(dashboardHId)}><FontAwesomeIcon icon="grip" /></Button>
                <Button size="xl" variant={vertical ? "secondary" : "outline-secondary"} onClick={() => updateViewId(dashboardVId)}><FontAwesomeIcon icon="grip-vertical" /></Button>
            </ButtonGroup>
        </>
    );
}

export { DashboardSettingsComponent };