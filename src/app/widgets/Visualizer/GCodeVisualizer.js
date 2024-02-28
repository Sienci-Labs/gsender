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
import { CUTTING_PART, PLANNED_PART } from './constants';

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
        this.frameDifferences = Array(16).fill(null); // queue, stores up to 16 frame differences (v2 - v1)
        this.oldV1s = Array(16).fill(null); // queue, stores up to 16 frames (v1)
        this.countdown = 16; // counter

        return this;
    }

    render({ vertices, frames, spindleSpeeds, isLaser = false, spindleChanges }, colorArray) {
        this.vertices = new THREE.Float32BufferAttribute(vertices, 3);
        this.frames = frames;
        this.spindleSpeeds = spindleSpeeds;
        this.isLaser = isLaser;
        this.spindleChanges = spindleChanges;
        this.colors = colorArray;
        const defaultColor = new THREE.Color(this.theme.get(CUTTING_PART));
        this.countdown = 16;
        this.frameDifferences = Array(16).fill(null);
        this.oldV1s = Array(16).fill(null);

        this.geometry.setAttribute('position', this.vertices);
        this.geometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 4));

        //this.geometry.computeBoundingBox();
        //console.log(this.geometry.boundingBox);

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

    setFrameIndex(frameIndex) {
        if (this.frames.length === 0) {
            return;
        }
        const defaultColor = new THREE.Color(this.theme.get(CUTTING_PART));
        const plannedColor = new THREE.Color(this.theme.get(PLANNED_PART));

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

            const opacity = this.isLaser ? 1 : 0.3;
            const defaultColorArray = [...defaultColor.toArray(), opacity]; // grey
            const defaultBufferColorArray = [...plannedColor.toArray(), 1]; // yellow
            const placeHolderColorArray = [...plannedColor.toArray(), 1]; // yellow

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

            const colorArray = Array.from({ length: (this.frameDifferences[0]) }, () => defaultColorArray).flat(); // grey, 16 movements ago
            const bufferColorArray = Array.from({ length: (v2 - v1) }, () => defaultBufferColorArray).flat(); // current movement
            const placeHolderArray = Array.from({ length: (placeHolderLength) }, () => placeHolderColorArray).flat(); // all movements in between

            // if finished counting down, start greying out the old movements
            if (this.countdown <= 0) {
                colorAttr.set([...colorArray, ...placeHolderArray, ...bufferColorArray], offsetIndex);
                colorAttr.updateRange.count = colorArray.length + placeHolderArray.length + bufferColorArray.length;
                colorAttr.updateRange.offset = offsetIndex;
            } else { // if not finished, continue colouring yellow
                colorAttr.set([...bufferColorArray], bufferOffsetIndex);
                colorAttr.updateRange.count = bufferColorArray.length;
                colorAttr.updateRange.offset = bufferOffsetIndex;
            }
            colorAttr.needsUpdate = true;
        }

        // Restore the path to its original colors
        if (v2 < v1) {
            // reset vars
            this.frameDifferences = Array(16).fill(-1);
            this.oldV1s = Array(16).fill(-1);
            this.countdown = 16;

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
        this.frameDifferences = Array(16).fill(null);
        this.oldV1s = Array(16).fill(null);
        this.countdown = 16;
    }

    getHull() {
        const vertices = this.geometry.getAttribute('position');
        return vertices.array;
    }
}

export default GCodeVisualizer;
