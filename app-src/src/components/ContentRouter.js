import { useAtomValue } from 'jotai'
import {
  aboutId,
  dashboardHId,
  dashboardVId,
  debugId,
  logsId,
  nodesDetailId,
  nodesId,
  portsId,
  servicesDetailId,
  settingsId,
  stacksId,
  tasksId,
  timelineId,
  versionUpdateId,
} from '../common/navigationConstants'
import {
  dashboardSettingsDefaultLayoutViewIdAtom,
  viewAtom,
} from '../common/store/atoms'
import { AboutComponent } from './AboutComponent'
import { DashboardComponent } from './DashboardComponent'
import { DashboardVerticalComponent } from './DashboardVerticalComponent'
import { TimelineComponent } from './TimelineComponent'
import { DetailsNodeComponent } from './DetailsNodeComponent'
import { DetailsServiceComponent } from './DetailsServiceComponent'
import { LogsComponent } from './LogsComponent'
import { NodesComponent } from './NodesComponent'
import { PortsComponent } from './PortsComponent'
import { StacksComponent } from './StacksComponent'
import { TasksComponent } from './TasksComponent'
import { SettingsComponent } from './SettingsComponent'
import { DebugComponent } from './DebugComponent'
import { VersionUpdateComponent } from './VersionUpdateComponent'

/**
 * ContentRouter component that determines which view to render
 * based on the current view ID from the state.
 *
 * @returns {JSX.Element} The component corresponding to the current view ID.
 */
export function ContentRouter() {
  const getView = useAtomValue(viewAtom)
  const defaultLayout = useAtomValue(dashboardSettingsDefaultLayoutViewIdAtom)

  const idToRenderInitial = getView.id

  // Default Dashboard
  const idToRender = idToRenderInitial || defaultLayout
  const viewMap = {}
  /**
   * A mapping of view IDs to their corresponding React components.
   * This is used to dynamically render the appropriate component
   * based on the current view ID.
   */
  const componentMap = {
    [dashboardHId]: <DashboardComponent />,
    [dashboardVId]: <DashboardVerticalComponent />,
    [timelineId]: <TimelineComponent />,
    [servicesDetailId]: <DetailsServiceComponent />,
    [stacksId]: <StacksComponent />,
    [portsId]: <PortsComponent />,
    [nodesId]: <NodesComponent />,
    [nodesDetailId]: <DetailsNodeComponent />,
    [tasksId]: <TasksComponent />,
    [aboutId]: <AboutComponent />,
    [settingsId]: <SettingsComponent />,
    [logsId]: <LogsComponent />,
    [debugId]: <DebugComponent />,
    [versionUpdateId]: <VersionUpdateComponent />,
  }

  return componentMap[idToRender] || <DashboardComponent />
}
