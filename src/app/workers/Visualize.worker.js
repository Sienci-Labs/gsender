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
import * as THREE from 'three';

onmessage = function({ data }) {
    const { content, visualizer } = data;
    const vertices = [];
    const colors = [];
    const frames = [];

    const toolpath = new Toolpath({
        // @param {object} modal The modal object.
        // @param {object} v1 A 3D vector of the start point.
        // @param {object} v2 A 3D vector of the end point.
        addLine: (modal, v1, v2) => {
            const { motion } = modal;
            const opacity = (motion === 'G0') ? 0.1 : 1;
            const color = [motion, opacity];
            colors.push(color);
            vertices.push(new THREE.Vector3(v2.x, v2.y, v2.z));
        },
        // @param {object} modal The modal object.
        // @param {object} v1 A 3D vector of the start point.
        // @param {object} v2 A 3D vector of the end point.
        // @param {object} v0 A 3D vector of the fixed point.
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
            const color = [motion, 1];

            for (let i = 0; i < points.length; ++i) {
                const point = points[i];
                const z = ((v2.z - v1.z) / points.length) * i + v1.z;

                if (plane === 'G17') { // XY-plane
                    vertices.push(new THREE.Vector3(point.x, point.y, z));
                } else if (plane === 'G18') { // ZX-plane
                    vertices.push(new THREE.Vector3(point.y, z, point.x));
                } else if (plane === 'G19') { // YZ-plane
                    vertices.push(new THREE.Vector3(z, point.x, point.y));
                }
                colors.push(color);
            }
        }
    });

    toolpath.loadFromStringSync(content, (line, index) => {
        frames.push({
            data: line,
            vertexIndex: vertices.length // remember current vertex index
        });
    });


    postMessage({
        vertices,
        colors,
        frames,
        visualizer
    });
};
