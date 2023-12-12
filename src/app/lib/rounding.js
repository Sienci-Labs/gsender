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

import store from '../store';
import { METRIC_UNITS } from '../constants';

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

export const roundAllStoreValues = (newUnits) => {
    let roundFunc = roundImperial;
    if (newUnits === METRIC_UNITS) {
        roundFunc = roundMetric;
    }
    const settings = store.get();
    const newSettings = {
        ...settings,
        workspace: {
            safeRetractHeight: roundFunc(settings.workspace.safeRetractHeight),
            toolChangePosition: {
                x: roundFunc(settings.workspace.toolChangePosition.x),
                y: roundFunc(settings.workspace.toolChangePosition.y),
                z: roundFunc(settings.workspace.toolChangePosition.z),
            },
            machineProfile: {
                ...settings.workspace.machineProfile,
                limits: {
                    xmax: roundFunc(settings.workspace.machineProfile.limits.xmax),
                    ymax: roundFunc(settings.workspace.machineProfile.limits.ymax),
                    zmax: roundFunc(settings.workspace.machineProfile.limits.zmax),
                }
            },
        },
        widgets: {
            rotary: {
                ...settings.widgets.rotary,
                stockTurning: {
                    ...settings.widgets.rotary.stockTurning,
                    options: {
                        ...settings.widgets.rotary.stockTurning.options,
                        stockLength: roundFunc(settings.widgets.rotary.stockTurning.options.stockLength),
                        stepdown: roundFunc(settings.widgets.rotary.stockTurning.options.stepdown),
                        bitDiameter: roundFunc(settings.widgets.rotary.stockTurning.options.bitDiameter),
                        stepover: roundFunc(settings.widgets.rotary.stockTurning.options.stepover),
                        startHeight: roundFunc(settings.widgets.rotary.stockTurning.options.startHeight),
                        finalHeight: roundFunc(settings.widgets.rotary.stockTurning.options.finalHeight),
                    }
                },
                surfacing: {
                    ...settings.widgets.rotary.surfacing,
                    bitDiameter: roundFunc(settings.widgets.rotary.surfacing.bitDiameter),
                    stepover: roundFunc(settings.widgets.rotary.surfacing.stepover),
                    length: roundFunc(settings.widgets.rotary.surfacing.length),
                    width: roundFunc(settings.widgets.rotary.surfacing.width),
                    skimDepth: roundFunc(settings.widgets.rotary.surfacing.skimDepth),
                    maxDepth: roundFunc(settings.widgets.rotary.surfacing.maxDepth),
                }
            }
        }
    };
    store.set('', newSettings);
};
