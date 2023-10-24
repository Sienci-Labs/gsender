import React from 'react';
import cx from 'classnames';
import directionIcon from './assets/direction.svg';
import styles from './index.styl';

const ProbeDirectionSelection = ({ direction, onClick }) => {
    return (
        <div className={styles.directionButtonWrapper}>
            <button type="button" className={cx(styles.directionButton, styles[`direction-d${direction}`])} onClick={onClick}>
                <img alt="Probe direction selection" src={directionIcon} />
            </button>
        </div>
    );
};

export default ProbeDirectionSelection;
