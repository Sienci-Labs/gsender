import React from 'react';
import classnames from 'classnames';
import styles from './index.styl';


const UnlockAlarmButton = ({ onClick }) => {
    return (
        <div className={styles.alarmButtonWrap}>
            <button className={styles.alarmButton} onClick={onClick}>
                <i
                    className={classnames('fas', 'fa-unlock')}
                    role="button"
                    tabIndex={-1}
                />
                Click to Unlock Machine
            </button>
        </div>

    );
};

export default UnlockAlarmButton;
