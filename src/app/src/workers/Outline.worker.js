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

import concaveman from 'concaveman';

self.onmessage = ({ data }) => {
    const { isLaser = false, parsedData = [], mode, bbox, zTravel } = data;

    const getOutlineGcode = (concavity = Infinity) => {
        // 1. Extract 2D [x, y] points (parsedData is flat: x0,y0,z0,x1,y1,z1,...)
        const points2D = [];
        for (let i = 0; i < parsedData.length; i += 3) {
            points2D.push([
                parseFloat(parsedData[i].toFixed(3)),
                parseFloat(parsedData[i + 1].toFixed(3)),
            ]);
        }

        // 2. Deduplicate on 0.5mm grid for efficiency on large files
        const seen = new Set();
        const deduped = [];
        for (const [x, y] of points2D) {
            const key = `${Math.round(x * 2)},${Math.round(y * 2)}`;
            if (!seen.has(key)) {
                seen.add(key);
                deduped.push([x, y]);
            }
        }

        // 3. Compute concave hull; remove duplicate closing point
        let hull = concaveman(deduped, concavity).slice(0, -1);

        // 4. Ensure clockwise winding (negative signed area in standard XY)
        // Shoelace cross-product variant: sum of (x2-x1)*(y2+y1)
        const area = hull.reduce((sum, pt, i) => {
            const next = hull[(i + 1) % hull.length];
            return sum + (next[0] - pt[0]) * (next[1] + pt[1]);
        }, 0);
        if (area > 0) {
            hull.reverse();
        }

        // 5. Rotate hull to start at vertex nearest to (0, 0)
        let startIdx = 0;
        let minDist = Infinity;
        hull.forEach(([x, y], i) => {
            const d = x * x + y * y;
            if (d < minDist) {
                minDist = d;
                startIdx = i;
            }
        });
        const orderedHull = [...hull.slice(startIdx), ...hull.slice(0, startIdx)];

        return convertPointsToGCode(orderedHull, isLaser);
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
