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

import { METRIC_UNITS } from '../constants';

const storeValuesThatNeedRounding = new Set([
    'workspace.safeRetractHeight',
    'workspace.toolChangePosition.x',
    'workspace.toolChangePosition.y',
    'workspace.toolChangePosition.z',
    'widgets.rotary.stockTurning.options.stockLength',
    'widgets.rotary.stockTurning.options.stepdown',
    'widgets.rotary.stockTurning.options.bitDiameter',
    'widgets.rotary.stockTurning.options.stepover',
    'widgets.rotary.stockTurning.options.startHeight',
    'widgets.rotary.stockTurning.options.finalHeight',
    'widgets.surfacing.bitDiameter',
    'widgets.surfacing.stepover',
    'widgets.surfacing.length',
    'widgets.surfacing.width',
    'widgets.surfacing.skimDepth',
    'widgets.surfacing.maxDepth',
    'widgets.spindle.laser.xOffset',
    'widgets.spindle.laser.yOffset',
    'widgets["rotary"].stockTurning.options.stockLength',
    'widgets["rotary"].stockTurning.options.stepdown',
    'widgets["rotary"].stockTurning.options.bitDiameter',
    'widgets["rotary"].stockTurning.options.stepover',
    'widgets["rotary"].stockTurning.options.startHeight',
    'widgets["rotary"].stockTurning.options.finalHeight',
    'widgets["surfacing"].bitDiameter',
    'widgets["surfacing"].stepover',
    'widgets["surfacing"].length',
    'widgets["surfacing"].width',
    'widgets["surfacing"].skimDepth',
    'widgets["surfacing"].maxDepth',
    'widgets["spindle"].laser.xOffset',
    'widgets["spindle"].laser.yOffset',
]);

export const roundImperial = (val) => {
    return Number(val).toFixed(3);
};

export const roundMetric = (val) => {
    return Number(val).toFixed(2);
};

export const round = (val, units) => {
    if (units === METRIC_UNITS) {
        return roundMetric(val);
    } else {
        return roundImperial(val);
    }
};

// determine whether value needs to be rounded or not
// recursive, looks through object properties
export const determineRoundedValue = (key, value) => {
    console.log(key);
    console.log(value);
    if (value instanceof Object) {
        return Object.keys(value).map((el, index) => {
            return determineRoundedValue(key + '.' + el, value[el]);
        });
    }
    if (storeValuesThatNeedRounding.has(key)) {
        return roundMetric(value);
    }
    return value;
};
