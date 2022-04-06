import { Button, ButtonGroup, Container, Nav, Navbar, Toast, ToastContainer } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import logo from '../docker.png';
import { MessageReducer, RefreshIntervalToggleReducer } from '../common/store/reducers';
import { currentVariantAtom, currentVariantClassesAtom, isDarkModeAtom, messagesAtom, nodesAtom, refreshIntervalAtom, servicesAtom, tasksAtom } from '../common/store/atoms';
import { useUpdateAtom } from 'jotai/utils';
import { Suspense } from 'react';
import ReactInterval from 'react-interval';
import { useAtom, useAtomValue } from 'jotai';

function DashboardNavbar() {
    const [refreshInterval, toggleRefresh] = useAtom(refreshIntervalAtom, RefreshIntervalToggleReducer);
    const [, messageReducer] = useAtom(messagesAtom, MessageReducer);
    const updateNodes = useUpdateAtom(nodesAtom);
    const updateServices = useUpdateAtom(servicesAtom);
    const updateTasks = useUpdateAtom(tasksAtom);
    const [isDarkMode, setIsDarkMode] = useAtom(isDarkModeAtom);
    const currentVariant = useAtomValue(currentVariantAtom);
    const currentVariantClasses = useAtomValue(currentVariantClassesAtom);

    if(isDarkMode) document.body.classList.add('bg-dark'); else document.body.classList.remove('bg-dark');

    const reloadData = () => {
        updateNodes   ({ type: 'refetch' });
        updateServices({ type: 'refetch' });
        updateTasks   ({ type: 'refetch' });
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
        <Suspense fallback={<p>Navbar is loading...</p>}>
            <ReactInterval enabled={refreshInterval} timeout={refreshInterval} callback={reloadData} />
            <Navbar collapseOnSelect expand="xl" bg={currentVariant} variant={currentVariant} className='mb-3 border-bottom'>
                <Container fluid>
                    <LinkContainer to="/">
                        <Navbar.Brand>
                            <img alt="logo"
                                id="dockerlogo"
                                src={logo}
                                className="d-inline-block align-top"
                                width="30"
                                height="30" />{' '}
                            Docker Swarm Dashboard
                        </Navbar.Brand>
                    </LinkContainer>
                    <Navbar.Toggle aria-controls="responsive-navbar-nav" />
                    <Navbar.Collapse id="responsive-navbar-left">
                        <Nav className="mr-auto" variant="dark">
                            <LinkContainer to="/dashboard">
                                <Nav.Link><FontAwesomeIcon icon="grip" />{' '}Dashboard</Nav.Link>
                            </LinkContainer>
                            <LinkContainer to="/stacks">
                                <Nav.Link><FontAwesomeIcon icon="cubes" />{' '}Stacks</Nav.Link>
                            </LinkContainer>
                            <LinkContainer to="/nodes">
                                <Nav.Link><FontAwesomeIcon icon="server" />{' '}Nodes</Nav.Link>
                            </LinkContainer>
                            <LinkContainer to="/tasks">
                                <Nav.Link><FontAwesomeIcon icon="tasks" />{' '}Tasks</Nav.Link>
                            </LinkContainer>
                            <LinkContainer to="/ports">
                                <Nav.Link><FontAwesomeIcon icon="building" />{' '}Ports</Nav.Link>
                            </LinkContainer>
                            <LinkContainer to="/logs">
                                <Nav.Link><FontAwesomeIcon icon="file-medical-alt" />{' '}Logs</Nav.Link>
                            </LinkContainer>
                        </Nav>
                    </Navbar.Collapse>
                    <Navbar.Collapse id="responsive-navbar-right" className='justify-content-end'>
                        <Nav>
                            <LinkContainer to="/about">
                                <Nav.Link><FontAwesomeIcon icon="info-circle" /> About</Nav.Link>
                            </LinkContainer>
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
        </Suspense>
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
