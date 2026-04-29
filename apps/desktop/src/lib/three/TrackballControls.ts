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

/**
 * @author Eberhard Graether / http://egraether.com/
 * @author Mark Lundin     / http://mark-lundin.com
 * @author Simone Manini / http://daron1337.github.io
 * @author Luca Antiga     / http://lantiga.github.io
 */

interface TrackballControlsState {
    NONE: number;
    ROTATE: number;
    ZOOM: number;
    PAN: number;
    TOUCH_ROTATE: number;
    TOUCH_ZOOM_PAN: number;
}

class TrackballControls extends THREE.EventDispatcher {
    object: THREE.Camera;
    domElement: HTMLElement;
    enabled: boolean;
    screen: { left: number; top: number; width: number; height: number };
    rotateSpeed: number;
    zoomSpeed: number;
    panSpeed: number;
    noRotate: boolean;
    noZoom: boolean;
    noPan: boolean;
    staticMoving: boolean;
    dynamicDampingFactor: number;
    minDistance: number;
    maxDistance: number;
    keys: number[];
    mouseButtonState: number[];
    target: THREE.Vector3;
    target0: THREE.Vector3;
    position0: THREE.Vector3;
    up0: THREE.Vector3;

    private STATE: TrackballControlsState;
    private EPS: number;
    private lastPosition: THREE.Vector3;
    private _state: number;
    private _prevState: number;
    private _eye: THREE.Vector3;
    private _movePrev: THREE.Vector2;
    private _moveCurr: THREE.Vector2;
    private _lastAxis: THREE.Vector3;
    private _lastAngle: number;
    private _zoomStart: THREE.Vector2;
    private _zoomEnd: THREE.Vector2;
    private _touchZoomDistanceStart: number;
    private _touchZoomDistanceEnd: number;
    private _panStart: THREE.Vector2;
    private _panEnd: THREE.Vector2;

    constructor(object: THREE.Camera, domElement?: HTMLElement) {
        super();

        this.object = object;
        this.domElement = domElement !== undefined ? domElement : document.body;

        // API
        this.enabled = true;
        this.screen = { left: 0, top: 0, width: 0, height: 0 };
        this.rotateSpeed = 1.0;
        this.zoomSpeed = 1.2;
        this.panSpeed = 0.8;
        this.noRotate = false;
        this.noZoom = false;
        this.noPan = false;
        this.staticMoving = false;
        this.dynamicDampingFactor = 0.2;
        this.minDistance = 0;
        this.maxDistance = Infinity;
        this.keys = [65 /*A*/, 83 /*S*/, 68 /*D*/];

        this.mouseButtonState = [
            -1, // 0
            -1, // 1
            -1, // 2
            -1, // 3
            -1, // 4
        ];

        // internals
        this.target = new THREE.Vector3();
        this.EPS = 0.000001;
        this.lastPosition = new THREE.Vector3();

        this.STATE = {
            NONE: -1,
            ROTATE: 0,
            ZOOM: 1,
            PAN: 2,
            TOUCH_ROTATE: 3,
            TOUCH_ZOOM_PAN: 4,
        };

        this._state = this.STATE.NONE;
        this._prevState = this.STATE.NONE;
        this._eye = new THREE.Vector3();
        this._movePrev = new THREE.Vector2();
        this._moveCurr = new THREE.Vector2();
        this._lastAxis = new THREE.Vector3();
        this._lastAngle = 0;
        this._zoomStart = new THREE.Vector2();
        this._zoomEnd = new THREE.Vector2();
        this._touchZoomDistanceStart = 0;
        this._touchZoomDistanceEnd = 0;
        this._panStart = new THREE.Vector2();
        this._panEnd = new THREE.Vector2();

        // for reset
        this.target0 = this.target.clone();
        this.position0 = this.object.position.clone();
        this.up0 = this.object.up.clone();

        this.handleResize();

        this.update();
    }

    setMouseButtonState(button: number, state: number): void {
        if (this.mouseButtonState[button] === undefined) {
            return;
        }
        if (state < this.STATE.NONE || state > this.STATE.TOUCH_ZOOM_PAN) {
            return;
        }

        this.mouseButtonState[button] = state;
    }

    getMouseButtonState(button: number): number {
        const buttonState = this.mouseButtonState[button];

        if (buttonState === undefined) {
            return this.STATE.NONE;
        }

        return buttonState;
    }

    handleResize(): void {
        if (this.domElement === document.body) {
            this.screen.left = 0;
            this.screen.top = 0;
            this.screen.width = window.innerWidth;
            this.screen.height = window.innerHeight;
        } else {
            const box = this.domElement.getBoundingClientRect();
            const d = this.domElement.ownerDocument.documentElement;
            this.screen.left = box.left + window.pageXOffset - d.clientLeft;
            this.screen.top = box.top + window.pageYOffset - d.clientTop;
            this.screen.width = box.width;
            this.screen.height = box.height;
        }
    }

    getMouseOnScreen(pageX: number, pageY: number): THREE.Vector2 {
        const vector = new THREE.Vector2();

        vector.set(
            (pageX - this.screen.left) / this.screen.width,
            (pageY - this.screen.top) / this.screen.height,
        );

        return vector;
    }

    getMouseOnCircle(pageX: number, pageY: number): THREE.Vector2 {
        const vector = new THREE.Vector2();

        vector.set(
            (pageX - this.screen.width * 0.5 - this.screen.left) /
                (this.screen.width * 0.5),
            (this.screen.height + 2 * (this.screen.top - pageY)) /
                this.screen.width,
        );

        return vector;
    }

    rotateCamera(): void {
        const axis = new THREE.Vector3();
        const quaternion = new THREE.Quaternion();
        const eyeDirection = new THREE.Vector3();
        const objectUpDirection = new THREE.Vector3();
        const objectSidewaysDirection = new THREE.Vector3();
        const moveDirection = new THREE.Vector3();
        let angle: number;

        moveDirection.set(
            this._moveCurr.x - this._movePrev.x,
            this._moveCurr.y - this._movePrev.y,
            0,
        );
        angle = moveDirection.length();

        if (angle) {
            this._eye.copy(this.object.position).sub(this.target);

            eyeDirection.copy(this._eye).normalize();
            objectUpDirection.copy(this.object.up).normalize();
            objectSidewaysDirection
                .crossVectors(objectUpDirection, eyeDirection)
                .normalize();

            objectUpDirection.setLength(this._moveCurr.y - this._movePrev.y);
            objectSidewaysDirection.setLength(
                this._moveCurr.x - this._movePrev.x,
            );

            moveDirection.copy(objectUpDirection.add(objectSidewaysDirection));

            axis.crossVectors(moveDirection, this._eye).normalize();

            angle *= this.rotateSpeed;
            quaternion.setFromAxisAngle(axis, angle);

            this._eye.applyQuaternion(quaternion);
            this.object.up.applyQuaternion(quaternion);

            this._lastAxis.copy(axis);
            this._lastAngle = angle;
        } else if (!this.staticMoving && this._lastAngle) {
            this._lastAngle *= Math.sqrt(1.0 - this.dynamicDampingFactor);
            this._eye.copy(this.object.position).sub(this.target);
            quaternion.setFromAxisAngle(this._lastAxis, this._lastAngle);
            this._eye.applyQuaternion(quaternion);
            this.object.up.applyQuaternion(quaternion);
        }

        this._movePrev.copy(this._moveCurr);
    }

    zoomIn(delta: number): void {
        if (!delta) {
            return;
        }

        if ((this.object as any).inOrthographicMode) {
            const factor = 1.0 + delta * this.zoomSpeed;
            const zoom = (this.object as any).zoom * factor;
            if (zoom > 0.1) {
                (this.object as any).setZoom(zoom);
            } else {
                (this.object as any).setZoom(0.1);
            }
        } else {
            const factor = 1.0 - delta * this.zoomSpeed;
            this._eye.subVectors(this.object.position, this.target);
            this._eye.multiplyScalar(factor);
            this.object.position.addVectors(this.target, this._eye);
            this.checkDistances();
            this.object.lookAt(this.target);
            if (
                this.lastPosition.distanceToSquared(this.object.position) >
                this.EPS
            ) {
                this.dispatchEvent({ type: 'change' });
                this.lastPosition.copy(this.object.position);
            }
        }
    }

    zoomOut(delta: number): void {
        if (!delta) {
            return;
        }

        if ((this.object as any).inOrthographicMode) {
            const factor = 1.0 - delta * this.zoomSpeed;
            const zoom = (this.object as any).zoom * factor;
            if (zoom > 0.1) {
                (this.object as any).setZoom(zoom);
            } else {
                (this.object as any).setZoom(0.1);
            }
        } else {
            const factor = 1.0 + delta * this.zoomSpeed;
            this._eye.subVectors(this.object.position, this.target);
            this._eye.multiplyScalar(factor);
            this.object.position.addVectors(this.target, this._eye);
            this.checkDistances();
            this.object.lookAt(this.target);
            if (
                this.lastPosition.distanceToSquared(this.object.position) >
                this.EPS
            ) {
                this.dispatchEvent({ type: 'change' });
                this.lastPosition.copy(this.object.position);
            }
        }
    }

    zoomCamera(): void {
        let factor: number;

        if (this._state === this.STATE.TOUCH_ZOOM_PAN) {
            factor = this._touchZoomDistanceStart / this._touchZoomDistanceEnd;
            this._touchZoomDistanceStart = this._touchZoomDistanceEnd;
            this._eye.multiplyScalar(factor);
        } else {
            factor =
                1.0 + (this._zoomEnd.y - this._zoomStart.y) * this.zoomSpeed;

            if (factor !== 1.0 && factor > 0.0) {
                if ((this.object as any).inOrthographicMode) {
                    const zoom = (this.object as any).zoom * (2 - factor);
                    (this.object as any).setZoom(zoom);
                } else {
                    this._eye.multiplyScalar(factor);
                }
            }

            if (this.staticMoving) {
                this._zoomStart.copy(this._zoomEnd);
            } else {
                this._zoomStart.y +=
                    (this._zoomEnd.y - this._zoomStart.y) *
                    this.dynamicDampingFactor;
            }
        }
    }

    panCamera(): void {
        const mouseChange = new THREE.Vector2();
        const objectUp = new THREE.Vector3();
        const pan = new THREE.Vector3();

        mouseChange.copy(this._panEnd).sub(this._panStart);

        if (mouseChange.lengthSq()) {
            mouseChange.multiplyScalar(this._eye.length() * this.panSpeed);

            pan.copy(this._eye).cross(this.object.up).setLength(mouseChange.x);
            pan.add(objectUp.copy(this.object.up).setLength(mouseChange.y));

            this.object.position.add(pan);
            this.target.add(pan);

            if (this.staticMoving) {
                this._panStart.copy(this._panEnd);
            } else {
                this._panStart.add(
                    mouseChange
                        .subVectors(this._panEnd, this._panStart)
                        .multiplyScalar(this.dynamicDampingFactor),
                );
            }
        }
    }

    checkDistances(): void {
        if (!this.noZoom || !this.noPan) {
            if (this._eye.lengthSq() > this.maxDistance * this.maxDistance) {
                this.object.position.addVectors(
                    this.target,
                    this._eye.setLength(this.maxDistance),
                );
                this._zoomStart.copy(this._zoomEnd);
            }

            if (this._eye.lengthSq() < this.minDistance * this.minDistance) {
                this.object.position.addVectors(
                    this.target,
                    this._eye.setLength(this.minDistance),
                );
                this._zoomStart.copy(this._zoomEnd);
            }
        }
    }

    update(): void {
        this._eye.subVectors(this.object.position, this.target);

        if (!this.noRotate) {
            this.rotateCamera();
        }

        if (!this.noZoom) {
            this.zoomCamera();
        }

        if (!this.noPan) {
            this.panCamera();
        }

        this.object.position.addVectors(this.target, this._eye);

        this.checkDistances();

        this.object.lookAt(this.target);

        if (
            this.lastPosition.distanceToSquared(this.object.position) > this.EPS
        ) {
            this.dispatchEvent({ type: 'change' });
            this.lastPosition.copy(this.object.position);
        }
    }

    reset(): void {
        this._state = this.STATE.NONE;
        this._prevState = this.STATE.NONE;

        this.target.copy(this.target0);
        this.object.position.copy(this.position0);
        this.object.up.copy(this.up0);

        this._eye.subVectors(this.object.position, this.target);

        this.object.lookAt(this.target);

        this.dispatchEvent({ type: 'change' });

        this.lastPosition.copy(this.object.position);
    }

    // Event handlers

    private keydown = (event: KeyboardEvent): void => {
        if (this.enabled === false) return;

        window.removeEventListener('keydown', this.keydown);

        this._prevState = this._state;

        if (this._state !== this.STATE.NONE) {
            return;
        } else if (
            event.keyCode === this.keys[this.STATE.ROTATE] &&
            !this.noRotate
        ) {
            this._state = this.STATE.ROTATE;
        } else if (
            event.keyCode === this.keys[this.STATE.ZOOM] &&
            !this.noZoom
        ) {
            this._state = this.STATE.ZOOM;
        } else if (event.keyCode === this.keys[this.STATE.PAN] && !this.noPan) {
            this._state = this.STATE.PAN;
        }
    };

    private keyup = (event: KeyboardEvent): void => {
        if (this.enabled === false) return;

        this._state = this._prevState;

        window.addEventListener('keydown', this.keydown, false);
    };

    private mousedown = (event: MouseEvent): void => {
        if (this.enabled === false) return;

        event.preventDefault();
        event.stopPropagation();

        if (event.button === 4 || event.button === 5) return;

        if (this._state === this.STATE.NONE) {
            const buttonState = this.getMouseButtonState(event.button);
            this._state =
                buttonState === this.STATE.NONE ? event.button : buttonState;
        }

        if (this._state === this.STATE.ROTATE && !this.noRotate) {
            this._moveCurr.copy(
                this.getMouseOnCircle(event.pageX, event.pageY),
            );
            this._movePrev.copy(this._moveCurr);
        } else if (this._state === this.STATE.ZOOM && !this.noZoom) {
            this._zoomStart.copy(
                this.getMouseOnScreen(event.pageX, event.pageY),
            );
            this._zoomEnd.copy(this._zoomStart);
        } else if (this._state === this.STATE.PAN && !this.noPan) {
            this._panStart.copy(
                this.getMouseOnScreen(event.pageX, event.pageY),
            );
            this._panEnd.copy(this._panStart);
        }

        document.addEventListener('mousemove', this.mousemove, false);
        document.addEventListener('mouseup', this.mouseup, false);

        this.dispatchEvent({ type: 'start' });
    };

    private mousemove = (event: MouseEvent): void => {
        if (this.enabled === false) return;

        event.preventDefault();
        event.stopPropagation();

        if (this._state === this.STATE.ROTATE && !this.noRotate) {
            this._movePrev.copy(this._moveCurr);
            this._moveCurr.copy(
                this.getMouseOnCircle(event.pageX, event.pageY),
            );
        } else if (this._state === this.STATE.ZOOM && !this.noZoom) {
            this._zoomEnd.copy(this.getMouseOnScreen(event.pageX, event.pageY));
        } else if (this._state === this.STATE.PAN && !this.noPan) {
            this._panEnd.copy(this.getMouseOnScreen(event.pageX, event.pageY));
        }
    };

    private mouseup = (event: MouseEvent): void => {
        if (this.enabled === false) return;

        event.preventDefault();
        event.stopPropagation();

        this._state = this.STATE.NONE;

        document.removeEventListener('mousemove', this.mousemove);
        document.removeEventListener('mouseup', this.mouseup);
        this.dispatchEvent({ type: 'end' });
    };

    private mousewheel = (event: WheelEvent): void => {
        if (this.enabled === false) return;

        event.preventDefault();
        event.stopPropagation();

        switch (event.deltaMode) {
            case 2:
                // Zoom in pages
                this._zoomStart.y -= event.deltaY * 0.025;
                break;

            case 1:
                // Zoom in lines
                this._zoomStart.y -= event.deltaY * 0.01;
                break;

            default:
                // undefined, 0, assume pixels
                this._zoomStart.y -= event.deltaY * 0.00025;
                break;
        }

        this.dispatchEvent({ type: 'start' });
        this.dispatchEvent({ type: 'end' });
    };

    private touchstart = (event: TouchEvent): void => {
        if (this.enabled === false) return;

        event.preventDefault();

        switch (event.touches.length) {
            case 1:
                this._state = this.STATE.TOUCH_ROTATE;
                this._moveCurr.copy(
                    this.getMouseOnCircle(
                        event.touches[0].pageX,
                        event.touches[0].pageY,
                    ),
                );
                this._movePrev.copy(this._moveCurr);
                break;

            default: // 2 or more
                this._state = this.STATE.TOUCH_ZOOM_PAN;
                const dx = event.touches[0].pageX - event.touches[1].pageX;
                const dy = event.touches[0].pageY - event.touches[1].pageY;
                this._touchZoomDistanceEnd = this._touchZoomDistanceStart =
                    Math.sqrt(dx * dx + dy * dy);

                const x = (event.touches[0].pageX + event.touches[1].pageX) / 2;
                const y = (event.touches[0].pageY + event.touches[1].pageY) / 2;
                this._panStart.copy(this.getMouseOnScreen(x, y));
                this._panEnd.copy(this._panStart);
                break;
        }

        this.dispatchEvent({ type: 'start' });
    };

    private touchmove = (event: TouchEvent): void => {
        if (this.enabled === false) return;

        event.preventDefault();
        event.stopPropagation();

        switch (event.touches.length) {
            case 1:
                this._movePrev.copy(this._moveCurr);
                this._moveCurr.copy(
                    this.getMouseOnCircle(
                        event.touches[0].pageX,
                        event.touches[0].pageY,
                    ),
                );
                break;

            default: // 2 or more
                const dx = event.touches[0].pageX - event.touches[1].pageX;
                const dy = event.touches[0].pageY - event.touches[1].pageY;
                this._touchZoomDistanceEnd = Math.sqrt(dx * dx + dy * dy);

                const x = (event.touches[0].pageX + event.touches[1].pageX) / 2;
                const y = (event.touches[0].pageY + event.touches[1].pageY) / 2;
                this._panEnd.copy(this.getMouseOnScreen(x, y));
                break;
        }
    };

    private touchend = (event: TouchEvent): void => {
        if (this.enabled === false) return;

        switch (event.touches.length) {
            case 0:
                this._state = this.STATE.NONE;
                break;

            case 1:
                this._state = this.STATE.TOUCH_ROTATE;
                this._moveCurr.copy(
                    this.getMouseOnCircle(
                        event.touches[0].pageX,
                        event.touches[0].pageY,
                    ),
                );
                this._movePrev.copy(this._moveCurr);
                break;
        }

        this.dispatchEvent({ type: 'end' });
    };

    private contextmenu = (event: Event): void => {
        event.preventDefault();
    };

    dispose(): void {
        this.domElement.removeEventListener(
            'contextmenu',
            this.contextmenu,
            false,
        );
        this.domElement.removeEventListener('mousedown', this.mousedown, false);
        this.domElement.removeEventListener('wheel', this.mousewheel, false);

        this.domElement.removeEventListener(
            'touchstart',
            this.touchstart,
            false,
        );
        this.domElement.removeEventListener('touchend', this.touchend, false);
        this.domElement.removeEventListener('touchmove', this.touchmove, false);

        document.removeEventListener('mousemove', this.mousemove, false);
        document.removeEventListener('mouseup', this.mouseup, false);

        window.removeEventListener('keydown', this.keydown, false);
        window.removeEventListener('keyup', this.keyup, false);
    }
}

export default TrackballControls;
