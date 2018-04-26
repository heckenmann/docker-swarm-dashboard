import React, { Component } from 'react';
import { Nav, Navbar, NavItem } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import faSync from '@fortawesome/fontawesome-free-solid/faSync';
import faLinode from '@fortawesome/fontawesome-free-brands/faLinode';
import faTasks from '@fortawesome/fontawesome-free-solid/faTasks';
import faInfoCircle from '@fortawesome/fontawesome-free-solid/faInfoCircle';
import faPlayCircle from '@fortawesome/fontawesome-free-solid/faPlayCircle';
import faStopCircle from '@fortawesome/fontawesome-free-solid/faStopCircle';
import faBuilding from '@fortawesome/fontawesome-free-solid/faBuilding';
import logo from '../docker.png';

class DashboardNavbar extends Component {

    render() {
        return (
            <Navbar inverse fixedTop>
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
                    <LinkContainer to="/ports">
                        <NavItem><FontAwesomeIcon icon={faBuilding} /> Ports</NavItem>
                    </LinkContainer>
                </Nav>
                <Nav pullRight>
                    <NavItem onClick={this.props.toggleRefresh}><FontAwesomeIcon icon={this.props.state.refreshInterval ? faStopCircle : faPlayCircle} /> Refresh-Interval</NavItem>
                    <NavItem onClick={this.props.forceUpdate}><FontAwesomeIcon icon={faSync} /> Refresh</NavItem>
                    <LinkContainer to="/about">
                        <NavItem><FontAwesomeIcon icon={faInfoCircle} /> About</NavItem>
                    </LinkContainer>
                </Nav>
            </Navbar>
        );
    }
}

export { DashboardNavbar };