import React, { Component } from 'react';
import { Modal } from 'react-bootstrap';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import docco from 'react-syntax-highlighter/dist/esm/styles/hljs/docco';

class NodeDetailComponent extends Component {

    render() {
        return (
            <Modal show={this.props.show} onHide={this.props.closeHandler}
                size="xl"
                aria-labelledby="contained-modal-title-lg">
                <Modal.Header closeButton>
                    <Modal.Title>{this.props.node.Description.Hostname}</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <SyntaxHighlighter language="javascript" style={docco}>{JSON.stringify(this.props.node, null, "\t")}</SyntaxHighlighter>
                </Modal.Body>

            </Modal>
        )
    }
}

export { NodeDetailComponent };