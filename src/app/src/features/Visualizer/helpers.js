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
import STLLoader from 'app/lib/three/STLLoader';

const getBoundingBox = (object) => {
    const box = new THREE.Box3().setFromObject(object);
    const boundingBox = {
        min: {
            x: box.min.x === Infinity ? 0 : box.min.x,
            y: box.min.y === Infinity ? 0 : box.min.y,
            z: box.min.z === Infinity ? 0 : box.min.z,
        },
        max: {
            x: box.max.x === -Infinity ? 0 : box.max.x,
            y: box.max.y === -Infinity ? 0 : box.max.y,
            z: box.max.z === -Infinity ? 0 : box.max.z,
        },
    };

    return boundingBox;
};

const loadSTL = (url) =>
    new Promise((resolve) => {
        new STLLoader().load(url, resolve);
    });

const loadTexture = (url) =>
    new Promise((resolve) => {
        new THREE.TextureLoader().load(url, resolve);
    });

// Build a black edge "outline" of the tool model — the geometric edges of
// the bit (its flutes and silhouette) drawn as black lines on top of the
// mesh. Added as a child of the rotating cuttingTool so the outlined flutes
// sweep as it spins, instead of the bit reading as a featureless grey blob.
// EdgesGeometry keeps only edges whose adjacent faces meet more sharply than
// thresholdAngleDeg, so smooth round areas stay clean and the flute creases
// stand out. Lower the threshold to catch more edges, raise it for fewer.
const createToolOutline = (geometry, { thresholdAngleDeg = 30 } = {}) => {
    if (
        !geometry ||
        !geometry.getAttribute ||
        !geometry.getAttribute('position')
    ) {
        return null;
    }
    const edges = new THREE.EdgesGeometry(geometry, thresholdAngleDeg);
    const material = new THREE.LineBasicMaterial({ color: 0x000000 });
    const lines = new THREE.LineSegments(edges, material);
    lines.name = 'CuttingToolOutline';
    return lines;
};

export { getBoundingBox, loadSTL, loadTexture, createToolOutline };
