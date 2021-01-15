import React from 'react';
import _ from 'lodash';
import PropTypes from 'prop-types';

import controller from 'app/lib/controller';

import styles from './Overrides.styl';

/**
 * Settingd Area component to display override controls for user
 * @prop {Object} state Default state given from parent component
 *
 */
const SettingsArea = ({ state }) => {
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

    const controllerState = state.controller.state || {};

    const ov = _.get(controllerState, 'status.ov', []);
    const ovF = ov[0];
    const ovS = ov[2];

    const feedrate = _.get(controllerState, 'status.feedrate');
    const spindle = _.get(controllerState, 'status.spindle');

    return (
        <div className={styles['settings-area']}>
            <table>
                <tbody>
                    <tr>
                        <td>Feed:</td>
                        <td style={{ color: '#2B5D8B', width: '55px', textAlign: 'right' }}>{feedrate}</td>
                        <td><button type="button" value={-10} onClick={handleFeedRateChange} aria-label="Decrease Feed Rate by 10%">- -</button></td>
                        <td><button type="button" value={-1} onClick={handleFeedRateChange} aria-label="Decrease Feed Rate by 1%">-</button></td>
                        <td><button type="button" value={1} onClick={handleFeedRateChange} aria-label="Increase Feed Rate by 1%">+</button></td>
                        <td><button type="button" value={10} onClick={handleFeedRateChange} aria-label="Increase Feed Rate by 10%">++</button></td>
                        <td><button type="button" value={0} onClick={handleFeedRateChange} aria-label="Reset Feed Rate to 100%"><i className="fa fa-undo" /></button></td>
                        <td><label>{`${ovF}%`}</label>
                        </td>
                    </tr>
                    <tr>
                        <td>Spindle:</td>
                        <td style={{ color: '#2B5D8B', width: '55px', textAlign: 'right' }}>{spindle}</td>
                        <td><button type="button" value={-10} onClick={handleSpindleSpeedChange} aria-label="Decrease Spindle Speed by 10%">- -</button></td>
                        <td><button type="button" value={-1} onClick={handleSpindleSpeedChange} aria-label="Decrease Spindle Speed by 1%">-</button></td>
                        <td><button type="button" value={1} onClick={handleSpindleSpeedChange} aria-label="Increase Spindle Speed by 10%">+</button></td>
                        <td><button type="button" value={10} onClick={handleSpindleSpeedChange} aria-label="Increase Spindle Speed by 10%">++</button></td>
                        <td><button type="button" value={0} onClick={handleSpindleSpeedChange} aria-label="Reset Spindle Speed to 100%"><i className="fa fa-undo" /></button></td>
                        <td><label>{`${ovS}%`}</label>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

SettingsArea.propTypes = {
    state: PropTypes.object,
};

export default SettingsArea;
