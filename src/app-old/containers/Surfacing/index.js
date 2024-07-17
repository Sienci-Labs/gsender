import React from 'react';
import PropTypes from 'prop-types';

import Modal from 'app/components/ToolModal/ToolModal';

import Surfacing from './components/Surfacing';

/**
 * @component Surfacing
 * @description Main component for displaying the Surfacing modal
 * @prop {Function} modalClose - Function to close the current modal
 */
const SurfacingModal = ({ modalClose, isDisabled }) => {
    return (
        <Modal title="Surfacing Tool" onClose={modalClose} size="lg">
            <Surfacing onClose={modalClose} isDisabled={isDisabled} />
        </Modal>
    );
};

SurfacingModal.propTypes = {
    modalClose: PropTypes.func.isRequired,
};

export default SurfacingModal;
