import React from 'react';
import classNames from 'classnames';
import styles from '../index.styl';


const FirmwareFlashing = ({ active, state, actions }) => {
    return (
        <div className={classNames(
            styles.hidden,
            styles.settingsContainer,
            { [styles.visible]: active }
        )}
        >
            <h3>
               Firmware Flashing
            </h3>
        </div>
    );
};

export default FirmwareFlashing;
