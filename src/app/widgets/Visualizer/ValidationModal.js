import React from 'react';
import PropTypes from 'prop-types';
import Modal from 'app/components/Modal';
import { Button } from 'app/components/Buttons';

import { modalStyle, modalHeaderStyle, modalTitleStyle, modalBodyStyle, modalFooterStyle } from './modalStyle';

const ValidationModal = ({ onProceed, onCancel, invalidGcode }) => {
    const { list } = invalidGcode;

    return (
        <Modal
            size="xs"
            onClose={onProceed}
            style={modalStyle}
            disableOverlay
        >
            <Modal.Header style={modalHeaderStyle}>
                <Modal.Title style={modalTitleStyle}>
                    Invalid G-Code Warning
                </Modal.Title>
            </Modal.Header>
            <Modal.Body style={modalBodyStyle}>

                {
                    list?.size === 1
                        ? <p>There is <span style={{ fontWeight: 'bold' }}>1</span> invalid G-Code line in the file, your job may not run properly.</p>
                        : <p>There are <span style={{ fontWeight: 'bold' }}>{list?.size}</span> invalid G-Code lines in the file, your job may not run properly.</p>
                }

            </Modal.Body>
            <Modal.Footer style={modalFooterStyle}>
                <Button
                    onClick={onCancel}
                >
                    Cancel (Unload File)
                </Button>
                <Button
                    style={{ backgroundColor: '#3e85c7', color: 'white', backgroundImage: 'none' }}
                    onClick={onProceed}
                >
                    Proceed
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

ValidationModal.propTypes = {
    onProceed: PropTypes.func,
    onCancel: PropTypes.func,
    invalidGcode: PropTypes.object,
};

export default ValidationModal;
