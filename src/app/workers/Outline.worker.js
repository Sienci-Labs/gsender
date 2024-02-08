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

import hull from 'concaveman';
import { parse } from 'esprima';

onmessage = ({ data }) => {
    const { isLaser = false, parsedData = [] } = data;
    // Generate an ordered pair - we don't care about Z index for outline purposes, so it's removed
    function vertex(x, y) {
        return [x.toFixed(3), y.toFixed(3)];
    }

    const getOutlineGcode = (concavity = 60) => {
        const fileHull = hull(parsedData);

        const gCode = convertPointsToGCode(fileHull, isLaser);

        return gCode;
    };

    function convertPointsToGCode(points, isLaser = false) {
        const gCode = [];
        const movementModal = isLaser ? 'G1' : 'G0'; // G1 is necessary for laser outline since G0 won't enable it
        gCode.push('%X0=posx,Y0=posy,Z0=posz');
        gCode.push('%MM=modal.distance');
        gCode.push('G21 G91 G0 Z5');
        // Laser outline requires some additional preamble for feedrate and enabling the laser
        if (isLaser) {
            gCode.push('G1F3000 M3 S1');
        }
        points.forEach(point => {
            const [x, y] = point;
            gCode.push(`G21 G90 ${movementModal} X${x} Y${y}`);
        });
        if (isLaser) {
            gCode.push('M5 S0');
        }
        gCode.push('G0 X[X0] Y[Y0]');
        gCode.push('G21 G91 G0 Z-5');

        gCode.push('[MM]');
        return gCode;
    }

    const outlineGcode = getOutlineGcode();
    postMessage({ outlineGcode });
};
