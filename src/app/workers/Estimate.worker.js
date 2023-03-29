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

import { GCodeProcessor } from '../lib/gcodeProcessor/GCodeProcessor';
import { FILE_TYPE } from '../constants';

onmessage = function({ data }) {
    const { content, name, size, feedArray = null, accelArray = null } = data;

    const processor = new GCodeProcessor({ axisLabels: ['x', 'y', 'z', 'a'], maxFeed: feedArray, acceleration: accelArray });
    processor.process(content);

    const fileTypes = {
        [FILE_TYPE.DEFAULT]: FILE_TYPE.DEFAULT,
        [FILE_TYPE.ROTARY]: FILE_TYPE.ROTARY,
        [FILE_TYPE.FOUR_AXIS]: FILE_TYPE.FOUR_AXIS,
    };

    let fileType = FILE_TYPE.DEFAULT;

    if (processor.vmState.usedAxes.has('Y') && processor.vmState.usedAxes.has('A')) {
        fileType = fileTypes[FILE_TYPE.FOUR_AXIS];
    } else if (processor.vmState.usedAxes.has('A')) {
        fileType = fileTypes[FILE_TYPE.ROTARY];
    }

    postMessage({
        name,
        size,
        total: processor.vmState.lineCounter,
        toolSet: processor.vmState.tools,
        spindleSet: processor.vmState.spindleRates,
        movementSet: processor.vmState.feedrates,
        invalidGcode: processor.vmState.invalidGcode,
        estimatedTime: processor.vmState.totalTime,
        bbox: processor.getBBox(),
        fileModal: processor.vmState.units,
        usedAxes: processor.vmState.usedAxes,
        fileType,
    });
};
