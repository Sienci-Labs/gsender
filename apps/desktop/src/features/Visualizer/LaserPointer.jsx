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

class LaserPointer {
    constructor(options) {
        const { diameter = 1 } = { ...options };
        const radius = Number(diameter / 2) || 1;

        // line
        const geometryC = new THREE.CylinderGeometry(0.8, 0.8, 30, 32);
        const materialC = new THREE.MeshBasicMaterial({
            color: 0x80388b,
            opacity: 0.6,
            transparent: true,
        });
        const cylinder = new THREE.Mesh(geometryC, materialC);
        cylinder.position.set(0, 0, 15); // move up
        cylinder.rotation.setFromVector3(new THREE.Vector3(Math.PI / 2, 0, 0)); // stand up

        // sphere
        const geometryB = new THREE.IcosahedronGeometry(radius, 5);
        const materialB = new THREE.MeshBasicMaterial({
            color: 0x9dfcff,
        });
        const ball = new THREE.Mesh(geometryB, materialB);
        ball.layers.enable(1); // bloom

        // put together
        const group = new THREE.Group();
        group.add(cylinder);
        group.add(ball);

        return group;
    }
}

export default LaserPointer;
