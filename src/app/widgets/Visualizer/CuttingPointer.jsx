/*
 *     This file is part of gSender.
 *
 *     gSender is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     gSender is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with gSender.  If not, see <https://www.gnu.org/licenses/>.
 */

import * as THREE from 'three';

class CuttingPointer {
    constructor(options) {
        const {
            color = 0xffffff,
            diameter = 1,
            widthSegments = 32,
            heightSegments = 32,
            phiStart = 0,
            phiLength = Math.PI * 2,
            thetaStart = 0,
            thetaLength = Math.PI
        } = { ...options };
        const radius = Number(diameter / 2) || 1;

        const geometry = new THREE.SphereGeometry(
            radius,
            widthSegments,
            heightSegments,
            phiStart,
            phiLength,
            thetaStart,
            thetaLength
        );
        const material = new THREE.MeshBasicMaterial({
            color: color
        });

        return new THREE.Mesh(geometry, material);
    }
}

export default CuttingPointer;
