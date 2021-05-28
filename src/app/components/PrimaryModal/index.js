import React from 'react';
import PropTypes from 'prop-types';
import Modal from 'app/components/Modal';
import styles from './index.styl';

const PrimaryModal = ({ children, onClose, title, footer, size }) => {
    return (
        <Modal onClose={onClose} size={size}>
            <div className={styles.header}>
                <h3 className={styles.headerText}>{title}</h3>
            </div>

            <div className={styles.container}>
                {children}

                {footer && <div className={styles.footer}>{footer}</div>}
            </div>
        </Modal>
    );
};

PrimaryModal.propTypes = {
    title: PropTypes.string,
    footer: PropTypes.element,
    onClose: PropTypes.func,
    size: PropTypes.string,
};

PrimaryModal.defaultProps = {
    title: 'Title',
    size: 'lg'
};

export default PrimaryModal;
