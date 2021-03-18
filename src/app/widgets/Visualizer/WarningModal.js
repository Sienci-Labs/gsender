import React from 'react';
import Modal from 'app/components/Modal';
import { Button } from 'app/components/Buttons';
import PropTypes from 'prop-types';

import { modalStyle, modalHeaderStyle, modalTitleStyle, modalBodyStyle, modalFooterStyle } from './modalStyle';

const WarningModal = ({ onContinue, onIgnoreWarning, onCancel, invalidLine }) => {
    return (
        <Modal
            size="md"
            onClose={onContinue}
            style={modalStyle}
            disableOverlay
        >
            <Modal.Header style={modalHeaderStyle}>
                <Modal.Title style={modalTitleStyle}>
                    Invalid Line Warning
                </Modal.Title>
            </Modal.Header>
            <Modal.Body style={modalBodyStyle}>
                <p style={{ marginTop: '1rem' }}>The following line in your G-Code seems to be invalid:</p>

                <p><code>{invalidLine}</code></p>

                <p>Your job might not run properly</p>
            </Modal.Body>
            <Modal.Footer style={modalFooterStyle}>
                <Button
                    // style={{ backgroundColor: '#3e85c7', color: 'white', backgroundImage: 'none' }}
                    onClick={onCancel}
                >
                    Cancel Job (Unload File)
                </Button>
                <Button
                    style={{ backgroundColor: '#3e85c7', color: 'white', backgroundImage: 'none' }}
                    onClick={onContinue}
                >
                    Continue Job
                </Button>
                <Button
                    style={{ backgroundColor: '#3e85c7', color: 'white', backgroundImage: 'none' }}
                    onClick={onIgnoreWarning}
                >
                    Continue Job and Ignore Future Warnings
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

WarningModal.propTypes = {
    onContinue: PropTypes.func,
    onIgnoreWarning: PropTypes.func,
    onCancel: PropTypes.func,
    invalidLine: PropTypes.string,
};

export default WarningModal;
