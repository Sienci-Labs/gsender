import React from 'react';
import Modal from 'app/components/ToolModal/ToolModal';
import PropType from 'prop-types';


const DialogBox = ({ title = '', show = false, children, onClose }) => {
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

DialogBox.propType = {
    title: PropType.string.isRequired,
    show: PropType.bool.isRequired,
    children: PropType.children,
    onClose: PropType.func.isRequired,
};

export default DialogBox;
