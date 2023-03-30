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
import get from 'lodash/get';
import debounce from 'lodash/debounce';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import controller from 'app/lib/controller';
import { mapPositionToUnits } from 'app/lib/units';
import { METRIC_UNITS } from 'app/constants';
import store from 'app/store';

import styles from './Overrides.styl';
import Slider from '../../../components/Slider/Slider';
import FeedControlButton from './FeedControlButton';

const VALUE_RANGES = {
    MIN: 5,
    MAX: 230
};

/**
 * Settings Area component to display override controls for user
 * @prop {Object} state Default state given from parent component
 *
 */
const SettingsArea = ({ state, ovF, ovS, spindle, feedrate }) => {
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
    const updateFeedRateChange = (value) => {
        const feedRate = Number(value) || 100;

        if (feedRate < VALUE_RANGES.MIN && feedrate > VALUE_RANGES.MAX) {
            return;
        }

        controller.command('feedOverride', feedRate);
    };

    /**
     * Override spindle with given value
     * @param {Event} e Event Object
     */
    const updateSpindleSpeedChange = (value) => {
        const spindleSpeed = Number(value) || 100;

        if (spindleSpeed < VALUE_RANGES.MIN && spindleSpeed > VALUE_RANGES.MAX) {
            return;
        }
        console.log(spindleSpeed);
        controller.command('spindleOverride', spindleSpeed);
    };

    // debounced handlers
    const debouncedSpindleHandler = debounce((val) => updateSpindleSpeedChange(val), 500);
    const debouncedFeedHandler = debounce((val) => updateFeedRateChange(val), 500);

    const handleMachineProfileChange = () => {
        setShowSpindleOverride(store.get('workspace.machineProfile.spindle'));
    };

    useEffect(() => {
        store.on('change', handleMachineProfileChange);

        return () => {
            store.removeListener('change', handleMachineProfileChange);
        };
    }, []);
    const { spindleOverrideLabel } = state;

    return (
        <div className={styles.overrides}>
            <div className={styles.overridesItem}>
                <div className={styles.overridesValueWrapper}>
                    <span style={{ color: 'grey' }}>Feed</span>
                    <span className={styles.overrideValue}>{Math.round(feedrate * 100) / 100} {unitString}</span>
                </div>
                <Slider
                    min={VALUE_RANGES.MIN}
                    max={VALUE_RANGES.MAX}
                    value={ovF || 100}
                    unitString="%"
                    step={5}
                    onChange={(e) => {
                        debouncedFeedHandler(e.target.value);
                    }}
                />
                <div className={styles.overridesButtonsWrapper}>
                    <FeedControlButton value="100" onClick={() => updateFeedRateChange(100)}>
                        <i className="fas fa-redo fa-flip-horizontal" />
                    </FeedControlButton>
                    <FeedControlButton value="-5" onClick={() => updateFeedRateChange(ovF - 5)}>
                        <i className="fas fa-minus" />
                    </FeedControlButton>
                    <FeedControlButton value="5" onClick={() => updateFeedRateChange(ovF + 5)}>
                        <i className="fas fa-plus" />
                    </FeedControlButton>
                </div>
            </div>

            {
                showSpindleOverride && (
                    <div className={styles.overridesItem}>
                        <div className={styles.overridesValueWrapper}>
                            <span style={{ color: 'grey' }}>{spindleOverrideLabel}</span>
                            <span className={styles.overrideValue}>{spindle} rpm</span>
                        </div>
                        <Slider
                            min={VALUE_RANGES.MIN}
                            max={VALUE_RANGES.MAX}
                            value={ovS || 100}
                            unitString="%"
                            step={5}
                            onChange={(e) => {
                                debouncedSpindleHandler(e.target.value);
                            }}
                        />
                        <div className={styles.overridesButtonsWrapper}>
                            <FeedControlButton value="100" onClick={() => updateSpindleSpeedChange(100)}>
                                <i className="fas fa-redo fa-flip-horizontal" />
                            </FeedControlButton>
                            <FeedControlButton value="-5" onClick={() => updateSpindleSpeedChange(ovS - 5)}>
                                <i className="fas fa-minus" />
                            </FeedControlButton>
                            <FeedControlButton value="5" onClick={() => updateSpindleSpeedChange(ovS + 5)}>
                                <i className="fas fa-plus" />
                            </FeedControlButton>
                        </div>
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
    const ov = get(controllerState, 'status.ov', [0, 0, 0]);
    const ovF = ov[0];
    const ovS = ov[2];

    return {
        controllerState,
        spindle,
        feedrate,
        ovF,
        ovS
    };
})(SettingsArea);
