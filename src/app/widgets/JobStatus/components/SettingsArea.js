/*
 * Copyright (C) 2021 Sienci Labs Inc.
 *
 * This file is part of gSender.
 *
 * gSender is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, under version 3 of the License.
 *
 * gSender is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with gSender.  If not, see <https://www.gnu.org/licenses/>.
 *
 * Contact for information regarding this program and its license
 * can be sent through gSender@sienci.com or mailed to the main office
 * of Sienci Labs Inc. in Waterloo, Ontario, Canada.
 *
 */

import React, { useState, useEffect } from 'react';
import _ from 'lodash';
import get from 'lodash/get';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import controller from 'app/lib/controller';
import { mapPositionToUnits } from 'app/lib/units';
import { METRIC_UNITS } from 'app/constants';
import store from 'app/store';

import styles from './Overrides.styl';
import Slider from '../../../components/Slider/Slider';
import FeedControlButton from './FeedControlButton';

/**
 * Settings Area component to display override controls for user
 * @prop {Object} state Default state given from parent component
 *
 */
const SettingsArea = ({ state, controllerState, spindle, feedrate }) => {
    const [showSpindleOverride, setShowSpindleOverride] = useState(store.get('workspace.machineProfile.spindle'));

    const { units } = state;
    const unitString = `${units}/min`;
    if (units !== METRIC_UNITS) {
        spindle = mapPositionToUnits(spindle, units);
        feedrate = mapPositionToUnits(feedrate, units);
    }

    /**
     * Override feed rate with given value with backend call
     * @param {Event} e Event Object
     */
    const updateFeedRateChange = (e) => {
        const feedRate = Number(e.target.value) || 100;
        setOvF(feedRate);
        console.log('Feeder: ' + feedRate);
        controller.command('feedOverride', feedRate);
    };

    /**
     * Override spindle with given value
     * @param {Event} e Event Object
     */
    const updateSpindleSpeedChange = (e) => {
        const spindleSpeed = Number(e.target.value) || 100;
        setOvS(spindleSpeed);
        console.log('Spindle: ' + spindleSpeed);
        controller.command('spindleOverride', spindleSpeed);
    };

    const handleMachineProfileChange = () => {
        setShowSpindleOverride(store.get('workspace.machineProfile.spindle'));
    };

    useEffect(() => {
        store.on('change', handleMachineProfileChange);

        return () => {
            store.removeListener('change', handleMachineProfileChange);
        };
    }, []);

    let ov = _.get(controllerState, 'status.ov', []);
    const [ovF, setOvF] = useState(ov[0]);
    const [ovS, setOvS] = useState(ov[2]);
    const { spindleOverrideLabel } = state;
    return (
        <div className={styles['settings-area']}>
            <div className={styles.overrides}>
                <span className={styles.overrideValue}>{feedrate} {unitString}</span>
                <Slider
                    min={0}
                    max={230}
                    label="Feed:"
                    value={ovF || 100}
                    unitString="%"
                    step={5}
                    onChange={(e) => {
                        setOvF(e.target.value);
                    }}
                    onMouseUp={updateFeedRateChange}
                />
                <FeedControlButton value={100} onClick={updateFeedRateChange}><i className="fas fa-redo fa-flip-horizontal" /></FeedControlButton>
            </div>

            {
                showSpindleOverride && (
                    <div className={styles.overrides}>
                        <span className={styles.overrideValue}>{spindle} rpm</span>
                        <Slider
                            min={0}
                            max={230}
                            label={`${spindleOverrideLabel}:`}
                            value={ovS || 100}
                            unitString="%"
                            step={5}
                            onChange={(e) => {
                                setOvS(e.target.value);
                            }}
                            onMouseUp={updateSpindleSpeedChange}
                        />
                        <FeedControlButton value={100} onClick={updateSpindleSpeedChange}><i className="fas fa-redo fa-flip-horizontal" /></FeedControlButton>
                    </div>
                )
            }
        </div>
    );
};

SettingsArea.propTypes = {
    state: PropTypes.object,
};

export default connect((store) => {
    const controllerState = get(store, 'controller.state');
    let spindle = get(controllerState, 'status.spindle');
    let feedrate = get(controllerState, 'status.feedrate');

    return {
        controllerState,
        spindle,
        feedrate
    };
})(SettingsArea);
