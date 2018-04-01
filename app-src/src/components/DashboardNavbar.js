import React, { Component } from 'react';
import { Nav, Navbar, NavItem, MenuItem, NavDropdown, Button, FormGroup, FormControl } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import FontAwesome from 'react-fontawesome';
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
                        <NavItem><FontAwesome name="linode" /> Services / Nodes</NavItem>
                    </LinkContainer>
                    <LinkContainer to="/tasks">
                        <NavItem><FontAwesome name="tasks" /> Tasks</NavItem>
                    </LinkContainer>
                </Nav>
                <Nav pullRight>
                    <LinkContainer to="/about">
                        <NavItem><FontAwesome name="info-circle" /> About</NavItem>
                    </LinkContainer>
                </Nav>
            </Navbar>
        );
    }
}

export { DashboardNavbar };