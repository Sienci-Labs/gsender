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
import styles from './index.styl';
import TooltipCustom from '../../components/TooltipCustom/ToolTip';
import NumberInput from './NumberInput';
import { METRIC_UNITS } from '../../constants';

const SpeedControl = ({ state, actions }) => {
    const { units, jog } = state;
    const { xyStep, zStep, feedrate } = jog;

    const xyMin = (units === METRIC_UNITS) ? 0.01 : 0.001;
    const zMin = (units === METRIC_UNITS) ? 0.01 : 0.001;
    const xyMax = (units === METRIC_UNITS) ? 1000 : 20;
    const zMax = (units === METRIC_UNITS) ? 60 : 5;
    const speedMin = (units === METRIC_UNITS) ? 50 : 2;
    const speedMax = (units === METRIC_UNITS) ? 50000 : 2000;
    const decimals = (units === METRIC_UNITS) ? 2 : 3;

    return (
        <div className={styles.speedControls}>
            <div className={styles.controlGroup}>
                <span className={styles.controlGroupLabel}>XY move ({units})</span>
                <TooltipCustom content="Specify XY axis jog distance" location="default">
                    <NumberInput
                        value={xyStep}
                        min={xyMin}
                        max={xyMax}
                        changeHandler={actions.handleXYStepChange}
                        decimals={decimals}
                    />
                </TooltipCustom>
            </div>
            <div className={styles.controlGroup}>
                <span>Z move ({units})</span>
                <TooltipCustom content="Specify Z axis jog distance" location="default">
                    <NumberInput
                        value={zStep}
                        min={zMin}
                        max={zMax}
                        changeHandler={actions.handleZStepChange}
                        decimals={decimals}
                    />
                </TooltipCustom>
            </div>
            <div className={styles.controlGroup}>
                <span className={styles.speed}>Speed ({units}/min)</span>
                <TooltipCustom content="Specify jog speed all axis" location="default">
                    <NumberInput
                        value={feedrate}
                        min={speedMin}
                        max={speedMax}
                        changeHandler={actions.handleFeedrateChange}
                        decimals={0}
                    />
                </TooltipCustom>
            </div>
        </div>
    );
};

export default SpeedControl;
