import React from 'react'
import { useEffect, useCallback, startTransition } from 'react'
import { useAtom, useAtomValue } from 'jotai'
import { loadable } from 'jotai/utils'
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
import logo from '../../assets/docker.png'
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
      startTransition(() => {
        updateView((prev) => ({ ...prev, id }))
      })
    },
    [updateView],
  )

  const reloadData = useCallback(() => {
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
            <OverlayTrigger
              placement="bottom"
              overlay={<Tooltip id="tt-about">About</Tooltip>}
            >
              <Nav.Link
                aria-label="About"
                onClick={() => navigate(aboutId)}
                active={view?.id === aboutId}
              >
                <FontAwesomeIcon icon="info-circle" />
              </Nav.Link>
            </OverlayTrigger>
            <OverlayTrigger
              placement="bottom"
              overlay={<Tooltip id="tt-settings">Settings</Tooltip>}
            >
              <Nav.Link
                aria-label="Settings"
                onClick={() => navigate(settingsId)}
                active={view?.id === settingsId}
              >
                <FontAwesomeIcon icon="gear" />
              </Nav.Link>
            </OverlayTrigger>
          </Nav>
          <ButtonGroup>
            <OverlayTrigger
              placement="bottom"
              overlay={<Tooltip id="tt-refresh">Refresh</Tooltip>}
            >
              <Button
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
