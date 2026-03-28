import { useAtomValue } from 'jotai'
import { useEffect, useState } from 'react'
import React from 'react'
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
  tasksDetailId,
  timelineId,
  versionUpdateId,
} from '../../common/navigationConstants'
import { viewAtom } from '../../common/store/atoms/navigationAtoms'
import { dashboardSettingsDefaultLayoutViewIdAtom } from '../../common/store/atoms/dashboardAtoms'
import DashboardComponent from '../dashboard/DashboardComponent'
import DashboardVerticalComponent from '../dashboard/DashboardVerticalComponent'
import TimelineComponent from '../timeline/TimelineComponent.jsx'
import DetailsServiceComponent from '../services/DetailsServiceComponent'
import StacksComponent from '../stacks/StacksComponent'
import PortsComponent from '../ports/PortsComponent'
import NodesComponent from '../nodes/NodesComponent'
import DetailsNodeComponent from '../nodes/DetailsNodeComponent'
import TasksComponent from '../tasks/TasksComponent'
import DetailsTaskComponent from '../tasks/DetailsTaskComponent.jsx'
import AboutComponent from '../misc/AboutComponent'
import SettingsComponent from '../settings/SettingsComponent'
import LogsComponent from '../logs/LogsComponent.jsx'
import DebugComponent from '../misc/DebugComponent'
import VersionUpdateComponent from '../misc/VersionUpdateComponent.jsx'

/**
 * ContentRouter component that determines which view to render
 * based on the current view ID from the state.
 *
 * @returns {JSX.Element} The component corresponding to the current view ID.
 */
const ContentRouter = React.memo(function ContentRouter() {
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
    [tasksDetailId]: <DetailsTaskComponent />,
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
})

export default ContentRouter
