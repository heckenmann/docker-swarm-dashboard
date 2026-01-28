import logo from '../files/docker.png'
import ReactInterval from 'react-interval'
import { RefreshIntervalToggleReducer } from '../common/store/reducers'
import {
  currentVariantAtom,
  dashboardSettingsAtom,
  dashboardSettingsDefaultLayoutViewIdAtom,
  logsConfigAtom,
  logsShowLogsAtom,
  refreshIntervalAtom,
  versionAtom,
  viewAtom,
} from '../common/store/atoms'
import { useAtom, useAtomValue } from 'jotai'
import {
  Navbar,
  Nav,
  Badge,
  Container,
  ButtonGroup,
  Button,
} from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  aboutId,
  dashboardHId,
  logsId,
  nodesId,
  portsId,
  settingsId,
  stacksId,
  tasksId,
  timelineId,
  versionUpdateId,
} from '../common/navigationConstants'

/**
 * DashboardNavbar component renders the navigation bar for the dashboard.
 * It includes various navigation links and a refresh button.
 */
function DashboardNavbar() {
  const [refreshInterval, toggleRefresh] = useAtom(
    refreshIntervalAtom,
    RefreshIntervalToggleReducer,
  )
  // messageReducer removed — do not show toast on manual refresh
  const currentVariant = useAtomValue(currentVariantAtom)
  const [view, updateView] = useAtom(viewAtom)
  const logsShowLogs = useAtomValue(logsShowLogsAtom)
  const logsConfig = useAtomValue(logsConfigAtom)
  const dashboardSettings = useAtomValue(dashboardSettingsAtom)
  const version = useAtomValue(versionAtom)
  const defaultLayout = useAtomValue(dashboardSettingsDefaultLayoutViewIdAtom)

  const reloadData = () => {
    updateView((prev) => ({ ...prev, timestamp: new Date() }))
  }

  /**
   * Toggles the refresh interval and notifies the user with a message.
   */
  const refreshAndNotifyUser = () => {
    if (refreshInterval) toggleRefresh()
    reloadData()
  }

  const readingLogsWarning =
    logsShowLogs && logsConfig?.follow ? (
      <>
        {' '}
        <Badge bg="warning" text="dark">
          <FontAwesomeIcon icon="running" />
        </Badge>
      </>
    ) : (
      <></>
    )

  return (
    <>
      <ReactInterval
        enabled={refreshInterval != null}
        timeout={refreshInterval}
        callback={reloadData}
      />
      <Navbar
        collapseOnSelect
        expand="xl"
        bg={currentVariant}
        variant={currentVariant}
        className="border-bottom"
      >
        <Container fluid>
          <Navbar.Brand
            className="cursorPointer"
            onClick={() =>
              updateView((prev) => ({ ...prev, id: defaultLayout }))
            }
          >
            <img
              alt="logo"
              id="dockerlogo"
              src={logo}
              className="d-inline-block align-top cursor-pointer"
              width="30"
              height="30"
            />{' '}
            Docker Swarm Dashboard <small>{version.version}</small>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="responsive-navbar-nav" />
          <Navbar.Collapse id="responsive-navbar-left">
            <Nav className="mr-auto">
              <Nav.Link
                onClick={() =>
                  updateView((prev) => ({ ...prev, id: defaultLayout }))
                }
                active={view?.id === defaultLayout}
              >
                <FontAwesomeIcon
                  icon={
                    defaultLayout === dashboardHId ? 'grip' : 'grip-vertical'
                  }
                />
                &nbsp;Dashboard
              </Nav.Link>
              <Nav.Link
                onClick={() =>
                  updateView((prev) => ({ ...prev, id: timelineId }))
                }
                active={view?.id === timelineId}
              >
                <FontAwesomeIcon icon="timeline" /> Timeline
              </Nav.Link>
              <Nav.Link
                onClick={() =>
                  updateView((prev) => ({ ...prev, id: stacksId }))
                }
                active={view?.id === stacksId}
              >
                <FontAwesomeIcon icon="cubes" /> Stacks
              </Nav.Link>
              <Nav.Link
                onClick={() => updateView((prev) => ({ ...prev, id: nodesId }))}
                active={view?.id === nodesId}
              >
                <FontAwesomeIcon icon="server" /> Nodes
              </Nav.Link>
              <Nav.Link
                onClick={() => updateView((prev) => ({ ...prev, id: tasksId }))}
                active={view?.id === tasksId}
              >
                <FontAwesomeIcon icon="tasks" /> Tasks
              </Nav.Link>
              <Nav.Link
                onClick={() => updateView((prev) => ({ ...prev, id: portsId }))}
                active={view?.id === portsId}
              >
                <FontAwesomeIcon icon="building" /> Ports
              </Nav.Link>
              {dashboardSettings.showLogsButton && (
                <Nav.Link
                  onClick={() =>
                    updateView((prev) => ({ ...prev, id: logsId }))
                  }
                  active={view?.id === logsId}
                  className="warning"
                >
                  <FontAwesomeIcon icon="desktop" /> Logs
                  {readingLogsWarning}
                </Nav.Link>
              )}
            </Nav>
          </Navbar.Collapse>
          <Navbar.Collapse
            id="responsive-navbar-right"
            className="justify-content-end"
          >
            <Nav>
              <Nav.Link
                onClick={() => updateView((prev) => ({ ...prev, id: aboutId }))}
                active={view?.id === aboutId}
              >
                <FontAwesomeIcon icon="info-circle" /> About
              </Nav.Link>
              <Nav.Link
                onClick={() =>
                  updateView((prev) => ({ ...prev, id: settingsId }))
                }
                active={view?.id === settingsId}
              >
                <FontAwesomeIcon icon="gear" /> Settings
              </Nav.Link>
            </Nav>
            <ButtonGroup>
              <Button
                variant={!refreshInterval ? 'outline-secondary' : 'warning'}
                onClick={refreshAndNotifyUser}
              >
                <FontAwesomeIcon icon="sync" />
              </Button>
              <Button
                variant={
                  dashboardSettings.versionCheckEnabled &&
                  version.updateAvailable
                    ? 'info'
                    : 'secondary'
                }
                onClick={() =>
                  updateView((prev) => ({ ...prev, id: versionUpdateId }))
                }
              >
                <FontAwesomeIcon icon="cloud-download-alt" />
              </Button>
            </ButtonGroup>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </>
  )
}

// Refresh toasts removed per UX: do not show a toast when the manual refresh button is pressed.

export { DashboardNavbar }
