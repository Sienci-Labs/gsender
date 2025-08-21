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
import _get from 'lodash/get';
import { store as reduxStore } from 'app/store/redux';
import { CUTTING_PART, PLANNED_PART, SECONDARY_COLOR } from './constants';
import { checkIfRotaryFile } from '../../lib/rotary';

const STATES = {
    START: 0,
    RUNNING: 1,
    DONE: 2,
};

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
        this.oldFrameIndex = null;
        this.plannedColorArray = [];
        this.plannedV1 = null;
        this.plannedState = STATES.START;
        // --rotary
        this.frameDifferences = Array(16).fill(null); // queue, stores up to 16 frame differences (v2 - v1)
        this.oldV1s = Array(16).fill(null); // queue, stores up to 16 frames (v1)
        this.countdown = 16; // counter
        this.isRotaryFile = false;
        // rotary--

        return this;
    }

    render(
        { vertices, frames, spindleSpeeds, isLaser = false, spindleChanges },
        colorArray,
        savedColors,
    ) {
        this.vertices = new THREE.Float32BufferAttribute(vertices, 3);
        this.frames = frames;
        this.spindleSpeeds = spindleSpeeds;
        this.isLaser = isLaser;
        this.spindleChanges = spindleChanges;
        this.colors = savedColors;
        const defaultColor = new THREE.Color(this.theme.get(CUTTING_PART));
        // --rotary
        this.countdown = 16;
        this.frameDifferences = Array(16).fill(null);
        this.oldV1s = Array(16).fill(null);
        // rotary--

        // check if file is rotary
        const gcode = _get(reduxStore.getState(), 'file.content', '');
        this.isRotaryFile = checkIfRotaryFile(gcode);

        this.geometry.setAttribute('position', this.vertices);
        this.geometry.setAttribute(
            'color',
            new THREE.BufferAttribute(colorArray, 4),
        );

        const workpiece = new THREE.Line(
            this.geometry,
            new THREE.LineBasicMaterial({
                color: defaultColor,
                vertexColors: true,
                transparent: true,
                opacity: 0.9,
            }),
        );
        workpiece.name = 'workpiece';
        this.group.add(workpiece);

        return this.group;
    }

    setFrameIndex(frameIndex) {
        if (this.frames.length === 0) {
            return;
        }
        const plannedColor = new THREE.Color(this.theme.get(PLANNED_PART));
        const defaultColorArray = [...plannedColor.toArray(), 1]; // yellow

        frameIndex = Math.min(frameIndex, this.frames.length - 1);
        frameIndex = Math.max(frameIndex, 0);

        const v1 = this.frames[this.frameIndex];
        const v2 = this.frames[frameIndex]; // recieved lines

        if (v1 < v2) {
            // this is just a temporary fix for rotary, so there is some repeated code in both the if and else,
            // but it makes it easy to take away and edit later if i organize it like this
            if (this.isRotaryFile) {
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
                const defaultColor = new THREE.Color(
                    this.theme.get(CUTTING_PART),
                );
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

                const colorArray = Array.from(
                    { length: this.frameDifferences[0] },
                    () => defaultColorArray,
                ).flat(); // grey, 16 movements ago
                const bufferColorArray = Array.from(
                    { length: v2 - v1 },
                    () => defaultBufferColorArray,
                ).flat(); // current movement
                const placeHolderArray = Array.from(
                    { length: placeHolderLength },
                    () => placeHolderColorArray,
                ).flat(); // all movements in between

                // if finished counting down, start greying out the old movements
                if (this.countdown <= 0) {
                    colorAttr.set(
                        [
                            ...colorArray,
                            ...placeHolderArray,
                            ...bufferColorArray,
                        ],
                        offsetIndex,
                    );
                    colorAttr.updateRange.count =
                        colorArray.length +
                        placeHolderArray.length +
                        bufferColorArray.length;
                    colorAttr.updateRange.offset = offsetIndex;
                } else {
                    // if not finished, continue colouring yellow
                    colorAttr.set([...bufferColorArray], bufferOffsetIndex);
                    colorAttr.updateRange.count = bufferColorArray.length;
                    colorAttr.updateRange.offset = bufferOffsetIndex;
                }
                colorAttr.needsUpdate = true;
            } else {
                // if v1 is 0, we don't want to add the planned colour array because it will be too long and
                // cause the yellow colouring to be past what we are tracking
                if (v1 > 0) {
                    const colorArray = Array.from(
                        { length: v2 - v1 },
                        () => defaultColorArray,
                    ).flat(); // current movement
                    // cant set yet, because grey lines will also be calculated soon
                    this.plannedColorArray = colorArray;
                    this.plannedV1 = this.frames[this.frameIndex - 1];
                }
            }
        }

        // Restore the path to its original colors
        if (v2 < v1) {
            // reset vars
            this.oldFrameIndex = null;
            this.plannedColorArray = [];
            this.plannedV1 = null;
            this.plannedState = STATES.START;
            // --rotary
            this.frameDifferences = Array(16).fill(-1);
            this.oldV1s = Array(16).fill(-1);
            this.countdown = 16;
            // rotary--

            // reset colours
            const workpiece = this.group.children[0];
            for (let i = v2; i < v1; ++i) {
                const offsetIndex = i * 4; // Account for RGB buffer
                workpiece.geometry.attributes.color.set(
                    [...this.colors.slice(offsetIndex, offsetIndex + 4)],
                    offsetIndex,
                );
            }
            workpiece.geometry.attributes.color.needsUpdate = true;
        }

        this.frameIndex = frameIndex;
    }

    greyOutLines(currentLineRunning) {
        currentLineRunning = Math.min(
            currentLineRunning,
            this.frames.length - 1,
        );
        currentLineRunning = Math.max(currentLineRunning, 0);
        const v1FrameIndex =
            currentLineRunning - 2 >= 0 ? currentLineRunning - 2 : 0;
        const v2FrameIndex =
            currentLineRunning - 2 >= 0 ? currentLineRunning - 1 : 0;
        // fill from the last frame index to the current one - 2
        // if start from line (this.plannedv1 - 0), start at 0
        const v1 =
            this.frames[
                this.plannedV1 === undefined
                    ? 0
                    : this.oldFrameIndex || v1FrameIndex
            ];
        const v2 = this.frames[v2FrameIndex];

        if (v1 < v2 && !this.isRotaryFile) {
            const workpiece = this.group.children[0];
            const colorAttr = workpiece.geometry.getAttribute('color');
            const offsetIndex = v1 * 4;
            const opacity = this.isLaser ? 1 : 0.3;
            // grey
            const runColor = new THREE.Color(SECONDARY_COLOR);
            const greyArray = [...runColor.toArray(), opacity];
            // yellow
            const yellowColor = new THREE.Color(this.theme.get(PLANNED_PART));
            const yellowArray = [...yellowColor.toArray(), 1];
            // color arrays
            const runColorArray = Array.from(
                { length: v2 - v1 },
                () => greyArray,
            ).flat(); // grey, a couple movements before where our bit currently is
            const bufferColorArray = Array.from(
                { length: this.plannedV1 - this.frames[v2FrameIndex + 1] },
                () => yellowArray,
            ).flat(); // yellow, everything in between run lines and last planned line

            let isOverflowing = false;
            let lengthLeft = null;
            if (this.plannedColorArray) {
                // calculate length we have left to fill
                lengthLeft = this.frames[this.frames.length - 1] - v1;
                // calculate whether the grey + yellow will overflow the buffer
                isOverflowing =
                    runColorArray.length / 4 +
                        bufferColorArray.length / 4 +
                        this.plannedColorArray.length / 4 >
                    lengthLeft;
            }

            // if we have reached the end, fill in the rest of the yellow
            // we know its at the end if the amount to update overflows the buffer, or if the frameIndex is at the last frame
            if (
                this.plannedState !== STATES.DONE &&
                (isOverflowing || this.frameIndex === this.frames.length - 1)
            ) {
                const newBufferColorArray = Array.from(
                    {
                        length:
                            this.frames[this.frames.length - 1] -
                            this.frames[v1FrameIndex + 1],
                    },
                    () => yellowArray,
                ).flat();
                colorAttr.set(
                    [...runColorArray, ...newBufferColorArray],
                    offsetIndex,
                );
                colorAttr.updateRange.count =
                    runColorArray.length + newBufferColorArray.length;
                this.plannedState = STATES.DONE;
                // beginning lines, for regular start or start from line
            } else if (this.plannedState === STATES.START) {
                // this.frameIndex starts at 0, so the yellow line we just made includes every line before the current starting line.
                // redo yellow with the starting index being the end of the grey
                const plannedColor = new THREE.Color(
                    this.theme.get(PLANNED_PART),
                );

                const defaultColorArray = [...plannedColor.toArray(), 1]; // yellow

                const colorArray = Array.from(
                    { length: this.frameIndex - v2FrameIndex + 1 },
                    () => defaultColorArray,
                ).flat();

                colorAttr.set([...runColorArray, ...colorArray], offsetIndex);
                colorAttr.updateRange.count =
                    runColorArray.length + colorArray.length;
                this.plannedState = STATES.RUNNING;
                // if the end has alrdy been reached, only update grey
            } else if (this.plannedState === STATES.DONE) {
                colorAttr.set(runColorArray, offsetIndex);
                colorAttr.updateRange.count = runColorArray.length;
                // end not reached, update everything
            } else {
                // set grey lines, planned lines that were previously calculated, and the buffer in between
                colorAttr.set(
                    [
                        ...runColorArray,
                        ...bufferColorArray,
                        ...this.plannedColorArray,
                    ],
                    offsetIndex,
                );
                colorAttr.updateRange.count =
                    runColorArray.length +
                    bufferColorArray.length +
                    this.plannedColorArray.length;
            }
            colorAttr.updateRange.offset = offsetIndex;
            colorAttr.needsUpdate = true;
        }

        // set last frame index
        this.oldFrameIndex = v2FrameIndex;
    }

    getCurrentLocation() {
        const offset = this.frames[this.frameIndex] * 3; // Reconvert back to offset
        return {
            x: this.vertices.array[offset],
            y: this.vertices.array[offset + 1],
            z: this.vertices.array[offset + 2],
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
        this.oldFrameIndex = null;
        this.plannedColorArray = [];
        this.plannedV1 = null;
        this.plannedState = STATES.START;
        // --rotary
        this.frameDifferences = Array(16).fill(null);
        this.oldV1s = Array(16).fill(null);
        this.countdown = 16;
        // rotary--
    }

    getHull() {
        const vertices = this.geometry.getAttribute('position');
        return vertices.array;
    }
}

export default GCodeVisualizer;
