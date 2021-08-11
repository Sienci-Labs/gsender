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

class GridLine {
    group = new THREE.Object3D();

    colorCenterLine = new THREE.Color(0x444444);

    colorGrid = new THREE.Color(0x888888);

    constructor(sizeX, stepX, sizeY, stepY, colorCenterLine, colorGrid) {
        colorGrid = new THREE.Color(colorGrid) || this.colorGrid;

        sizeY = (typeof sizeY === 'undefined') ? sizeX : sizeY;
        stepY = (typeof stepY === 'undefined') ? stepX : stepY;

        for (let i = -1 * sizeX; i <= sizeX; i += stepX) {
            const points = [];
            const material = new THREE.LineBasicMaterial({
                color: colorGrid
            });

            points.push(
                new THREE.Vector3(-sizeX, i, 0),
                new THREE.Vector3(sizeX, i, 0),
            );
            const geometry = new THREE.BufferGeometry().setFromPoints(points);

            this.group.add(new THREE.Line(geometry, material));
        }

        for (let i = -1 * sizeY; i <= sizeY; i += stepY) {
            const points = [];
            const material = new THREE.LineBasicMaterial({
                color: colorGrid
            });

            points.push(
                new THREE.Vector3(i, -sizeY, 0),
                new THREE.Vector3(i, sizeY, 0),
            );
            const geometry = new THREE.BufferGeometry().setFromPoints(points);

            this.group.add(new THREE.Line(geometry, material));
        }

        return this.group;
    }
}

export default GridLine;
