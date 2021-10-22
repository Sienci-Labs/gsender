import React from 'react';
import PropTypes from 'prop-types';
import { Provider as ReduxProvider } from 'react-redux';

import reduxStore from 'app/store/redux';
import Modal from 'app/components/ToolModal/ToolModal';
import Surfacing from './Surfacing';

/**
 * @component Surfacing
 * @description Main component for displaying the Surfacing modal
 * @prop {Function} modalClose - Function to close the current modal
 */
const SurfacingModal = ({ modalClose }) => {
    return (
        <Modal title="Surfacing Tool" onClose={modalClose} size="lg">
            <ReduxProvider store={reduxStore}>
                <Surfacing onClose={modalClose} />
            </ReduxProvider>
        </Modal>
    );
};

SurfacingModal.propTypes = {
    modalClose: PropTypes.func.isRequired,
};

export default SurfacingModal;
