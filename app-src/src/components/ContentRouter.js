import { useAtomValue } from 'jotai'
import { useEffect, useState } from 'react'
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
import { DashboardComponent } from './DashboardComponent'
import { DashboardVerticalComponent } from './DashboardVerticalComponent'
import { TimelineComponent } from './TimelineComponent'
import { DetailsServiceComponent } from './DetailsServiceComponent'
import { StacksComponent } from './StacksComponent'
import { PortsComponent } from './PortsComponent'
import { NodesComponent } from './NodesComponent'
import { DetailsNodeComponent } from './DetailsNodeComponent'
import { TasksComponent } from './TasksComponent'
import { AboutComponent } from './AboutComponent'
import { SettingsComponent } from './SettingsComponent'
import { LogsComponent } from './LogsComponent'
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

  const [show, setShow] = useState(false)

  useEffect(() => {
    setShow(false)
    const timer = setTimeout(() => setShow(true), 50)
    return () => clearTimeout(timer)
  }, [idToRender])
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

  return (
    <div key={idToRender} className={`fade ${show ? 'show' : ''}`}>
      {componentMap[idToRender] || <DashboardComponent />}
    </div>
  )
}
