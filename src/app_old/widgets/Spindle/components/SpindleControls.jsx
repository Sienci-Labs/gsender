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
import FunctionButton from '../../../components/FunctionButton/FunctionButton';
import Slider from './Slider';
import styles from '../index.styl';

const SpindleControls = ({ actions, state }) => {
    const { canClick } = state;
    return (
        <div className={styles.controlContainer}>
            <div className={styles.controlRow}>
                <FunctionButton onClick={actions.sendM3} disabled={!canClick}>
                    <i className="fas fa-redo-alt" />
                    CW (M3)
                </FunctionButton>
                <FunctionButton onClick={actions.sendM4} disabled={!canClick}>
                    <i className="fas fa-redo-alt fa-flip-horizontal" />
                    CCW (M4)
                </FunctionButton>
                <FunctionButton onClick={actions.sendM5} disabled={!canClick}>
                    <i className="fas fa-ban" />
                    Stop (M5)
                </FunctionButton>
            </div>
            <Slider
                label="Speed"
                unitString="RPM"
                value={state.spindleSpeed}
                min={state.spindleMin}
                max={state.spindleMax}
                step={10}
                onChange={actions.handleSpindleSpeedChange}
            />
        </div>
    );
};

export default SpindleControls;
