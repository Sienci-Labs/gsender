import React from 'react';
import { connect } from 'react-redux';
import { get } from 'lodash';
import cx from 'classnames';
import styles from '../index.styl';
import PinRow from './PinRow';

const PinStatus = ({ pins }) => {
    return (
        <div className={cx(styles.pins, styles.card)}>
            <h2>Pins</h2>
            <PinRow label="X Limit" value={pins.X} />
            <PinRow label="Y Limit" value={pins.Y} />
            <PinRow label="Z Limit" value={pins.Z} />
            <PinRow label="Probe" value={pins.P} />
            <PinRow label="Door" value={pins.D} />
            <PinRow label="Cycle-Start" value={pins.S} />
            <PinRow label="Hold" value={pins.H} />
            <PinRow label="Soft-Reset" value={pins.R} />
        </div>
    );
};

export default connect((store) => {
    const pins = get(store, 'controller.state.status.pinState', {});

    return {
        pins
    };
})(PinStatus);
