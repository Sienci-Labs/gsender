import React from 'react';
import cx from 'classnames';
import styles from './toaster.styl';
import { TOASTER_DANGER, TOASTER_INFO, TOASTER_SUCCESS, TOASTER_UNTIL_CLOSE, TOASTER_WARNING } from './ToasterLib';
import ToastTimer from './ToastTimer';

const Toast = ({ id, msg = 'NO_MSG_SPECIFIED', type = TOASTER_INFO, closeHandler, icon = 'fa-info-circle', duration, createdAt, ...rest }) => {
    const hasDuration = duration !== TOASTER_UNTIL_CLOSE;

    return (
        <div id={id} className={styles.toastWrapper}>
            <div
                className={cx(styles.toastIcon,
                    { [styles.toastInfo]: (type === TOASTER_INFO) },
                    { [styles.toastSuccess]: (type === TOASTER_SUCCESS) },
                    { [styles.toastDanger]: (type === TOASTER_DANGER) },
                    { [styles.toastWarning]: (type === TOASTER_WARNING) }
                )}
            >
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
            {
                hasDuration &&
                // eslint-disable-next-line react/style-prop-object
                <ToastTimer duration={duration} createdAt={createdAt} />
            }
        </div>
    );
};

export default Toast;
