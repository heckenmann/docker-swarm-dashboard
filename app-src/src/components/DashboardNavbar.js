import { Container, Nav, Navbar } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import logo from '../docker.png';

function DashboardNavbar(props) {
    return (
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
                        <Nav.Link onClick={props.toggleRefresh}><FontAwesomeIcon icon={props.refreshInterval ? "stop-circle" : "play-circle"} /> Refresh-Interval</Nav.Link>
                        <Nav.Link onClick={props.forceUpdate}><FontAwesomeIcon icon="sync" /> Refresh</Nav.Link>
                        <LinkContainer to="/about">
                            <Nav.Link><FontAwesomeIcon icon="info-circle" /> About</Nav.Link>
                        </LinkContainer>
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}

export { DashboardNavbar };
