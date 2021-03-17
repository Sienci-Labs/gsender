import React from 'react';
import styles from './toaster.styl';
import { TOASTER_INFO } from './ToasterLib';

const Toast = ({ id, msg = 'NO_MSG_SPECIFIED', type = TOASTER_INFO, closeHandler, icon = 'fa-info-circle' }) => {
    return (
        <div className={styles.toastWrapper}>
            <div className={styles.toastIcon}>
                <i className={`fas ${icon}`} />
            </div>
            <div className={styles.toastContent}>
                <div>
                    { msg }
                </div>
            </div>
            <div className={styles.toastClose}>
                <button onClick={closeHandler}>
                    <i className="fas fa-times" />
                </button>
            </div>
        </div>
    );
};

export default Toast;
