import React, { Component } from 'react';
import { Nav, Navbar, NavItem, MenuItem, NavDropdown, Button, FormGroup, FormControl } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import faSync from '@fortawesome/fontawesome-free-solid/faSync';
import faLinode from '@fortawesome/fontawesome-free-brands/faLinode';
import faTasks from '@fortawesome/fontawesome-free-solid/faTasks';
import faInfoCircle from '@fortawesome/fontawesome-free-solid/faInfoCircle';
import logo from '../docker.png';
import { ServicesComponent } from './ServicesComponent';

class DashboardNavbar extends Component {
    render() {
        return (
            <Navbar inverse fluid>
                <Navbar.Header>
                    <Navbar.Brand bsclass="white-space: nowrap;">
                        <img alt="logo" id="dockerlogo" src={logo} /> Docker Swarm Dashboard
                    </Navbar.Brand>
                </Navbar.Header>
                <Nav >
                    <LinkContainer to="/services">
                        <NavItem><FontAwesomeIcon icon={faLinode} /> Services / Nodes</NavItem>
                    </LinkContainer>
                    <LinkContainer to="/tasks">
                        <NavItem><FontAwesomeIcon icon={faTasks} /> Tasks</NavItem>
                    </LinkContainer>
                </Nav>
                <Nav pullRight>
                    <NavItem><FontAwesomeIcon icon={faSync} /> Refresh</NavItem>
                    <LinkContainer to="/about">
                        <NavItem><FontAwesomeIcon icon={faInfoCircle} /> About</NavItem>
                    </LinkContainer>
                </Nav>
            </Navbar>
        );
    }
}

export { DashboardNavbar };