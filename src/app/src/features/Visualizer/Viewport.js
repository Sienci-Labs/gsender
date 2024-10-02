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
import log from 'app/lib/log';
import CombinedCamera from 'app/lib/three/oldCombinedCamera';

const FOV_MIN = 15;
const TARGET0 = new THREE.Vector3(0, 0, 0);

// http://stackoverflow.com/questions/14614252/how-to-fit-camera-to-object
// https://github.com/mrdoob/three.js/issues/1454
// https://github.com/mrdoob/three.js/issues/1521
class Viewport {
    camera = null;

    width = 0;

    height = 0;

    state = {};

    constructor(camera, width, height) {
        if (!(camera instanceof CombinedCamera)) {
            log.error('This camera is not supported:', camera);
            return;
        }
        if (width <= 0 || height <= 0) {
            log.error(
                `Width (${width}) and height (${height}) cannot be less than or equal to zero.`,
            );
            return;
        }

        this.camera = camera;

        this.width = width;
        this.height = height;

        this.state = {
            ...this.state,
            width: this.width,
            height: this.height,
            target: TARGET0,
        };

        this.reset();
    }

    reset() {
        this.set(this.width, this.height, TARGET0);
    }

    update() {
        const { width, height, target } = this.state;
        this.set(width, height, target);
    }

    set(width, height, target = TARGET0) {
        if (!this.camera) {
            return;
        }

        this.state = {
            ...this.state,
            width,
            height,
            target,
        };

        const visibleWidth = Math.abs(this.camera.right - this.camera.left);
        const visibleHeight = Math.abs(this.camera.top - this.camera.bottom);

        if (this.camera.inOrthographicMode) {
            // Orthographic Projection
            const zoom = Math.min(visibleWidth / width, visibleHeight / height);
            this.camera.setZoom(zoom);
        } else {
            // Perspective Projection
            const { x, y, z } = this.camera.position;
            const eye = new THREE.Vector3(x, y, z);
            if (!(target instanceof THREE.Vector3)) {
                target = TARGET0;
            }
            // Find the distance from the camera to the closest face of the object
            const distance = target.distanceTo(eye);
            // The aspect ratio of the canvas (width / height)
            const aspect = visibleHeight > 0 ? visibleWidth / visibleHeight : 1;

            // http://stackoverflow.com/questions/14614252/how-to-fit-camera-to-object
            //
            // If you want the object height to match the visible height, set the camera
            // field-of-view like so:
            //   fov = 2 * Math.atan(height / (2 * dist)) * ( 180 / Math.PI); // in degrees
            //
            // If you want the object width to match the visible width, let `aspect` be the
            // aspect ratio of the canvas (canvas width divided by canvas height), and set
            // the camera field-of-view like so:
            //   fov = 2 * Math.atan((width / aspect) / (2 * dist)) * (180 / Math.PI); // in degrees
            //
            // Calculate the distance with a fixed camera field-of-view:
            //   maxDim = Math.max(w, h);
            //   aspectRatio = w / h;
            //   distance = maxDim / 2 / aspectRatio / Math.tan(Math.PI * fov / 360);
            //
            const fov = Math.max(
                // to fit the viewport height
                2 * Math.atan(height / (2 * distance)) * (180 / Math.PI),
                // to fit the viewport width
                2 *
                    Math.atan(width / aspect / (2 * distance)) *
                    (180 / Math.PI),
            );

            this.camera.setFov(Math.max(fov, FOV_MIN));
        }
    }
}

export default Viewport;
