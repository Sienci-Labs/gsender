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

import React from 'react';
import _ from 'lodash';
import get from 'lodash/get';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import controller from 'app/lib/controller';
import styles from './Overrides.styl';
import FeedControlButton from './FeedControlButton';

/**
 * Settings Area component to display override controls for user
 * @prop {Object} state Default state given from parent component
 *
 */
const SettingsArea = ({ state, controllerState }) => {
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

    const ov = _.get(controllerState, 'status.ov', []);
    const ovF = ov[0];
    const ovS = ov[2];

    const feedrate = _.get(controllerState, 'status.feedrate');
    const spindle = _.get(controllerState, 'status.spindle');
    const { spindleOverrideLabel } = state;

    return (
        <div className={styles['settings-area']}>
            <div className={styles.overrides}>
                <span>Feed:</span>
                <span className={styles.overrideValue}>{feedrate}</span>
                <FeedControlButton value={-10} onClick={handleFeedRateChange}>- -</FeedControlButton>
                <FeedControlButton value={-1} onClick={handleFeedRateChange}>-</FeedControlButton>
                <FeedControlButton value={1} onClick={handleFeedRateChange}>+</FeedControlButton>
                <FeedControlButton value={10} onClick={handleFeedRateChange}>+ +</FeedControlButton>
                <FeedControlButton value={0} onClick={handleFeedRateChange}><i className="fas fa-redo fa-flip-horizontal" /></FeedControlButton>
                <span>{`${ovF}%`}</span>
            </div>
            <div className={styles.overrides}>
                <span>{ spindleOverrideLabel }:</span>
                <span className={styles.overrideValue}>{spindle}</span>
                <FeedControlButton value={-10} onClick={handleSpindleSpeedChange}>- -</FeedControlButton>
                <FeedControlButton value={-1} onClick={handleSpindleSpeedChange}>-</FeedControlButton>
                <FeedControlButton value={1} onClick={handleSpindleSpeedChange}>+</FeedControlButton>
                <FeedControlButton value={10} onClick={handleSpindleSpeedChange}>+ +</FeedControlButton>
                <FeedControlButton value={0} onClick={handleSpindleSpeedChange}><i className="fas fa-redo fa-flip-horizontal" /></FeedControlButton>
                <span>{`${ovS}%`}</span>
            </div>
        </div>
    );
};

SettingsArea.propTypes = {
    state: PropTypes.object,
};

export default connect((store) => {
    const state = get(store, 'controller.state');
    return {
        controllerState: state
    };
})(SettingsArea);
