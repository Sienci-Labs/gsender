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
        const vertices = [];
        const halfSizeX = sizeX / 2;
        const halfSizeY = sizeY / 2;

        // Add lines parallel to the Y-axis (vertical lines)
        const stepX = sizeX / step;
        for (let i = 0; i <= stepX; i++) {
            const x = -halfSizeX + i * step;
            vertices.push(x, -halfSizeY, 0, x, halfSizeY, 0);
        }

        // Add lines parallel to the X-axis (horizontal lines)
        const stepY = sizeY / step;
        for (let i = 0; i <= stepY; i++) {
            const y = -halfSizeY + i * step;
            vertices.push(-halfSizeX, y, 0, halfSizeX, y, 0);
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute(
            'position',
            new THREE.BufferAttribute(new Float32Array(vertices), 3),
        );

        const material = new THREE.LineBasicMaterial({ color: colorGrid });
        const grid = new THREE.LineSegments(geometry, material);

        // grid.rotation.x = Math.PI / 2;
        grid.material.opacity = 0.15;
        grid.material.transparent = true;
        grid.material.depthWrite = false;

        return grid;
    }
}

export default GridLine;
