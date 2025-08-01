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

import chunk from 'lodash/chunk';
//import ch from 'convex-hull';
import hull from '@markroland/concave-hull'

self.onmessage = ({ data }) => {
    console.log(data);
    const { isLaser = false, parsedData = [] } = data;
    console.log('outline called');

    const getOutlineGcode = (concavity = 20) => {
        let vertices = [];
        parsedData.forEach((n) => vertices.push(Number(n.toFixed(3))));
        console.log(parsedData);
        vertices = chunk(vertices, 3);
        console.log(vertices);

        //const fileHull = hull(vertices);
        //const fileHull = ch(vertices);
        //const fileHull = hull.concaveHull(vertices, 3);
        //console.log(fileHull);

        //const gCode = convertPointsToGCode(fileHull, isLaser);

        return [];
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
        points.forEach((point) => {
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
