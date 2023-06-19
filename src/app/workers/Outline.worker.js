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

import ch from 'hull.js';
import * as THREE from 'three';

import Toolpath, { rotateAxis, shouldRotate } from '../lib/GcodeToolpath';

onmessage = ({ data }) => {
    const { gcode, isLaser = false } = data;
    // Generate an ordered pair - we don't care about Z index for outline purposes so it's removed
    function vertex(x, y) {
        return [x.toFixed(2), y.toFixed(2)];
    }

    const getOutlineGcode = (gcode, concavity = 60) => {
        const vertices = [];
        const toolpath = new Toolpath({
            addLine: ({ motion }, v1, v2) => {
                if (motion === 'G1' || motion === 'G0') {
                    if (shouldRotate(v1.a) || shouldRotate(v2.a)) {
                        const newV1 = rotateAxis('y', v1);
                        v1.y = newV1.y;
                        v1.z = newV1.z;

                        const newV2 = rotateAxis('y', v2);
                        v2.y = newV2.y;
                        v2.z = newV2.z;
                    }

                    vertices.push(vertex(v2.x, v2.y));
                }
            },
            addArcCurve: ({ motion, plane }, v1, v2, v0) => {
                const isClockwise = motion === 'G2';
                const radius = Math.sqrt(
                    (v1.x - v0.x) ** 2 + (v1.y - v0.y) ** 2
                );
                let startAngle = Math.atan2(v1.y - v0.y, v1.x - v0.x);
                let endAngle = Math.atan2(v2.y - v0.y, v2.x - v0.x);

                // Draw full circle if startAngle and endAngle are both zero
                if (startAngle === endAngle) {
                    endAngle += 2 * Math.PI;
                }

                const arcCurve = new THREE.ArcCurve(
                    v0.x, // aX
                    v0.y, // aY
                    radius, // aRadius
                    startAngle, // aStartAngle
                    endAngle, // aEndAngle
                    isClockwise // isClockwise
                );
                const divisions = 30;
                const points = arcCurve.getPoints(divisions);
                vertices.push(vertex(v1.x, v1.y));

                for (let i = 0; i < points.length; ++i) {
                    const point = points[i];
                    const z = ((v2.z - v1.z) / points.length) * i + v1.z;

                    if (plane === 'G17') {
                        // XY-plane
                        vertices.push(vertex(point.x, point.y));
                    } else if (plane === 'G18') {
                        // ZX-plane
                        vertices.push(vertex(point.y, z));
                    } else if (plane === 'G19') {
                        // YZ-plane
                        vertices.push(vertex(z, point.x));
                    }
                }
            },
        });
        toolpath.loadFromStringSync(gcode);
        const fileHull = ch(vertices, concavity);

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

    const outlineGcode = getOutlineGcode(gcode);
    postMessage({ outlineGcode });
};
