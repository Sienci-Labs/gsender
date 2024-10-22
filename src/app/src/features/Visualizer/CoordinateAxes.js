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

import * as THREE from 'three';

const buildAxis = (src, dst, color, dashed) => {
    let material;
    const points = [src.clone(), dst.clone()];

    if (dashed) {
        material = new THREE.LineDashedMaterial({
            linewidth: 1,
            color: color,
            dashSize: 1,
            gapSize: 1,
            opacity: 0.8,
            transparent: true,
        });
    } else {
        material = new THREE.LineBasicMaterial({
            linewidth: 1,
            color: color,
            opacity: 0.8,
            transparent: true,
        });
    }
    let geometry = new THREE.BufferGeometry().setFromPoints(points);

    const axisLine = new THREE.Line(geometry, material);

    if (dashed) {
        // Computes an array of distance values which are necessary for LineDashedMaterial.
        axisLine.computeLineDistances();
    }

    return axisLine;
};

// CoordinateAxes
// An axis object to visualize the the 3 axes in a simple way.
// The X axis is red. The Y axis is green. The Z axis is blue.
class CoordinateAxes {
    group = new THREE.Object3D();

    // Creates an axisHelper with lines of length size.
    // @param {number} size Define the size of the line representing the axes.
    // @see [Drawing the Coordinate JogControl]{@http://soledadpenades.com/articles/three-js-tutorials/drawing-the-coordinate-axes/}
    constructor(size, height) {
        const red = '#df3b3b';
        const green = '#06b881';
        const blue = '#5191cc';

        this.group.add(
            buildAxis(
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(size, 0, 0),
                red,
                true,
            ), // +X
            buildAxis(
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(-size, 0, 0),
                red,
                true,
            ), // -X
            buildAxis(
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0, size, 0),
                green,
                true,
            ), // +Y
            buildAxis(
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0, -size, 0),
                green,
                true,
            ), // -Y
            buildAxis(
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0, 0, height),
                blue,
                true,
            ), // +Z
            buildAxis(
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0, 0, -height),
                blue,
                true,
            ), // -Z
        );

        return this.group;
    }
}

export default CoordinateAxes;
