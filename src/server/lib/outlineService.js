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

import Toolpath from 'gcode-toolpath';
import isEqual from 'lodash/isEqual';
import * as THREE from 'three';

export function getOutlineGcode(gcode) {
    const vertices = [];
    const toolpath = new Toolpath({
        addLine: (modal, v1, v2) => {
            const { motion } = modal;
            // We ignore G0 movements since they generally aren't cutting movements
            if (motion === 'G1') {
                vertices.push([v2.x, v2.y, v2.z]);
            }
        },
        addArcCurve: (modal, v1, v2, v0) => {
            const { motion, plane } = modal;
            const isClockwise = (motion === 'G2');
            const radius = Math.sqrt(
                ((v1.x - v0.x) ** 2) + ((v1.y - v0.y) ** 2)
            );
            let startAngle = Math.atan2(v1.y - v0.y, v1.x - v0.x);
            let endAngle = Math.atan2(v2.y - v0.y, v2.x - v0.x);

            // Draw full circle if startAngle and endAngle are both zero
            if (startAngle === endAngle) {
                endAngle += (2 * Math.PI);
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

            for (let i = 0; i < points.length; ++i) {
                const point = points[i];
                const z = ((v2.z - v1.z) / points.length) * i + v1.z;

                if (plane === 'G17') { // XY-plane
                    vertices.push([point.x, point.y, z]);
                } else if (plane === 'G18') { // ZX-plane
                    vertices.push([point.y, z, point.x]);
                } else if (plane === 'G19') { // YZ-plane
                    vertices.push([z, point.x, point.y]);
                }
            }
        }
    });

    toolpath.loadFromStringSync(gcode);

    const fileHull = generateConvexHull(vertices);

    const gCode = convertPointsToGCode(fileHull);
    return gCode;
}

function generateConvexHull(points) {
    if (points.length < 3) {
        return [];
    }
    const result = [];
    const leftMostPoint = getLeftmostPoint(points);
    let currentPoint = leftMostPoint;
    do {
        result.push(currentPoint);
        currentPoint = getNextOuterPoint(points, currentPoint);
    } while (!isEqual(currentPoint, leftMostPoint));
    return result;
}

function getLeftmostPoint(points) {}

function getNextOuterPoint(points, currentPoint) {}

function convertPointsToGCode(points) {
    return [];
}
