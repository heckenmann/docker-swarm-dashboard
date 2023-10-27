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
} from '../common/navigationConstants'
import { viewAtom } from '../common/store/atoms'
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

export function ContentRouter() {
  const viewId = useAtomValue(viewAtom)

  let view
  switch (viewId?.id) {
    case dashboardHId:
      view = <DashboardComponent />
      break
    case dashboardVId:
      view = <DashboardVerticalComponent />
      break
    case timelineId:
      view = <TimelineComponent />
      break
    case servicesDetailId:
      view = <DetailsServiceComponent />
      break
    case stacksId:
      view = <StacksComponent />
      break
    case portsId:
      view = <PortsComponent />
      break
    case nodesId:
      view = <NodesComponent />
      break
    case nodesDetailId:
      view = <DetailsNodeComponent />
      break
    case tasksId:
      view = <TasksComponent />
      break
    case aboutId:
      view = <AboutComponent />
      break
    case settingsId:
      view = <SettingsComponent />
      break
    case logsId:
      view = <LogsComponent />
      break
    case debugId:
      view = <DebugComponent />
      break
    default:
      view = <DashboardComponent />
  }

  return view
}
