import React from 'react';
import cx from 'classnames';
import styles from './Index.styl';

const renderConnectionStatusIcon = (connected, connecting, scanning, alertMessage) => {
    if (connected) {
        return 'fa fa-check';
    } else if (alertMessage) {
        return 'fa fa-times';
    } else if (connecting) {
        return 'fa fa-spinner';
    } else if (scanning) {
        return styles.scanner;
    }
    return 'fa fa-plug';
};

const getIconState = (connected, connecting, scanning, alertMessage) => {
    if (connected) {
        return 'icon-connected';
    } else if (alertMessage) {
        return 'icon-error';
    } else if (connecting) {
        return 'icon-connecting';
    }
    return 'icon-disconnected';
};

const StatusIndicator = ({ connected, connecting, scanning, alertMessage }) => {
    const iconState = getIconState(connected, connecting, scanning, alertMessage);

    return (
        <div className={cx(styles.statusWrapper, styles[iconState])}>
            <i className={`${renderConnectionStatusIcon(connected, connecting, scanning, alertMessage)}`} />
        </div>
    );
};

export default StatusIndicator;
