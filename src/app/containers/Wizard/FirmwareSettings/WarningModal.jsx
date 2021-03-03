/* eslint-disable react/prop-types */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Modal, Button } from 'react-bootstrap';
import controller from '../../../lib/controller';
import styles from '../index.styl';


class WarningModal extends PureComponent {
    static propTypes = {
        handleWarningModal: PropTypes.func,
        handleNoUpdates: PropTypes.func
    }

    handleYes = (props) => {
        this.props.handleWarningModal();
        controller.command('gcode', '$RST=$');
        controller.command('gcode', '$$');

        setTimeout(() => this.props.handleNoUpdates(), 3000);
    }

    handleNo = () => {
        this.props.handleNoUpdates();
    };

    render() {
        return (
            <Modal.Dialog>
                <Modal.Header className={styles.modalHeader}>
                    <Modal.Title>Are you sure?</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <p>Return all Grbl settings to default?</p>
                </Modal.Body>

                <Modal.Footer>
                    <Button onClick={this.handleYes}>Yes</Button>
                    <Button onClick={this.handleNo}>No</Button>
                </Modal.Footer>
            </Modal.Dialog>
        );
    }
}

export default WarningModal;
