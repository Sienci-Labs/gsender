import React from 'react';
import moment from 'moment';
import PropTypes from 'prop-types';
import _ from 'lodash';

import controller from 'app/lib/controller';
import i18n from 'app/lib/i18n';

import styles from './Overrides.styl';

/**
 * Override component responsible for allowing feed rate and spindle overrides as well as displaying their values
 * @prop {Object} state Default state given from parent component
 *
 */
const Overrides = ({ state }) => {
    /**
     * Override feed rate with given value
     * @param {Event} e Event Object
     */
    const handleFeedRateChange = (e) => {
        const feedRate = Number(e.target.value) || 0;

        controller.command('feedOverride', feedRate);
    };

    /**
     * Override spindle with given value
     * @param {Event} e Event Object
     */
    const handleSpindleSpeedChange = (e) => {
        const spindleSpeed = Number(e.target.value) || 0;

        controller.command('spindleOverride', spindleSpeed);
    };

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

        return `${elapsedMinute}m ${formattedSeconds}s`;
    };

    const { total, received, elapsedTime, remainingTime } = state;
    const controllerState = state.controller.state || {};

    // eslint-disable-next-line no-restricted-globals
    const percentageValue = isNaN(((received / total) * 100).toFixed(0)) ? 0 : ((received / total) * 100).toFixed(0);

    const ov = _.get(controllerState, 'status.ov', []);
    const ovF = ov[0];
    const ovS = ov[2];

    const feedrate = _.get(controllerState, 'status.feedrate');
    const spindle = _.get(controllerState, 'status.spindle');

    return (
        <div className={styles.wrapper}>
            <div style={{ width: '100%', maxWidth: '500px' }}>
                <table className={styles['progress-area']}>
                    <tbody>
                        <tr>
                            <td style={{ width: '90%' }}>
                                <div className="progress" style={{ margin: 0 }}>
                                    <div className="progress-bar" style={{ width: `${percentageValue}%`, color: '#333', backgroundImage: 'linear-gradient(to right, #65A0F0 , #2B66DE)' }} />
                                    <div className={styles['lines-processed']}>{` ${received} ${i18n._('of')} ${total} ${i18n._('lines')}`}</div>
                                </div>
                            </td>
                            <td style={{ width: '10%', textAlign: 'right' }}>{percentageValue}%</td>
                        </tr>
                    </tbody>
                </table>

                <div className={styles.times}>
                    <div className="time-since-start"><span style={{ color: '#7a93d6' }}>{outputFormattedTime(elapsedTime)}</span> {i18n._('since start')}</div>
                    <div className="remaining-time"><span style={{ color: '#7a93d6' }}>{outputFormattedTime(remainingTime)}</span> {i18n._('remaining')}</div>
                </div>
            </div>

            <div className={styles['settings-area']}>
                <table>
                    <tbody>
                        <tr>
                            <td>Feed:</td>
                            <td>{feedrate}</td>
                            <td><button type="button" value={-10} onClick={handleFeedRateChange}>- -</button></td>
                            <td><button type="button" value={-1} onClick={handleFeedRateChange}>-</button></td>
                            <td><button type="button" value={1} onClick={handleFeedRateChange}>+</button></td>
                            <td><button type="button" value={10} onClick={handleFeedRateChange}>++</button></td>
                            <td><button type="button" value={0} onClick={handleFeedRateChange}><i className="fa fa-undo" /></button></td>
                            <td><input type="text" value={`${ovF}%`} disabled />
                            </td>
                        </tr>
                        <tr>
                            <td>Spindle:</td>
                            <td>{spindle}</td>
                            <td><button type="button" value={-10} onClick={handleSpindleSpeedChange}>- -</button></td>
                            <td><button type="button" value={-1} onClick={handleSpindleSpeedChange}>-</button></td>
                            <td><button type="button" value={1} onClick={handleSpindleSpeedChange}>+</button></td>
                            <td><button type="button" value={10} onClick={handleSpindleSpeedChange}>++</button></td>
                            <td><button type="button" value={0} onClick={handleSpindleSpeedChange}><i className="fa fa-undo" /></button></td>
                            <td><input type="text" value={`${ovS}%`} disabled />
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

Overrides.propTypes = {
    state: PropTypes.object,
};

export default Overrides;
