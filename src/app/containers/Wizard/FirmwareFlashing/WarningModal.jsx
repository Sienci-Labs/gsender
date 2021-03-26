/* eslint-disable react/prop-types */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Modal, Button } from 'react-bootstrap';
import { Toaster } from '../../../lib/toaster/ToasterLib';
import controller from '../../../lib/controller';
import styles from '../index.styl';


class WarningModal extends PureComponent {
    static propTypes = {
        handleCloseWarning: PropTypes.func,
        modalClose: PropTypes.func,
        port: PropTypes.string,
        flashingStart: PropTypes.func,
    }

    actions = {
        startFlash: (port) => {
            controller.command('flash:start', port);
            this.setState({ currentlyFlashing: true });
        }
    }

    handleYes = (props) => {
        this.props.handleCloseWarning();
        this.props.flashingStart();
        this.actions.startFlash(this.props.port);
        Toaster.pop({
            msg: ('Flashing started...'),
            type: 'TOASTER_INFO',
        });
    }

    handleNo = () => {
        this.props.handleCloseWarning();
    };

    render() {
        return (
            <Modal.Dialog>
                <Modal.Header className={styles.modalHeader}>
                    <Modal.Title>Are you sure?</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <p className={styles.warningtext}>Improper flashing can damage your device...</p>
                    <p>Flash your {this.props.boardType[0]}?</p>
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
