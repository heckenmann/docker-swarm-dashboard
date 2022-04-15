import { useAtomValue } from "jotai"
import { aboutId, dashboardHId, dashboardVId, logsId, nodesDetailId, nodesId, portsId, servicesDetailId, stacksId, tasksId } from "../common/navigationConstants"
import { viewAtom } from "../common/store/atoms"
import { AboutComponent } from "./AboutComponent"
import { DashboardComponent } from "./DashboardComponent"
import { DashboardVerticalComponent } from "./DashboardVerticalComponent"
import { DetailsNodeComponent } from "./DetailsNodeComponent"
import { DetailsServiceComponent } from "./DetailsServiceComponent"
import { LogsComponent } from "./LogsComponent"
import { NodesComponent } from "./NodesComponent"
import { PortsComponent } from "./PortsComponent"
import { StacksComponent } from "./StacksComponent"
import { TasksComponent } from "./TasksComponent"

export function ContentRouter() {
    const viewId = useAtomValue(viewAtom)

    let view = null;
    switch (viewId?.id) {
        case dashboardHId: view = <DashboardComponent />;
            break;
        case dashboardVId: view = <DashboardVerticalComponent />;
            break;
        case servicesDetailId: view = <DetailsServiceComponent />;
            break;
        case stacksId: view = <StacksComponent />;
            break;
        case portsId: view = <PortsComponent />;
            break;
        case nodesId: view = <NodesComponent />;
            break;
        case nodesDetailId: view = <DetailsNodeComponent />;
            break;
        case tasksId: view = <TasksComponent />;
            break;
        case aboutId: view = <AboutComponent />;
            break;
        case logsId: view = <LogsComponent />;
            break;
        default: view = <DashboardComponent />;
    }

    return view;
}