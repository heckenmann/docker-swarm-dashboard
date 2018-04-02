import React, { Component } from 'react';
import { PageHeader, Table, Well } from 'react-bootstrap';

class AboutComponent extends Component {

    render() {
        return (
            <Well>
                <PageHeader>
                    Docker Swarm Dashboard <small>by heckenmann</small>
                </PageHeader>
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
                            <td>Docker Store:</td>
                            <td><a href="https://store.docker.com/community/images/heckenmann/docker-swarm-dashboard">https://store.docker.com/community/images/heckenmann/docker-swarm-dashboard</a></td>
                        </tr>
                    </tbody>
                </Table>
            </Well >
        );
    }
}

export { AboutComponent };