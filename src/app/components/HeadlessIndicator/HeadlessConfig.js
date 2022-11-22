import React from 'react';
import Modal from 'app/components/ToolModal/ToolModal';
import PropType from 'prop-types';


const HeadlessConfig = ({ title = '', show = false, children, onClose }) => {
    return (
        <Modal
            title={title}
            size="small"
            disableOverlayClick
            show={show}
            onClose={onClose}
        >
            {children}
        </Modal>
    );
};

HeadlessConfig.propType = {
    title: PropType.string.isRequired,
    show: PropType.bool.isRequired,
    children: PropType.children,
    onClose: PropType.func.isRequired,
};

export default HeadlessConfig;
