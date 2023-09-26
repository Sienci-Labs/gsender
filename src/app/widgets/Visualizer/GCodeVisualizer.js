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
import { BACKGROUND_PART, CUTTING_PART, G0_PART, G1_PART, G2_PART, G3_PART, LASER_PART } from './constants';

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
        this.frameDifferences = Array(20).fill(-1); // stores up to 20 frame distances
        this.oldV1s = Array(20).fill(-1); // stores up to 20 frames
        this.countdown = 20;

        return this;
    }

    updateLaserModeColors() {
        const defaultColor = new THREE.Color(this.theme.get(LASER_PART));
        const fillColor = new THREE.Color(this.theme.get(BACKGROUND_PART));
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
        this.vertices = new THREE.Float32BufferAttribute(vertices, 3);
        this.frames = frames;
        this.spindleSpeeds = spindleSpeeds;
        this.isLaser = isLaser;
        this.spindleChanges = spindleChanges;
        const defaultColor = new THREE.Color(this.theme.get(CUTTING_PART));
        this.countdown = 20;
        this.frameDifferences = Array(20).fill(-1);
        this.oldV1s = Array(20).fill(-1);

        // Get line colors for current theme
        const motionColor = {
            'G0': new THREE.Color(this.theme.get(G0_PART)),
            'G1': new THREE.Color(this.theme.get(G1_PART)),
            'G2': new THREE.Color(this.theme.get(G2_PART)),
            'G3': new THREE.Color(this.theme.get(G3_PART)),
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
        const defaultColor = new THREE.Color(this.theme.get(CUTTING_PART));

        frameIndex = Math.min(frameIndex, this.frames.length - 1);
        frameIndex = Math.max(frameIndex, 0);

        const v1 = this.frames[this.frameIndex];
        const v2 = this.frames[frameIndex]; // recieved lines

        if (v1 < v2) {
            // subtract countdown and advance the queue
            this.countdown -= 1;
            this.frameDifferences.shift();
            this.frameDifferences.push(v2 - v1);
            this.oldV1s.shift();
            this.oldV1s.push(v1);

            const workpiece = this.group.children[0];
            const offsetIndex = this.oldV1s[0] * 4; // use the oldest v1, as that's where we are updating from
            const bufferOffsetIndex = v1 * 4;
            const colorAttr = workpiece.geometry.getAttribute('color');

            const defaultColorArray = [...defaultColor.toArray(), 0.3]; // grey
            const defaultBufferColorArray = [...(new THREE.Color('#DFF204')).toArray(), 1]; // yellow
            const placeHolderColorArray = [...(new THREE.Color('#DFF204')).toArray(), 1]; // yellow

            // add the distance between the current movement and 19 moves ago
            let placeHolderLength = 0;
            this.frameDifferences.forEach((num, i) => {
                // if first or last, skip
                // these are already covered by colorArray and bufferColorArray
                if (i === 0 || i === this.frameDifferences.length - 1) {
                    return;
                }
                placeHolderLength += num;
            });

            const colorArray = Array.from({ length: (this.frameDifferences[0]) }, () => defaultColorArray).flat(); // grey, 19 movements ago
            const bufferColorArray = Array.from({ length: (v2 - v1) }, () => defaultBufferColorArray).flat(); // current movement
            const placeHolderArray = Array.from({ length: (placeHolderLength) }, () => placeHolderColorArray).flat(); // all movements in between

            if (this.isLaser) {
                // add original color on top so you can see the parts the laser has finished
                for (let i = 0; i < colorArray.length; i++) {
                    colorArray[i] += colorAttr.array[offsetIndex + i];
                }
            }

            // only update the range we've updated
            if (this.countdown <= 0) {
                colorAttr.set([...colorArray, ...placeHolderArray, ...bufferColorArray], offsetIndex);
                colorAttr.updateRange.count = colorArray.length + placeHolderArray.length + bufferColorArray.length;
                colorAttr.updateRange.offset = offsetIndex;
            } else {
                colorAttr.set([...bufferColorArray], bufferOffsetIndex);
                colorAttr.updateRange.count = bufferColorArray.length;
                colorAttr.updateRange.offset = bufferOffsetIndex;
            }
            colorAttr.needsUpdate = true;
        }

        // Restore the path to its original colors
        if (v2 < v1) {
            // reset vars
            this.frameDifferences = Array(20).fill(-1);
            this.oldV1s = Array(20).fill(-1);
            this.countdown = 20;

            // reset colours
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
        const offset = this.frames[this.frameIndex] * 3; // Reconvert back to offset
        return {
            x: this.vertices.array[offset],
            y: this.vertices.array[offset + 1],
            z: this.vertices.array[offset + 2]
        };
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
        this.frameDifferences = Array(20).fill(-1);
        this.oldV1s = Array(20).fill(-1);
        this.countdown = 20;
    }
}

export default GCodeVisualizer;
