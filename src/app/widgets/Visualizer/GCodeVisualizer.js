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

    render({ vertices, colors, frames }) {
        const { cuttingCoordinateLines, G0Color, G1Color, G2Color, G3Color } = this.theme;
        this.vertices = vertices;
        this.frames = frames;
        const defaultColor = new THREE.Color(cuttingCoordinateLines);

        // Get line colors for current theme
        const motionColor = {
            'G0': new THREE.Color(G0Color),
            'G1': new THREE.Color(G1Color),
            'G2': new THREE.Color(G2Color),
            'G3': new THREE.Color(G3Color),
            'default': defaultColor
        };

        this.geometry.setFromPoints(this.vertices);
        this.colors = this.getColorTypedArray(colors, motionColor);
        this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 4));

        const workpiece = new THREE.Line(
            this.geometry,
            new THREE.PointsMaterial({
                color: defaultColor,
                vertexColors: true,
                transparent: true,
                opacity: 0.6,
            })
        );

        this.group.add(workpiece);

        log.debug({
            workpiece: workpiece,
            frames: this.frames,
            frameIndex: this.frameIndex
        });

        return this.group;
    }

    /* Turns our array of Three colors into a float typed array we can set as a bufferAttribute */
    getColorTypedArray(colors, motionColor) {
        const colorArray = [];
        colors.forEach(colorTag => {
            const [motion, opacity] = colorTag;
            const color = motionColor[motion] || motionColor.default;
            colorArray.push(...color.toArray(), opacity);
        });
        return new Float32Array(colorArray);
    }


    setFrameIndex(frameIndex) {
        if (this.frames.length === 0) {
            return;
        }

        //const { cuttingCoordinateLines } = this.theme;

        const defaultColor = new THREE.Color('#5191CC');

        frameIndex = Math.min(frameIndex, this.frames.length - 1);
        frameIndex = Math.max(frameIndex, 0);

        const v1 = this.frames[this.frameIndex].vertexIndex;
        const v2 = this.frames[frameIndex].vertexIndex;

        // Completed path is grayed out
        if (v1 < v2) {
            const workpiece = this.group.children[0];
            for (let i = v1; i < v2; ++i) {
                const offsetIndex = i * 4; // Account for RGB buffer
                workpiece.geometry.attributes.color.set([...defaultColor.toArray(), 0.3], offsetIndex);
            }
            workpiece.geometry.attributes.color.needsUpdate = true;
        }

        // Restore the path to its original colors
        if (v2 < v1) {
            const workpiece = this.group.children[0];
            for (let i = v2; i < v1; ++i) {
                const offsetIndex = i * 4; // Account for RGB buffer
                workpiece.geometry.attributes.color.set([...this.colors.slice(offsetIndex, offsetIndex + 4)], offsetIndex);
            }
            workpiece.geometry.attributes.color.needsUpdate = true;
        }

        this.frameIndex = frameIndex;
    }

    unload() {
        this.geometry.dispose();
        this.group.clear();

        this.group = new THREE.Object3D();
        this.geometry = new THREE.BufferGeometry();
        this.vertices = [];
        this.colors = [];

        this.frames = [];
        this.frameIndex = 0;
    }
}

export default GCodeVisualizer;
