import React, { Component } from 'react';
import { Nav, Navbar } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import logo from '../docker.png';

class DashboardNavbar extends Component {

    render() {
        return (
            <>
                <Navbar bg="dark" variant="dark" expand="lg" fixed="top">
                    <Navbar.Brand>
                        <img alt="logo"
                            id="dockerlogo"
                            src={logo}
                            className="d-inline-block align-top"
                            width="30"
                            height="30" />{' '}
                            Docker Swarm Dashboard
                    </Navbar.Brand>
                    <Nav className="mr-auto" variant="dark">
                        <LinkContainer to="/services">
                            <Nav.Link><FontAwesomeIcon icon="box" />{' '}Services / Nodes</Nav.Link>
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
                    <Nav className="mr-0">
                        <Nav.Link onClick={this.props.toggleRefresh}><FontAwesomeIcon icon={this.props.state.refreshInterval ? "stop-circle" : "play-circle"} /> Refresh-Interval</Nav.Link>
                        <Nav.Link onClick={this.props.forceUpdate}><FontAwesomeIcon icon="sync" /> Refresh</Nav.Link>
                        <LinkContainer to="/about">
                            <Nav.Link><FontAwesomeIcon icon="info-circle" /> About</Nav.Link>
                        </LinkContainer>
                    </Nav>
                </Navbar>
            </>
        );
    }
}

export { DashboardNavbar };