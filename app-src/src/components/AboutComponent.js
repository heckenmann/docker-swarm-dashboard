import React, { Component } from 'react';
import { Table, Card, Jumbotron } from 'react-bootstrap';

class AboutComponent extends Component {

    render() {
        return (
            <Card>
                <Card.Body>
                    <h1>
                        Docker Swarm Dashboard <small>by heckenmann</small>
                    </h1>
                    <Table>
                        <tbody>
                            <tr>
                                <td>License:</td>
                                <td><a href="https://github.com/heckenmann/docker-swarm-dashboard/blob/master/LICENSE">https://github.com/heckenmann/docker-swarm-dashboard/blob/master/LICENSE</a></td>
                            </tr>
                            <tr>
                                <td>GitHub-Project:</td>
                                <td><a href="https://github.com/heckenmann/docker-swarm-dashboard">https://github.com/heckenmann/docker-swarm-dashboard</a></td>
                            </tr>
                            <tr>
                                <td>Docker Registry:</td>
                                <td><a href="https://github.com/heckenmann/docker-swarm-dashboard/pkgs/container/docker-swarm-dashboard">https://github.com/heckenmann/docker-swarm-dashboard/pkgs/container/docker-swarm-dashboard</a></td>
                            </tr>
                        </tbody>
                    </Table>
                </Card.Body>
            </Card >
        );
    }
}

export { AboutComponent };