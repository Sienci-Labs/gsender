import React from 'react';
import PropTypes from 'prop-types';
import Modal from 'app/components/Modal';
import Surfacing from './Surfacing';

/**
 * @component Surfacing
 * @description Main component for displaying the Surfacing modal
 * @prop {Function} modalClose - Function to close the current modal
 */
const SurfacingModal = ({ modalClose }) => {
    return (
        <Modal onClose={modalClose} size="lg" disableOverlay>
            <Surfacing onClose={modalClose} showTitle />
        </Modal>
    );
};

SurfacingModal.propTypes = {
    modalClose: PropTypes.func.isRequired,
};

export default SurfacingModal;
