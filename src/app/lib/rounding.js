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
    'workspace.probeProfile.xyThickness',
    'workspace.probeProfile.zThickness',
    'workspace.probeProfile.plateWidth',
    'workspace[probeProfile].xyThickness',
    'workspace[probeProfile].zThickness',
    'workspace[probeProfile].plateWidth',
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
    'widgets.axes.jog.rapid.xyStep',
    'widgets.axes.jog.rapid.zStep',
    'widgets.axes.jog.rapid.feedrate',
    'widgets.axes.jog.normal.xyStep',
    'widgets.axes.jog.normal.zStep',
    'widgets.axes.jog.normal.feedrate',
    'widgets.axes.jog.precise.xyStep',
    'widgets.axes.jog.precise.zStep',
    'widgets.axes.jog.precise.feedrate',
    'widgets.axes.jog.step',
    'widgets.axes.jog.distances',
    'widgets.location.jog.step',
    'widgets.location.jog.distances',
    'widgets.probe.probeFeedrate',
    'widgets.probe.probeFastFeedrate',
    'widgets.probe.retractionDistance',
    'widgets.probe.zProbeDistance',
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
    'widgets["axes"].jog.rapid.xyStep',
    'widgets["axes"].jog.rapid.zStep',
    'widgets["axes"].jog.rapid.feedrate',
    'widgets["axes"].jog.normal.xyStep',
    'widgets["axes"].jog.normal.zStep',
    'widgets["axes"].jog.normal.feedrate',
    'widgets["axes"].jog.precise.xyStep',
    'widgets["axes"].jog.precise.zStep',
    'widgets["axes"].jog.precise.feedrate',
    'widgets["axes"].jog.step',
    'widgets["axes"].jog.distances',
    'widgets["location"].jog.step',
    'widgets["location"].jog.distances',
    'widgets["probe"].probeFeedrate',
    'widgets["probe"].probeFastFeedrate',
    'widgets["probe"].retractionDistance',
    'widgets["probe"].zProbeDistance',
]);

export const roundImperial = (val) => {
    return Number(Number(val).toFixed(3));
};

export const roundMetric = (val) => {
    return Number(Number(val).toFixed(2));
};

export const round = (val, units) => {
    if (units === METRIC_UNITS) {
        return roundMetric(val);
    } else {
        return roundImperial(val);
    }
};

// rounds applicable values
// recursive, looks through object properties
export const determineRoundedValue = (key, value) => {
    const isObject = value instanceof Object;
    const isArray = Array.isArray(value);

    // if object, recurse
    if (isObject && !isArray) {
        let newVal = {};
        Object.keys(value).forEach((el, index) => {
            newVal[el] = determineRoundedValue(key + '.' + el, value[el]);
        });
        return newVal;
    // if array and is something we should round, iterate through the values and round
    } else if (isArray && storeValuesThatNeedRounding.has(key)) {
        return value.map((el) => roundMetric(el));
    // if a single value, round
    } else if (storeValuesThatNeedRounding.has(key)) {
        return roundMetric(value);
    }
    return value;
};
