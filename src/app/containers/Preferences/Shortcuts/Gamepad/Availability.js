import React from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';

import styles from '../index.styl';
import { AVAILABILITY_TYPES } from '../utils';
import Listener from './Listener';

const { DEFAULT, AVAILABLE, UNAVAILABLE, IS_THE_SAME } = AVAILABILITY_TYPES;

const ButtonsPressed = ({ shortcut }) => {
    if (!shortcut) {
        return null;
    }
    return (
        <div>
            Button Combo:{' '}
            {
                shortcut.map((item, i) => (
                    i === 0
                        ? <strong key={item.buttonIndex}>{item.buttonIndex}</strong>
                        : <React.Fragment key={item.buttonIndex}> and <strong>{item.buttonIndex}</strong></React.Fragment>
                ))
            }
        </div>
    );
}; ButtonsPressed.propTypes = { shortcut: PropTypes.array };

const Availability = ({ type, shortcutTitle, shortcut, listenerRef }) => {
    const output = {
        [DEFAULT]: (
            <div className={styles.availability}>
                <i className="fas fa-info-circle" />
                <p style={{ textAlign: 'center' }}>Press any button or button combination on your gamepad</p>
            </div>
        ),
        [AVAILABLE]: (
            <div className={styles.available}>
                <i className={classnames('fas fa-check-circle')} />
                <p style={{ margin: 0 }}>Shortcut is Availabile</p>
                <ButtonsPressed shortcut={shortcut} />
            </div>
        ),
        [UNAVAILABLE]: (
            <div className={styles.unavailable}>
                <i className={classnames('fas fa-times-circle')} />
                <p style={{ margin: 0 }}>Shortcut Already Exists on an Action</p>
            </div>
        ),
        [IS_THE_SAME]: (
            <div className={styles.availability}>
                <i className={classnames('fas fa-info-circle')} />
                <p style={{ margin: 0 }}>This is the Current Shortcut for This Action</p>
            </div>
        ),
    }[type];

    return (
        <div style={{ position: 'relative', height: '100%' }}>
            <span style={{ position: 'absolute', top: 10, left: 10, backgroundColor: 'rgba(255, 255, 255, 0.7)', padding: 10 }}>
                {shortcutTitle}
            </span>
            <Listener ref={listenerRef} />
            {output}
        </div>
    );
};

Availability.propTypes = {
    type: PropTypes.oneOf([DEFAULT, AVAILABLE, UNAVAILABLE, IS_THE_SAME]),
    shortcutTitle: PropTypes.string,
    shortcut: PropTypes.array,
    listenerRef: PropTypes.object
};

export default Availability;
