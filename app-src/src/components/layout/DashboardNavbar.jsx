import React from 'react'
import { useEffect, useCallback, startTransition } from 'react'
import { useAtom, useAtomValue } from 'jotai'
import {
  Navbar,
  Nav,
  Badge,
  Container,
  ButtonGroup,
  Button,
  OverlayTrigger,
  Tooltip,
} from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { loadable } from '../../common/store/loadable'
import logo from '../../assets/swarm-dashboard.png'
import { RefreshIntervalToggleReducer } from '../../common/store/reducers'
import { viewAtom } from '../../common/store/atoms/navigationAtoms'
import { currentVariantAtom } from '../../common/store/atoms/themeAtoms'
import { dashboardSettingsAtom } from '../../common/store/atoms/foundationAtoms'
import { dashboardSettingsDefaultLayoutViewIdAtom } from '../../common/store/atoms/dashboardAtoms'
import {
  logsConfigAtom,
  logsShowLogsAtom,
} from '../../common/store/atoms/logsAtoms'
import {
  maxContentWidthAtom,
  refreshIntervalAtom,
  showNavLabelsAtom,
} from '../../common/store/atoms/uiAtoms'
import {
  versionAtom,
  versionRefreshAtom,
} from '../../common/store/atoms/dashboardAtoms'
import {
  aboutId,
  dashboardHId,
  logsId,
  mcpId,
  nodesId,
  portsId,
  settingsId,
  stacksId,
  tasksId,
  timelineId,
  versionUpdateId,
} from '../../common/navigationConstants'
import './DashboardNavbar.css'

const dashboardSettingsLoadable = loadable(dashboardSettingsAtom)
const versionLoadable = loadable(versionAtom)
const defaultLayoutLoadable = loadable(dashboardSettingsDefaultLayoutViewIdAtom)

/**
 * DashboardNavbar component renders the navigation bar for the dashboard.
 */
const DashboardNavbar = React.memo(function DashboardNavbar() {
  const [refreshInterval, toggleRefresh] = useAtom(
    refreshIntervalAtom,
    RefreshIntervalToggleReducer,
  )
  const currentVariant = useAtomValue(currentVariantAtom)
  const [view, updateView] = useAtom(viewAtom)
  const [, incrementVersionRefresh] = useAtom(versionRefreshAtom)
  const logsShowLogs = useAtomValue(logsShowLogsAtom)
  const logsConfig = useAtomValue(logsConfigAtom)
  const maxContentWidth = useAtomValue(maxContentWidthAtom)
  const showNavLabels = useAtomValue(showNavLabelsAtom)

  // Use loadables to avoid suspension flickering
  const dashboardSettingsRes = useAtomValue(dashboardSettingsLoadable)
  const versionRes = useAtomValue(versionLoadable)
  const defaultLayoutRes = useAtomValue(defaultLayoutLoadable)

  const dashboardSettings =
    dashboardSettingsRes.state === 'hasData' ? dashboardSettingsRes.data : {}
  const version =
    versionRes.state === 'hasData' ? versionRes.data : { version: '' }
  const defaultLayout =
    defaultLayoutRes.state === 'hasData' ? defaultLayoutRes.data : dashboardHId

  const navigate = useCallback(
    (id) => {
      updateView({ id })
    },
    [updateView],
  )

  const reloadData = useCallback(() => {
    // Keep the current view and its focus while refreshed async atoms suspend.
    startTransition(() => {
      updateView((prev) => ({ ...prev, timestamp: new Date() }))
    })
    incrementVersionRefresh((n) => n + 1)
  }, [updateView, incrementVersionRefresh])

  useEffect(() => {
    if (refreshInterval !== null) {
      const intervalId = setInterval(reloadData, refreshInterval)
      return () => clearInterval(intervalId)
    }
  }, [refreshInterval, reloadData])

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

  const navTip = (id, label, el) =>
    showNavLabels ? (
      el
    ) : (
      <OverlayTrigger
        placement="bottom"
        overlay={<Tooltip id={id}>{label}</Tooltip>}
      >
        {el}
      </OverlayTrigger>
    )

  return (
    <Navbar
      collapseOnSelect
      expand="xl"
      bg={currentVariant}
      variant={currentVariant}
      className="border-bottom"
    >
      <Container fluid={maxContentWidth === 'fluid'}>
        <Navbar.Brand
          className="cursor-pointer"
          onClick={() => navigate(defaultLayout)}
        >
          <img
            alt="Docker Swarm Dashboard logo"
            id="dockerlogo"
            src={logo}
            className="d-inline-block align-middle cursor-pointer bg-white rounded-circle border border-secondary-subtle p-0"
            width="32"
            height="32"
          />{' '}
          Docker Swarm Dashboard{' '}
          <small className="d-none d-sm-inline">{version.version}</small>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="responsive-navbar-nav" />
        <Navbar.Collapse id="responsive-navbar-left">
          <Nav className="mr-auto">
            {navTip(
              'tt-dashboard',
              'Dashboard',
              <Nav.Link
                aria-label="Dashboard"
                onClick={() => navigate(defaultLayout)}
                active={view?.id === defaultLayout}
              >
                <FontAwesomeIcon
                  icon={
                    defaultLayout === dashboardHId ? 'grip' : 'grip-vertical'
                  }
                />
                {showNavLabels && <>&nbsp;Dashboard</>}
              </Nav.Link>,
            )}
            {navTip(
              'tt-timeline',
              'Timeline',
              <Nav.Link
                aria-label="Timeline"
                onClick={() => navigate(timelineId)}
                active={view?.id === timelineId}
              >
                <FontAwesomeIcon icon="timeline" />
                {showNavLabels && ' Timeline'}
              </Nav.Link>,
            )}
            {navTip(
              'tt-stacks',
              'Stacks',
              <Nav.Link
                aria-label="Stacks"
                onClick={() => navigate(stacksId)}
                active={view?.id === stacksId}
              >
                <FontAwesomeIcon icon="cubes" />
                {showNavLabels && ' Stacks'}
              </Nav.Link>,
            )}
            {navTip(
              'tt-nodes',
              'Nodes',
              <Nav.Link
                aria-label="Nodes"
                onClick={() => navigate(nodesId)}
                active={view?.id === nodesId}
              >
                <FontAwesomeIcon icon="server" />
                {showNavLabels && ' Nodes'}
              </Nav.Link>,
            )}
            {navTip(
              'tt-tasks',
              'Tasks',
              <Nav.Link
                aria-label="Tasks"
                onClick={() => navigate(tasksId)}
                active={view?.id === tasksId}
              >
                <FontAwesomeIcon icon="tasks" />
                {showNavLabels && ' Tasks'}
              </Nav.Link>,
            )}
            {navTip(
              'tt-ports',
              'Ports',
              <Nav.Link
                aria-label="Ports"
                onClick={() => navigate(portsId)}
                active={view?.id === portsId}
              >
                <FontAwesomeIcon icon="building" />
                {showNavLabels && ' Ports'}
              </Nav.Link>,
            )}
            {dashboardSettings.showLogsButton &&
              navTip(
                'tt-logs',
                'Logs',
                <Nav.Link
                  aria-label="Logs"
                  onClick={() => navigate(logsId)}
                  active={view?.id === logsId}
                  className="warning"
                >
                  <FontAwesomeIcon icon="desktop" />
                  {showNavLabels && ' Logs'}
                  {readingLogsWarning}
                </Nav.Link>,
              )}
          </Nav>
        </Navbar.Collapse>
        <Navbar.Collapse
          id="responsive-navbar-right"
          className="justify-content-end"
        >
          <Nav>
            {navTip(
              'tt-about',
              'About',
              <Nav.Link
                aria-label="About"
                onClick={() => navigate(aboutId)}
                active={view?.id === aboutId}
              >
                <FontAwesomeIcon icon="info-circle" />
                {showNavLabels && ' About'}
              </Nav.Link>,
            )}
            {dashboardSettings.mcpEnabled === true &&
              navTip(
                'tt-mcp',
                'MCP',
                <Nav.Link
                  aria-label="MCP"
                  onClick={() => navigate(mcpId)}
                  active={view?.id === mcpId}
                >
                  <svg
                    width="1em"
                    height="1em"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path d="M12 2C13.5 8.5 15.5 10.5 22 12C15.5 13.5 13.5 15.5 12 22C10.5 15.5 8.5 13.5 2 12C8.5 10.5 10.5 8.5 12 2Z" />
                  </svg>
                  {showNavLabels && ' MCP'}
                </Nav.Link>,
              )}
            {navTip(
              'tt-settings',
              'Settings',
              <Nav.Link
                aria-label="Settings"
                onClick={() => navigate(settingsId)}
                active={view?.id === settingsId}
              >
                <FontAwesomeIcon icon="gear" />
                {showNavLabels && ' Settings'}
              </Nav.Link>,
            )}
          </Nav>
          <ButtonGroup>
            <OverlayTrigger
              placement="bottom"
              overlay={<Tooltip id="tt-refresh">Refresh</Tooltip>}
            >
              <Button
                aria-label="Refresh"
                variant={!refreshInterval ? 'outline-secondary' : 'warning'}
                onClick={refreshAndNotifyUser}
              >
                <FontAwesomeIcon icon="sync" />
              </Button>
            </OverlayTrigger>
            <OverlayTrigger
              placement="bottom"
              overlay={<Tooltip id="tt-version">Version</Tooltip>}
            >
              <Button
                aria-label="Version update"
                variant={
                  dashboardSettings.versionCheckEnabled &&
                  version.updateAvailable
                    ? 'info'
                    : 'secondary'
                }
                className="position-relative"
                onClick={() => navigate(versionUpdateId)}
              >
                <FontAwesomeIcon icon="cloud-download-alt" />
                {dashboardSettings.versionCheckEnabled &&
                  version.updateAvailable && (
                    <span
                      className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger version-update-badge"
                      aria-label="Update available"
                    >
                      !
                    </span>
                  )}
              </Button>
            </OverlayTrigger>
          </ButtonGroup>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  )
})

export default DashboardNavbar
