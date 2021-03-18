import React from 'react';
import moment from 'moment';
import PropTypes from 'prop-types';

import i18n from 'app/lib/i18n';

import styles from './Overrides.styl';

/**
 * Progress Area component to display running job information
 * @prop {Object} state Default state given from parent component
 *
 */
const ProgressArea = ({ state }) => {
    /**
     * Format given time value to display minutes and seconds
     * @param {Number} givenTime given time value
     */
    const outputFormattedTime = (givenTime) => {
        if (state.startTime === 0 || !givenTime || givenTime < 0) {
            return '-';
        }

        //Given time is a unix timestamp to be compared to unix timestamp 0
        const elapsedMinute = moment(moment(givenTime)).diff(moment.unix(0), 'minutes');
        const elapsedSecond = String((moment(moment(givenTime)).diff(moment.unix(0), 'seconds')));

        //Grab last two characters in the elapsedSecond variable, which represent the seconds that have passed
        const strElapsedSecond = `${(elapsedSecond[elapsedSecond.length - 2] !== undefined ? elapsedSecond[elapsedSecond.length - 2] : '')}${String(elapsedSecond[elapsedSecond.length - 1])}`;
        const formattedSeconds = Number(strElapsedSecond) < 59 ? Number(strElapsedSecond) : `${Number(strElapsedSecond) - 60}`;

        return `${elapsedMinute}m ${Math.abs(formattedSeconds)}s`;
    };

    const { total, received, elapsedTime, remainingTime, fileName } = state;

    // eslint-disable-next-line no-restricted-globals
    const percentageValue = isNaN(((received / total) * 100).toFixed(0)) ? 0 : ((received / total) * 100).toFixed(0);

    return (
        <div className={styles.progressArea}>
            <span className={styles.progressName}>{ fileName }</span>
            <table className={styles['progress-area-table']}>
                <tbody>
                    <tr>
                        <td style={{ width: '90%' }}>
                            <div className="progress" style={{ margin: 0, height: '28px', backgroundColor: '#d1d5db' }}>
                                <div className="progress-bar" style={{ width: `${percentageValue}%`, color: '#333', backgroundImage: 'linear-gradient(to right, #77AAD8 , #2B5D8B)' }} />
                                <div className={styles['lines-processed']}>{` ${received} ${i18n._('of')} ${total} ${i18n._('lines')}`}</div>
                            </div>
                        </td>
                        <td style={{ width: '10%', textAlign: 'right' }}>{percentageValue}%</td>
                    </tr>
                </tbody>
            </table>

            <div className={styles.times}>
                <div style={{ color: 'grey' }}><span style={{ color: '#7a93d6' }}>{outputFormattedTime(elapsedTime)}</span> {i18n._('since start')}</div>
                <div style={{ color: 'grey' }}><span style={{ color: '#7a93d6' }}>{outputFormattedTime(remainingTime)}</span> {i18n._('remaining')}</div>
            </div>
        </div>
    );
};

ProgressArea.propTypes = {
    state: PropTypes.object,
};

export default ProgressArea;
