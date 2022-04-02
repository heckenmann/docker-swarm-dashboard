import { Container, Nav, Navbar } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import logo from '../docker.png';
import { refreshIntervalToggleReducer } from '../common/store/reducers';
import { nodesAtom, refreshIntervalAtom, servicesAtom, tasksAtom } from '../common/store/atoms';
import { useReducerAtom, useUpdateAtom } from 'jotai/utils';
import { Suspense } from 'react';
import ReactInterval from 'react-interval';

function DashboardNavbar() {
    const [refreshInterval, toggleRefresh] = useReducerAtom(refreshIntervalAtom, refreshIntervalToggleReducer);

    const updateNodes = useUpdateAtom(nodesAtom);
    const updateServices = useUpdateAtom(servicesAtom);
    const updateTasks = useUpdateAtom(tasksAtom);
    const reloadData = () => {
        updateNodes({ type: 'refetch' });
        updateServices({ type: 'refetch' });
        updateTasks({ type: 'refetch' });
    }

    return (
        <Suspense fallback={<p>Navbar is loading...</p>}>
            <ReactInterval enabled={refreshInterval} timeout={refreshInterval} callback={reloadData} />
            <Navbar collapseOnSelect expand="xl" bg='light' variant='light' className='mb-3 border-bottom'>
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
                            <Nav.Link onClick={toggleRefresh}><FontAwesomeIcon icon={refreshInterval ? "stop-circle" : "play-circle"} /> Refresh-Interval</Nav.Link>
                            <Nav.Link onClick={reloadData}><FontAwesomeIcon icon="sync" /> Refresh</Nav.Link>
                            <LinkContainer to="/about">
                                <Nav.Link><FontAwesomeIcon icon="info-circle" /> About</Nav.Link>
                            </LinkContainer>
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>
        </Suspense>
    );
}

export { DashboardNavbar };
