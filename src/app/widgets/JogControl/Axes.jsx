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

import PropTypes from 'prop-types';
import React from 'react';
import Keypad from './Keypad';
import SpeedControls from './SpeedControls';
import styles from './index.styl';

const Axes = (props) => {
    const { state, actions } = props;
    if (state.isSecondary) {
        return (
            <div className={styles.jogWidget}>
                <Keypad
                    canClick={state.canClick}
                    canClickCancel={state.canClickCancel}
                    units={state.units}
                    axes={state.axes}
                    jog={state.jog}
                    actions={actions}
                    isJogging={state.isJogging}
                    activeState={state.activeState}
                    selectedSpeed={state.selectedSpeed}
                    canJog={state.canJog}
                />
            </div>
        );
    }

    return (
        <div className={styles.jogWidget}>
            <Keypad
                canClick={state.canClick}
                canClickCancel={state.canClickCancel}
                units={state.units}
                axes={state.axes}
                jog={state.jog}
                actions={actions}
                isJogging={state.isJogging}
                activeState={state.activeState}
                selectedSpeed={state.selectedSpeed}
                canJog={state.canJog}
            />
            <SpeedControls state={state} actions={actions} />
        </div>
    );
};

Axes.propTypes = {
    state: PropTypes.object,
    actions: PropTypes.object
};

export default Axes;
