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

/**
 *    @author zz85 / http://twitter.com/blurspline / http://www.lab4games.net/zz85/blog
 *
 *    A general perpose camera, for setting FOV, Lens Focal Length,
 *        and switching between perspective and orthographic views easily.
 *        Use this only if you do not wish to manage
 *        both a Orthographic and Perspective Camera
 *
 */

import * as THREE from 'three';

class CombinedCamera extends THREE.Camera {
    constructor(width, height, fov, near, far, orthoNear, orthoFar) {
        super();

        this.fov = fov;

        this.far = far;
        this.near = near;

        this.left = -(width / 2);
        this.right = width / 2;
        this.top = height / 2;
        this.bottom = -(height / 2);

        this.aspect = width / height;
        this.zoom = 1;
        this.view = null;
        // We could also handle the projectionMatrix internally, but just wanted to test nested camera objects

        this.cameraO = new THREE.OrthographicCamera(
            this.left,
            this.right,
            this.top,
            this.bottom,
            orthoNear,
            orthoFar,
        );
        this.cameraP = new THREE.PerspectiveCamera(
            fov,
            width / height,
            near,
            far,
        );

        this.toPerspective();
    }

    toPerspective() {
        // Switches to the Perspective Camera

        this.near = this.cameraP.near;
        this.far = this.cameraP.far;

        this.cameraP.aspect = this.aspect;
        this.cameraP.fov = this.fov / this.zoom;
        this.cameraP.view = this.view;

        this.cameraP.updateProjectionMatrix();

        this.projectionMatrix = this.cameraP.projectionMatrix;

        this.inPerspectiveMode = true;
        this.inOrthographicMode = false;
    }

    toOrthographic() {
        // Switches to the Orthographic camera estimating viewport from Perspective

        const fov = this.fov;
        const aspect = this.cameraP.aspect;
        const near = this.cameraP.near;
        const far = this.cameraP.far;

        // The size that we set is the mid plane of the viewing frustum

        const hyperfocus = (near + far) / 2;

        let halfHeight = Math.tan((fov * Math.PI) / 180 / 2) * hyperfocus;
        let halfWidth = halfHeight * aspect;

        halfHeight /= this.zoom;
        halfWidth /= this.zoom;

        this.cameraO.left = -halfWidth;
        this.cameraO.right = halfWidth;
        this.cameraO.top = halfHeight;
        this.cameraO.bottom = -halfHeight;
        this.cameraO.view = this.view;

        this.cameraO.updateProjectionMatrix();

        this.near = this.cameraO.near;
        this.far = this.cameraO.far;
        this.projectionMatrix = this.cameraO.projectionMatrix;

        this.inPerspectiveMode = false;
        this.inOrthographicMode = true;
    }

    copy(source) {
        super.copy(source);

        this.fov = source.fov;
        this.far = source.far;
        this.near = source.near;

        this.left = source.left;
        this.right = source.right;
        this.top = source.top;
        this.bottom = source.bottom;

        this.zoom = source.zoom;
        this.view =
            source.view === null ? null : Object.assign({}, source.view);
        this.aspect = source.aspect;

        this.cameraO.copy(source.cameraO);
        this.cameraP.copy(source.cameraP);

        this.inOrthographicMode = source.inOrthographicMode;
        this.inPerspectiveMode = source.inPerspectiveMode;

        return this;
    }

    setViewOffset(fullWidth, fullHeight, x, y, width, height) {
        this.view = {
            fullWidth: fullWidth,
            fullHeight: fullHeight,
            offsetX: x,
            offsetY: y,
            width: width,
            height: height,
        };

        if (this.inPerspectiveMode) {
            this.aspect = fullWidth / fullHeight;
            this.toPerspective();
        } else {
            this.toOrthographic();
        }
    }

    clearViewOffset() {
        this.view = null;
        this.updateProjectionMatrix();
    }

    setSize(width, height) {
        this.cameraP.aspect = width / height;
        this.left = -(width / 2);
        this.right = width / 2;
        this.top = height / 2;
        this.bottom = -(height / 2);
    }

    setFov(fov) {
        this.fov = fov;

        if (this.inPerspectiveMode) {
            this.toPerspective();
        } else {
            this.toOrthographic();
        }
    }

    // For maintaining similar API with PerspectiveCamera
    updateProjectionMatrix() {
        if (this.inPerspectiveMode) {
            this.toPerspective();
        } else {
            this.toPerspective();
            this.toOrthographic();
        }
    }

    /*
     * Uses Focal Length (in mm) to estimate and set FOV
     * 35mm (full frame) camera is used if frame size is not specified;
     * Formula based on http://www.bobatkins.com/photography/technical/field_of_view.html
     */
    setLens(focalLength, filmGauge) {
        if (filmGauge === undefined) {
            filmGauge = 35;
        }

        const vExtentSlope =
            (0.5 * filmGauge) /
            (focalLength * Math.max(this.cameraP.aspect, 1));

        const fov = THREE.MathUtils.RAD2DEG * 2 * Math.atan(vExtentSlope);

        this.setFov(fov);

        return fov;
    }

    setZoom(zoom) {
        this.zoom = zoom;

        if (this.inPerspectiveMode) {
            this.toPerspective();
        } else {
            this.toOrthographic();
        }
    }

    toFrontView() {
        this.rotation.x = 0;
        this.rotation.y = 0;
        this.rotation.z = 0;
        // should we be modifing the matrix instead?
    }

    toBackView() {
        this.rotation.x = 0;
        this.rotation.y = Math.PI;
        this.rotation.z = 0;
    }

    toLeftView() {
        this.rotation.x = 0;
        this.rotation.y = -(Math.PI / 2);
        this.rotation.z = 0;
    }

    toRightView() {
        this.rotation.x = 0;
        this.rotation.y = Math.PI / 2;
        this.rotation.z = 0;
    }

    toTopView() {
        this.rotation.x = -(Math.PI / 2);
        this.rotation.y = 0;
        this.rotation.z = 0;
    }

    toBottomView() {
        this.rotation.x = Math.PI / 2;
        this.rotation.y = 0;
        this.rotation.z = 0;
    }
}

export default CombinedCamera;
