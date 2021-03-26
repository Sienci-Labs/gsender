/* eslint-disable react/prop-types */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Modal, Button } from 'react-bootstrap';
import { Toaster } from '../../../lib/toaster/ToasterLib';
import controller from '../../../lib/controller';
import styles from '../index.styl';


class WarningModal extends PureComponent {
        static propTypes = {
            selectedProfile: PropTypes.string,
            modalClose: PropTypes.func,
            port: PropTypes.string
        }

    actions = {
        startFlash: (port) => {
            controller.command('flash:start', port);
            this.setState({ currentlyFlashing: true });
        }
    }

    handleYes = (props) => {
        controller.command('firmware:applyProfileSettings', this.props.selectedProfile, this.props.port);
        this.props.modalClose();
        Toaster.pop({
            msg: (`Settings Updated to ${this.props.selectedProfile} eeprom`),
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
                    <p className={styles.warningtext}>Upload settings to your device...</p>
                    <p>Upload {this.props.selectedProfile} eeprom settings?</p>
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
