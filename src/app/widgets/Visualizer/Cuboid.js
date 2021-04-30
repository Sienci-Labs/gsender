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

class Cuboid {
    constructor(options) {
        const {
            dx = 0,
            dy = 0,
            dz = 0,
            color = 0x000000,
            opacity = 1,
            transparent = true,
            dashed = false,
            ...others
        } = { ...options };

        const geometry = new THREE.BoxGeometry(
            dx, // width
            dy, // height
            dz, // depth
        );
        const edges = new THREE.EdgesGeometry(geometry);

        let material;

        if (dashed) {
            material = new THREE.LineDashedMaterial({
                color,
                opacity,
                transparent,
                ...others
            });
        } else {
            material = new THREE.LineBasicMaterial({
                color,
                opacity,
                transparent,
                ...others
            });
        }

        const lineSegments = new THREE.LineSegments(edges, material);

        if (dashed) {
            // Computes an array of distance values which are necessary for LineDashedMaterial.
            lineSegments.computeLineDistances();
        }

        return lineSegments;
    }
}

export default Cuboid;
