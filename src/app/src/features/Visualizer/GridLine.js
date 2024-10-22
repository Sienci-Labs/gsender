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

    colorGrid = new THREE.Color(0x888888);

    constructor(sizeX, sizeY, step, colorGrid) {
        colorGrid = new THREE.Color(colorGrid) || this.colorGrid;

        /*sizeY = (typeof sizeY === 'undefined') ? sizeX : sizeY;
        stepY = (typeof stepY === 'undefined') ? stepX : stepY;*/
        const size = Math.max(sizeX, sizeY);
        const divs = Math.ceil(size / step);

        const grid = new THREE.GridHelper(size, divs, colorGrid, colorGrid);
        grid.rotation.x = Math.PI / 2;

        grid.material.opacity = 0.15;
        grid.material.transparent = true;
        grid.material.depthWrite = false;

        return grid;
    }
}

export default GridLine;
