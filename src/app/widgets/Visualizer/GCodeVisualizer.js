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

// import colornames from 'colornames';
import Toolpath from 'gcode-toolpath';
import * as THREE from 'three';
import log from 'app/lib/log';

// const defaultColor = new THREE.Color(colornames('lightgrey'));
// const motionColor = {
//     'G0': new THREE.Color(colornames('green')),
//     'G1': new THREE.Color(colornames('blue')),
//     'G2': new THREE.Color(colornames('deepskyblue')),
//     'G3': new THREE.Color(colornames('deepskyblue'))
// };

class GCodeVisualizer {
    constructor(theme) {
        this.group = new THREE.Object3D();
        this.geometry = new THREE.BufferGeometry();
        this.theme = theme;
        this.vertices = [];
        this.colors = [];

        // Example
        // [
        //   {
        //     code: 'G1 X1',
        //     vertexIndex: 2
        //   }
        // ]
        this.frames = []; // Example
        this.frameIndex = 0;

        return this;
    }

    render(gcode) {
        const { cuttingCoordinateLines, G0Color, G1Color, G2Color, G3Color } = this.theme;

        const defaultColor = new THREE.Color(cuttingCoordinateLines);

        const motionColor = {
            'G0': new THREE.Color(G0Color),
            'G1': new THREE.Color(G1Color),
            'G2': new THREE.Color(G2Color),
            'G3': new THREE.Color(G3Color)
        };

        const toolpath = new Toolpath({
            // @param {object} modal The modal object.
            // @param {object} v1 A 3D vector of the start point.
            // @param {object} v2 A 3D vector of the end point.
            addLine: (modal, v1, v2) => {
                const { motion } = modal;
                const color = motionColor[motion] || defaultColor;
                this.colors.push(color);
                this.vertices.push(new THREE.Vector3(v2.x, v2.y, v2.z));
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
                const color = motionColor[motion] || defaultColor;

                for (let i = 0; i < points.length; ++i) {
                    const point = points[i];
                    const z = ((v2.z - v1.z) / points.length) * i + v1.z;

                    if (plane === 'G17') { // XY-plane
                        this.vertices.push(new THREE.Vector3(point.x, point.y, z));
                    } else if (plane === 'G18') { // ZX-plane
                        this.vertices.push(new THREE.Vector3(point.y, z, point.x));
                    } else if (plane === 'G19') { // YZ-plane
                        this.vertices.push(new THREE.Vector3(z, point.x, point.y));
                    }
                    this.colors.push(color);
                }
            }
        });

        while (this.group.children.length > 0) {
            const child = this.group.children[0];
            this.group.remove(child);
            child.geometry.dispose();
        }

        toolpath.loadFromStringSync(gcode, (line, index) => {
            this.frames.push({
                data: line,
                vertexIndex: this.vertices.length // remember current vertex index
            });
        });

        const workpiece = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(this.vertices),
            new THREE.LineBasicMaterial({
                color: defaultColor,
                linewidth: 10,
                vertexColors: THREE.VertexColors,
                opacity: 0.5,
                transparent: true
            })
        );
        //workpiece.geometry.vertices = this.geometry.vertices.slice();
        //workpiece.geometry.colors = this.geometry.colors.slice();

        this.group.add(workpiece);

        log.debug({
            workpiece: workpiece,
            frames: this.frames,
            frameIndex: this.frameIndex
        });

        return this.group;
    }

    setFrameIndex(frameIndex) {
        if (this.frames.length === 0) {
            return;
        }

        const { cuttingCoordinateLines } = this.theme;

        const defaultColor = new THREE.Color(cuttingCoordinateLines);

        frameIndex = Math.min(frameIndex, this.frames.length - 1);
        frameIndex = Math.max(frameIndex, 0);

        const v1 = this.frames[this.frameIndex].vertexIndex;
        const v2 = this.frames[frameIndex].vertexIndex;

        // Completed path is grayed out
        if (v1 < v2) {
            const workpiece = this.group.children[0];
            for (let i = v1; i < v2; ++i) {
                workpiece.geometry.colors[i] = defaultColor;
            }
            workpiece.geometry.colorsNeedUpdate = true;
        }

        // Restore the path to its original colors
        if (v2 < v1) {
            const workpiece = this.group.children[0];
            for (let i = v2; i < v1; ++i) {
                workpiece.geometry.colors[i] = this.geometry.colors[i];
            }
            workpiece.geometry.colorsNeedUpdate = true;
        }

        this.frameIndex = frameIndex;
    }

    unload() {
        this.geometry.dispose();
        this.group.clear();

        this.group = new THREE.Object3D();
        this.geometry = new THREE.Geometry();

        this.frames = [];
        this.frameIndex = 0;
    }
}

export default GCodeVisualizer;
