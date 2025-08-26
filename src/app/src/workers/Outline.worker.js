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
import concaveman from 'concaveman';

self.onmessage = ({ data }) => {
    const { isLaser = false, parsedData = [], mode, bbox, zTravel } = data;
    console.log(zTravel);

    const getOutlineGcode = (concavity = 20) => {
        let vertices = [];
        parsedData.forEach((n) => vertices.push(n.toFixed(3)));
        vertices = chunk(vertices, 3);

        //const fileHull = hull(vertices);
        let fileHull = concaveman(vertices);
        fileHull = fileHull.slice(1); // Pop the first element since it's the same as the last and will result in weird movements.

        const gCode = convertPointsToGCode(fileHull, isLaser);

        return gCode;
    };

    const getSimpleOutline = () => {
        if (parsedData && parsedData.length <= 0) {
            return [
                '%X0=posx,Y0=posy,Z0=posz',
                '%MM=modal.distance',
                `G21 G91 G0 Z${zTravel}`,
                'G90',
                'G0 X0 Y0',
                `G0 X[${bbox.min.x}] Y[${bbox.max.y}]`,
                `G0 X[${bbox.max.x}] Y[${bbox.max.y}]`,
                `G0 X[${bbox.max.x}] Y[${bbox.min.y}]`,
                `G0 X[${bbox.min.x}] Y[${bbox.min.y}]`,
                'G0 X[X0] Y[Y0]',
                `G21 G91 G0 Z-${zTravel}`,
                '[MM]',
            ];
        } else {
            return [
                '%X0=posx,Y0=posy,Z0=posz',
                '%MM=modal.distance',
                `G21 G91 G0 Z${zTravel}`,
                'G90',
                'G0 X0 Y0',
                'G0 X[xmin] Y[ymax]',
                'G0 X[xmax] Y[ymax]',
                'G0 X[xmax] Y[ymin]',
                'G0 X[xmin] Y[ymin]',
                'G0 X[X0] Y[Y0]',
                `G21 G91 G0 Z-${zTravel}`,
                '[MM]',
            ];
        }
    };

    function convertPointsToGCode(points, isLaser = false) {
        const gCode = [];
        const movementModal = isLaser ? 'G1' : 'G0'; // G1 is necessary for laser outline since G0 won't enable it
        gCode.push('%X0=posx,Y0=posy,Z0=posz');
        gCode.push('%MM=modal.distance');
        gCode.push(`G21 G91 G0 Z${zTravel}`);
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
        gCode.push(`G21 G91 G0 Z-${zTravel}`);

        gCode.push('[MM]');
        return gCode;
    }
    let outlineGcode;
    if (mode === 'Square') {
        outlineGcode = getSimpleOutline();
    } else {
        outlineGcode = getOutlineGcode();
    }
    //const outlineGcode = getOutlineGcode();
    postMessage({ outlineGcode });
};
