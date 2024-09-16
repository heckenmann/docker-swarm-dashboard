import {
  Badge,
  Button,
  ButtonGroup,
  Container,
  Nav,
  Navbar,
  Toast,
  ToastContainer,
} from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import logo from '../files/docker.png'
import {
  MessageReducer,
  RefreshIntervalToggleReducer,
} from '../common/store/reducers'
import {
  currentVariantAtom,
  dashboardSettingsAtom,
  dashboardSettingsDefaultLayoutViewIdAtom,
  isDarkModeAtom,
  logsConfigAtom,
  logsShowLogsAtom,
  messagesAtom,
  refreshIntervalAtom,
  viewAtom,
} from '../common/store/atoms'
import ReactInterval from 'react-interval'
import { useAtom, useAtomValue } from 'jotai'
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
  const [, messageReducer] = useAtom(messagesAtom, MessageReducer)
  const [isDarkMode] = useAtom(isDarkModeAtom)
  const currentVariant = useAtomValue(currentVariantAtom)
  const [view, updateView] = useAtom(viewAtom)
  const logsShowLogs = useAtomValue(logsShowLogsAtom)
  const logsConfig = useAtomValue(logsConfigAtom)
  const dashboardSettings = useAtomValue(dashboardSettingsAtom)
  const defaultLayout = useAtomValue(dashboardSettingsDefaultLayoutViewIdAtom)

  if (isDarkMode) document.body.classList.add('bg-dark')
  else document.body.classList.remove('bg-dark')

  const reloadData = () => {
    updateView({ ...view, timestamp: new Date() })
  }

  const refreshAndNotifyUser = () => {
    if (refreshInterval != undefined) toggleRefresh()
    messageReducer({ type: 'add', value: 'Refresh ...' })
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
        className="mb-3 border-bottom"
      >
        <Container fluid>
          <Navbar.Brand
            className="cursorPointer"
            onClick={() => updateView({ id: defaultLayout })}
          >
            <img
              alt="logo"
              id="dockerlogo"
              src={logo}
              className="d-inline-block align-top cursor-pointer"
              width="30"
              height="30"
            />{' '}
            Docker Swarm Dashboard
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="responsive-navbar-nav" />
          <Navbar.Collapse id="responsive-navbar-left">
            <Nav className="mr-auto">
              <Nav.Link
                onClick={() => updateView({ id: defaultLayout })}
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
                onClick={() => updateView({ id: timelineId })}
                active={view?.id === timelineId}
              >
                <FontAwesomeIcon icon="timeline" /> Timeline
              </Nav.Link>
              <Nav.Link
                onClick={() => updateView({ id: stacksId })}
                active={view?.id === stacksId}
              >
                <FontAwesomeIcon icon="cubes" /> Stacks
              </Nav.Link>
              <Nav.Link
                onClick={() => updateView({ id: nodesId })}
                active={view?.id === nodesId}
              >
                <FontAwesomeIcon icon="server" /> Nodes
              </Nav.Link>
              <Nav.Link
                onClick={() => updateView({ id: tasksId })}
                active={view?.id === tasksId}
              >
                <FontAwesomeIcon icon="tasks" /> Tasks
              </Nav.Link>
              <Nav.Link
                onClick={() => updateView({ id: portsId })}
                active={view?.id === portsId}
              >
                <FontAwesomeIcon icon="building" /> Ports
              </Nav.Link>
              {dashboardSettings.showLogsButton && (
                <Nav.Link
                  onClick={() => updateView({ id: logsId })}
                  active={view?.id === logsId}
                  className="warning"
                >
                  <FontAwesomeIcon icon="file-medical-alt" /> Logs
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
                onClick={() => updateView({ id: aboutId })}
                active={view?.id === aboutId}
              >
                <FontAwesomeIcon icon="info-circle" /> About
              </Nav.Link>
              <Nav.Link
                onClick={() => updateView({ id: settingsId })}
                active={view?.id === settingsId}
              >
                <FontAwesomeIcon icon="gear" /> Settings
              </Nav.Link>
            </Nav>
            <ButtonGroup>
              <Button
                variant={
                  refreshInterval == undefined ? 'outline-secondary' : 'warning'
                }
                onClick={refreshAndNotifyUser}
              >
                <FontAwesomeIcon icon="sync" />
              </Button>
            </ButtonGroup>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <RefreshIntervalToast />
    </>
  )
}

function RefreshIntervalToast() {
  const [messages, messageReducer] = useAtom(messagesAtom, MessageReducer)
  if (!messages) return <></>
  const messageToasts = messages.map((message) => (
    <Toast
      key={message}
      delay={2000}
      onClose={() => messageReducer({ type: 'remove', value: message })}
      autohide
    >
      <Toast.Header>
        <strong className="me-auto">
          <FontAwesomeIcon icon="circle-info" /> Information
        </strong>
      </Toast.Header>
      <Toast.Body>{message}</Toast.Body>
    </Toast>
  ))

  return (
    <ToastContainer className="p-3" position="top-center">
      {messageToasts}
    </ToastContainer>
  )
}

export { DashboardNavbar }
