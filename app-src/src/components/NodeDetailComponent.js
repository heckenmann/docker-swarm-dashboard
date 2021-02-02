import React, { Component } from 'react';
import { Modal } from 'react-bootstrap';

class NodeDetailComponent extends Component {

    render() {
        return (
            <Modal show={this.props.show} onHide={this.props.closeHandler}
                size="large"
                aria-labelledby="contained-modal-title-lg">
                <Modal.Header closeButton>
                    <Modal.Title>{this.props.node.Description.Hostname}</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <textarea className="jsonTextarea"
                        defaultValue={JSON.stringify(this.props.node, null, "\t")}
                        disabled="disabled"
                    />
                </Modal.Body>

            </Modal>
        )
    }
}

export { NodeDetailComponent };