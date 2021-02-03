import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';

import styles from './IdleInfo.styl';

/**
 * Idle Information component displaying job information when status is set to idle
 * @param {Object} state Default state given from parent component
 */
const IdleInfo = ({ state }) => {
    const { bbox: { delta }, units, total, remainingTime, fileName, connected } = state;

    /**
     * Format given time value to display minutes and seconds
     * @param {Number} givenTime given time value
     */
    const outputFormattedTime = (givenTime) => {
        if (state.startTime === 0 || !givenTime || givenTime < 0) {
            return '';
        }

        //Given time is a unix timestamp to be compared to unix timestamp 0
        const elapsedMinute = moment(moment(givenTime)).diff(moment.unix(0), 'minutes');
        const elapsedSecond = String((moment(moment(givenTime)).diff(moment.unix(0), 'seconds')));

        //Grab last two characters in the elapsedSecond variable, which represent the seconds that have passed
        const strElapsedSecond = `${(elapsedSecond[elapsedSecond.length - 2] !== undefined ? elapsedSecond[elapsedSecond.length - 2] : '')}${String(elapsedSecond[elapsedSecond.length - 1])}`;
        const formattedSeconds = Number(strElapsedSecond) < 59 ? Number(strElapsedSecond) : `${Number(strElapsedSecond) - 60}`;

        return `${elapsedMinute}m ${Math.abs(formattedSeconds)}s`;
    };

    return connected && fileName ? (
        <div className={styles['idle-info']}>
            <div>
                <span className={styles['file-name']}>{fileName}</span> ({total} lines)
            </div>

            <div>
                {`${delta.x}${units} (X) by ${delta.y}${units} (Y) by ${delta.z}${units} (Z)`}
            </div>

            <div>
                ~ {outputFormattedTime(remainingTime)} runtime
            </div>
        </div>
    ) : (
        <div className={styles['idle-info']}>
            <div>{connected ? 'No File Loaded...' : 'Not Connected to a Machine...'}</div>
        </div>
    );
};

IdleInfo.propTypes = {
    state: PropTypes.object,
};

export default IdleInfo;
