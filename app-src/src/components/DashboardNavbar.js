import { Button, ButtonGroup, Container, Nav, Navbar, Toast, ToastContainer } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import logo from '../docker.png';
import { MessageReducer, RefreshIntervalToggleReducer } from '../common/store/reducers';
import { currentVariantAtom, isDarkModeAtom, messagesAtom, nodesAtom, refreshIntervalAtom, servicesAtom, tasksAtom, viewIdAtom } from '../common/store/atoms';
import { useResetAtom } from 'jotai/utils';
import ReactInterval from 'react-interval';
import { useAtom, useAtomValue } from 'jotai';
import { aboutId, dashboardHId, logsId, nodesId, portsId, stacksId, tasksId } from '../common/navigationConstants';
import { useEffect } from 'react';

function DashboardNavbar() {
    const [refreshInterval, toggleRefresh] = useAtom(refreshIntervalAtom, RefreshIntervalToggleReducer);
    const [, messageReducer] = useAtom(messagesAtom, MessageReducer);
    const resetNodes = useResetAtom(nodesAtom);
    const resetServices = useResetAtom(servicesAtom);
    const resetTasks = useResetAtom(tasksAtom);
    const [isDarkMode, setIsDarkMode] = useAtom(isDarkModeAtom);
    const currentVariant = useAtomValue(currentVariantAtom);
    const [viewId, updateViewId] = useAtom(viewIdAtom);

    if (isDarkMode) document.body.classList.add('bg-dark'); else document.body.classList.remove('bg-dark');

    const reloadData = () => {
        resetNodes();
        resetServices();
        resetTasks();
    }

    const refreshAndNotifyUser = () => {
        messageReducer({ 'type': 'add', 'value': 'Refresh ...' });
        reloadData();
    }

    const toggleRefreshAndNotifyUser = () => {
        toggleRefresh();
        messageReducer({ 'type': 'add', 'value': refreshInterval ? 'Interval-Refresh disabled' : 'Interval-Refresh enabled' });
    }

    return (
        <>
            <ReactInterval enabled={refreshInterval} timeout={refreshInterval} callback={reloadData} />
            <Navbar collapseOnSelect expand="xl" bg={currentVariant} variant={currentVariant} className='mb-3 border-bottom'>
                <Container fluid>
                    <Navbar.Brand className='cursorPointer' onClick={() => updateViewId(dashboardHId)}>
                        <img alt="logo"
                            id="dockerlogo"
                            src={logo}
                            className="d-inline-block align-top cursor-pointer"
                            width="30"
                            height="30" />{' '}
                        Docker Swarm Dashboard
                    </Navbar.Brand>
                    <Navbar.Toggle aria-controls="responsive-navbar-nav" />
                    <Navbar.Collapse id="responsive-navbar-left">
                        <Nav className="mr-auto">
                            <Nav.Link onClick={() => updateViewId(dashboardHId)} active={viewId === dashboardHId}><FontAwesomeIcon icon="grip" />{' '}Dashboard</Nav.Link>
                            <Nav.Link onClick={() => updateViewId(stacksId)} active={viewId === stacksId}><FontAwesomeIcon icon="cubes" />{' '}Stacks</Nav.Link>
                            <Nav.Link onClick={() => updateViewId(nodesId)} active={viewId === nodesId}><FontAwesomeIcon icon="server" />{' '}Nodes</Nav.Link>
                            <Nav.Link onClick={() => updateViewId(tasksId)} active={viewId === tasksId}><FontAwesomeIcon icon="tasks" />{' '}Tasks</Nav.Link>
                            <Nav.Link onClick={() => updateViewId(portsId)} active={viewId === portsId}><FontAwesomeIcon icon="building" />{' '}Ports</Nav.Link>
                            <Nav.Link onClick={() => updateViewId(logsId)} active={viewId === logsId}><FontAwesomeIcon icon="file-medical-alt" />{' '}Logs</Nav.Link>
                        </Nav>
                    </Navbar.Collapse>
                    <Navbar.Collapse id="responsive-navbar-right" className='justify-content-end'>
                        <Nav>
                            <Nav.Link onClick={() => updateViewId(aboutId)} active={viewId === aboutId}><FontAwesomeIcon icon="info-circle" /> About</Nav.Link>
                            <ButtonGroup>
                                <Button variant={refreshInterval ? 'secondary' : 'outline-secondary'} onClick={toggleRefreshAndNotifyUser} ><FontAwesomeIcon icon={refreshInterval ? "stop-circle" : "play-circle"} /></Button>
                                <Button variant='outline-secondary' onClick={refreshAndNotifyUser}><FontAwesomeIcon icon="sync" /></Button>
                                <Button variant={isDarkMode ? 'secondary' : 'outline-secondary'} onClick={() => setIsDarkMode(!isDarkMode)}><FontAwesomeIcon icon="lightbulb" /></Button>
                            </ButtonGroup>
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>
            <RefreshIntervalToast />
        </>
    );
}

function RefreshIntervalToast() {
    const [messages, messageReducer] = useAtom(messagesAtom, MessageReducer);
    if (!messages) return <></>;
    const messageToasts = messages.map(message => (
        <Toast key={message} delay={2000} onClose={() => messageReducer({ 'type': 'remove', 'value': message })} autohide>
            <Toast.Header>
                <strong className="me-auto"><FontAwesomeIcon icon='circle-info' /> Information</strong>
            </Toast.Header>
            <Toast.Body>{message}</Toast.Body>
        </Toast>
    ))

    return (
        <ToastContainer className="p-3" position='top-center'>
            {messageToasts}
        </ToastContainer>
    )
}

export { DashboardNavbar };
