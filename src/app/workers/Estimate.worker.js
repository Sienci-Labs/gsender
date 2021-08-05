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

onmessage = function({ data }) {
    const { content, name, size, feedArray = null, accelArray = null } = data;
    const lines = [];

    const processor = new GCodeProcessor({ axisLabels: ['x', 'y', 'z'], maxFeed: feedArray, acceleration: accelArray });
    const start = Date.now();
    processor.process(content);
    console.log(`Finished processing in ${Date.now() - start} ms`);

    postMessage({
        name,
        size,
        total: (lines.length + 1),
        toolSet: processor.vmState.tools,
        spindleSet: processor.vmState.spindleRates,
        movementSet: processor.vmState.feedrates,
        invalidGcode: processor.vmState.invalidGcode,
        estimatedTime: processor.vmState.totalTime,
        bbox: processor.getBBox(),
        fileModal: processor.vmState.units
    });
};
