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

import GCodeVirtualizer from 'app/lib/GCodeVirtualizer';
import { ArcCurve } from 'three';

onmessage = function({ data }) {
    const { content, visualizer } = data;
    const vertices = [];
    const colors = [];
    const frames = [];

    const vm = new GCodeVirtualizer({
        addLine: (motion, v1, v2) => {
            const opacity = (motion === 'G0') ? 0.1 : 1;
            const color = [motion, opacity];
            colors.push(color);
            vertices.push(v2.x, v2.y, v2.z);
        },
        addCurve: (motion, plane, v1, v2, v0) => {
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

            const arcCurve = new ArcCurve(
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
                    vertices.push(point.x, point.y, z);
                } else if (plane === 'G18') { // ZX-plane
                    vertices.push(point.y, z, point.x);
                } else if (plane === 'G19') { // YZ-plane
                    vertices.push(z, point.x, point.y);
                }
                colors.push(color);
            }
        },
        callback: () => {
            // Divided by 3 since we store XYZ as separate values
            frames.push(vertices.length / 3);
        }
    });

    const lines = content
        .split(/\r?\n/)
        .filter(element => element)
        .reverse();

    const start = Date.now();
    while (lines.length) {
        let line = lines.pop();
        vm.virtualize(line);
    }
    console.log(`Duration: ${Date.now() - start}`);


    let tFrames = new Uint32Array(frames);
    let tVertices = new Float32Array(vertices);

    console.log(tFrames.length);

    postMessage({
        vertices: tVertices,
        colors,
        frames: tFrames,
        visualizer
    });
};
