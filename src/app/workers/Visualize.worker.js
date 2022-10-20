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

onmessage = function({ data }) {
    const { content, visualizer } = data;
    const vertices = [];
    const colors = [];
    const frames = [];

    const vm = new GCodeVirtualizer();
    // handlers for vectors
    vm.on('addLine', () => {});

    vm.on('addCurve', () => {});

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

    postMessage({
        vertices: tVertices,
        colors,
        frames: tFrames,
        visualizer
    });
};
