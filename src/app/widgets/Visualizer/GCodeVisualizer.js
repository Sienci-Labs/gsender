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

class GCodeVisualizer {
    constructor(theme) {
        this.group = new THREE.Object3D();
        this.geometry = new THREE.BufferGeometry();
        this.theme = theme;
        this.vertices = [];
        this.colors = [];
        this.spindleSpeeds = null;
        this.spindleChanges = null;
        this.isLaser = false;
        this.frames = []; // Example
        this.frameIndex = 0;

        return this;
    }

    updateLaserModeColors() {
        const { /*G1Color, */backgroundColor } = this.theme;
        const defaultColor = new THREE.Color(255, 0, 0);
        const fillColor = new THREE.Color(backgroundColor);
        const maxSpindleValue = Math.max(...[...this.spindleSpeeds]);

        const calculateOpacity = (speed) => ((maxSpindleValue === 0) ? 1 : (speed / maxSpindleValue));

        for (let i = 0; i < this.frames.length; i++) {
            const { spindleOn, spindleSpeed } = this.spindleChanges[i];
            const offsetIndex = (this.frames[i] * 4);
            if (spindleOn) {
                let opacity = calculateOpacity(spindleSpeed);
                const color = [...defaultColor.toArray(), opacity];
                this.colors.splice(offsetIndex, 8, ...color, ...color);
            } else {
                const color = [...fillColor.toArray(), 0.05];
                this.colors.splice(offsetIndex, 8, ...color, ...color);
            }
        }
    }

    render({ vertices, colors, frames, spindleSpeeds, isLaser = false, spindleChanges }) {
        const { cuttingCoordinateLines, G0Color, G1Color } = this.theme;
        this.vertices = new THREE.Float32BufferAttribute(vertices, 3);
        this.frames = frames;
        this.spindleSpeeds = spindleSpeeds;
        this.isLaser = isLaser;
        this.spindleChanges = spindleChanges;
        const defaultColor = new THREE.Color(cuttingCoordinateLines);

        // Get line colors for current theme
        const motionColor = {
            'G0': new THREE.Color(G0Color),
            'G1': new THREE.Color(G1Color),
            'G2': new THREE.Color(G1Color),
            'G3': new THREE.Color(G1Color),
            'default': defaultColor
        };

        //this.geometry.setFromPoints(this.vertices);
        const colorArray = this.getColorTypedArray(colors, motionColor);
        this.geometry.setAttribute('position', this.vertices);
        this.geometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 4));

        const workpiece = new THREE.Line(
            this.geometry,
            new THREE.LineBasicMaterial({
                color: defaultColor,
                vertexColors: true,
                transparent: true,
                opacity: 0.9,
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
        console.log(colors);
        const colorArray = [];
        colors.forEach(colorTag => {
            const [motion, opacity] = colorTag;
            const color = motionColor[motion] || motionColor.default;
            colorArray.push(...color.toArray(), opacity);
        });
        this.colors = colorArray;

        if (this.isLaser && this.spindleSpeeds.size > 0) {
            this.updateLaserModeColors();
        }

        return new Float32Array(colorArray);
    }


    setFrameIndex(frameIndex) {
        if (this.frames.length === 0) {
            return;
        }
        const { cuttingCoordinateLine } = this.theme;
        const defaultColor = new THREE.Color(cuttingCoordinateLine);

        frameIndex = Math.min(frameIndex, this.frames.length - 1);
        frameIndex = Math.max(frameIndex, 0);

        const v1 = this.frames[this.frameIndex];
        const v2 = this.frames[frameIndex];

        if (v1 < v2) {
            const workpiece = this.group.children[0];
            const offsetIndex = v1 * 4;
            const colorAttr = workpiece.geometry.getAttribute('color');
            const defaultColorArray = [...defaultColor.toArray(), 0.3];
            const colorArray = Array.from({ length: (v2 - v1) }, () => defaultColorArray).flat();

            colorAttr.set([...colorArray], offsetIndex);
            // only update the range we've updated;
            colorAttr.updateRange.count = colorArray.length;
            colorAttr.updateRange.offset = offsetIndex;
            colorAttr.needsUpdate = true;
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

    getCurrentLocation() {
        return this.vertices[this.frames[this.frameIndex].vertexIndex] ? this.vertices[this.frames[this.frameIndex].vertexIndex] : this.vertices[this.frames[this.frameIndex].vertexIndex - 1];
    }

    unload() {
        this.geometry.dispose();
        this.group.clear();

        this.group = new THREE.Object3D();
        this.geometry = new THREE.BufferGeometry();
        this.vertices = null;
        this.colors = null;
        this.frames = null;
        this.frameIndex = 0;
        this.framesLength = 0;
    }
}

export default GCodeVisualizer;
