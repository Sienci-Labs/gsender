/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */

import React from 'react';
import PropTypes from 'prop-types';
import styles from './index.styl';

const ToolModal = (props) => {
    ToolModal.propTypes = {
        onClose: PropTypes.string.isRequired,
        component: PropTypes.object.isRequired,
        title: PropTypes.string.isRequired,
        handleClose: PropTypes.func.isRequired
    };

    return (
        <div className={styles.toolModalOverlay}>
            <div className={styles.toolModal}>
                <div className={styles.buttonContainer}>
                    <button type="button" className="fas fa-times" onClick={props.handleClose} />
                </div>
                <div>
                    <h3 className={styles.toolHeader}>{props.title}</h3>
                    <div className={styles.toolContainer}>
                        {props.component}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ToolModal;
