import React from 'react';
import cx from 'classnames';
import styles from './Index.styl';

const renderConnectionStatusIcon = (connected, connecting, alertMessage) => {
    if (connected) {
        return 'fa-check';
    } else if (alertMessage) {
        return 'fa-times';
    } else if (connecting) {
        return 'fa-spinner';
    }
    return 'fa-plug';
};

const getIconState = (connected, connecting, alertMessage) => {
    if (connected) {
        return 'icon-connected';
    } else if (alertMessage) {
        return 'icon-error';
    } else if (connecting) {
        return 'icon-connecting';
    }
    return 'icon-disconnected';
};

const StatusIndicator = ({ connected, connecting, alertMessage }) => {
    const iconState = getIconState(connected, connecting, alertMessage);

    return (
        <div className={cx(styles.statusWrapper, styles[iconState])}>
            <i className={`fa ${renderConnectionStatusIcon(connected, connecting, alertMessage)}`} />
        </div>
    );
};

export default StatusIndicator;
