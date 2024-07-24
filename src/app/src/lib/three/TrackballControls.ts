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

/* eslint-disable */
import * as THREE from 'three';

/**
 * @author Eberhard Graether / http://egraether.com/
 * @author Mark Lundin     / http://mark-lundin.com
 * @author Simone Manini / http://daron1337.github.io
 * @author Luca Antiga     / http://lantiga.github.io
 */

class TrackballControls extends THREE.EventDispatcher {
    object: THREE.Camera;
    domElement: Element | Document;
    STATE = { NONE: -1, ROTATE: 0, ZOOM: 1, PAN: 2, TOUCH_ROTATE: 3, TOUCH_ZOOM_PAN: 4 };

    // API
    enabled = true;
    screen = { left: 0, top: 0, width: 0, height: 0 };
    rotateSpeed = 1.0;
    zoomSpeed = 1.2;
    panSpeed = 0.8;
    noRotate = false;
    noZoom = false;
    noPan = false;
    staticMoving = false;
    dynamicDampingFactor = 0.2;
    minDistance = 0;
    maxDistance = Infinity;
    keys = [65 /*A*/, 83 /*S*/, 68 /*D*/];

    // https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
    //
    // A number representing a given button:
    // 0: Main button pressed, usually the left button or the un-initialized state
    // 1: Auxiliary button pressed, usually the wheel button or the middle button (if present)
    // 2: Secondary button pressed, usually the right button
    // 3: Fourth button, typically the Browser Back button
    // 4: Fifth button, typically the Browser Forward button
    mouseButtonState = [
        this.STATE.NONE, // 0
        this.STATE.NONE, // 1
        this.STATE.NONE, // 2
        this.STATE.NONE, // 3
        this.STATE.NONE // 4
    ];

    // internals
    target = new THREE.Vector3();
    EPS = 0.000001;
    lastPosition = new THREE.Vector3();
    _state = this.STATE.NONE;
    _prevState = this.STATE.NONE;
    eye = new THREE.Vector3();
    movePrev = new THREE.Vector2();
    moveCurr = new THREE.Vector2();
    lastAxis = new THREE.Vector3();
    lastAngle = 0
    zoomStart = new THREE.Vector2()
    zoomEnd = new THREE.Vector2()
    touchZoomDistanceStart = 0
    touchZoomDistanceEnd = 0
    panStart = new THREE.Vector2()
    panEnd = new THREE.Vector2();

    // for reset
    target0 = this.target.clone();
    position0: THREE.Vector3;
    up0: THREE.Vector3;

    // events
    changeEvent = { type: 'change' };
    startEvent = { type: 'start' };
    endEvent = { type: 'end' };

    constructor(object: THREE.Camera, domElement: Element | Document) {
        super();
        this.object = object;
        this.domElement = (domElement !== undefined) ? domElement : document;
        this.position0 = this.object.position.clone();
        this.up0 = this.object.up.clone();
    }

    componentDidMount() {
        this.domElement.addEventListener('contextmenu', this.contextmenu, false);
        this.domElement.addEventListener('mousedown', this.mousedown as EventListener, false);
        this.domElement.addEventListener('wheel', this.mousewheel as EventListener, false);

        this.domElement.addEventListener('touchstart', this.touchstart as EventListener, false);
        this.domElement.addEventListener('touchend', this.touchend as EventListener, false);
        this.domElement.addEventListener('touchmove', this.touchmove as EventListener, false);

        window.addEventListener('keydown', this.keydown, false);
        window.addEventListener('keyup', this.keyup, false);

        this.handleResize();

        // force an update at start
        this.update();
    }

    // methods
    setMouseButtonState(button: number, state: number): void {
        if (this.mouseButtonState[button] === undefined) {
            return;
        }
        if ((state < this.STATE.NONE) || (state > this.STATE.TOUCH_ZOOM_PAN)) {
            return;
        }
        this.mouseButtonState[button] = state;
    };

    getMouseButtonState(button: number): number {
        let buttonState = this.mouseButtonState[button];

        if (buttonState === undefined) {
            return this.STATE.NONE;
        }

        return buttonState;
    };

    handleResize(): void {
        if (this.domElement === document) {
            this.screen.left = 0;
            this.screen.top = 0;
            this.screen.width = window.innerWidth;
            this.screen.height = window.innerHeight;
        } else {
            let box = (this.domElement as Element).getBoundingClientRect();
            // adjustments come from similar code in the jquery offset() function
            let d = this.domElement.ownerDocument.documentElement;
            this.screen.left = box.left + window.pageXOffset - d.clientLeft;
            this.screen.top = box.top + window.pageYOffset - d.clientTop;
            this.screen.width = box.width;
            this.screen.height = box.height;
        }
    };

    getMouseOnScreen(pageX: number, pageY: number): THREE.Vector2 {
        let vector = new THREE.Vector2();
        vector.set(
            (pageX - this.screen.left) / this.screen.width,
            (pageY - this.screen.top) / this.screen.height
        );
        return vector;
    };

    getMouseOnCircle(pageX: number, pageY: number): THREE.Vector2 {
        let vector = new THREE.Vector2();
        vector.set(
            ((pageX - this.screen.width * 0.5 - this.screen.left) / (this.screen.width * 0.5)),
            ((this.screen.height + 2 * (this.screen.top - pageY)) / this.screen.width) // screen.width intentional
        );
        return vector;
    };

    rotateCamera(): void {
        let axis = new THREE.Vector3()
        let quaternion = new THREE.Quaternion();
        let eyeDirection = new THREE.Vector3();
        let objectUpDirection = new THREE.Vector3();
        let objectSidewaysDirection = new THREE.Vector3();
        let moveDirection = new THREE.Vector3();
        let angle: number;

        moveDirection.set(this.moveCurr.x - this.movePrev.x, this.moveCurr.y - this.movePrev.y, 0);
        angle = moveDirection.length();

        if (angle) {
            this.eye.copy(this.object.position).sub(this.target);

            eyeDirection.copy(this.eye).normalize();
            objectUpDirection.copy(this.object.up).normalize();
            objectSidewaysDirection.crossVectors(objectUpDirection, eyeDirection).normalize();

            objectUpDirection.setLength(this.moveCurr.y - this.movePrev.y);
            objectSidewaysDirection.setLength(this.moveCurr.x - this.movePrev.x);

            moveDirection.copy(objectUpDirection.add(objectSidewaysDirection));

            axis.crossVectors(moveDirection, this.eye).normalize();

            angle *= this.rotateSpeed;
            quaternion.setFromAxisAngle(axis, angle);

            this.eye.applyQuaternion(quaternion);
            this.object.up.applyQuaternion(quaternion);

            this.lastAxis.copy(axis);
            this.lastAngle = angle;
        } else if (!this.staticMoving && this.lastAngle) {
            this.lastAngle *= Math.sqrt(1.0 - this.dynamicDampingFactor);
            this.eye.copy(this.object.position).sub(this.target);
            quaternion.setFromAxisAngle(this.lastAxis, this.lastAngle);
            this.eye.applyQuaternion(quaternion);
            this.object.up.applyQuaternion(quaternion);
        }
        this.movePrev.copy(this.moveCurr);
    };

    zoomIn(delta: number): void {
        if (!delta) {
            return;
        }

        if ((this.object as THREE.OrthographicCamera).isOrthographicCamera) {
            const factor = 1.0 + (delta * this.zoomSpeed);
            const zoom = (this.object as THREE.OrthographicCamera).zoom * factor;
            if (zoom > 0.1) {
                (this.object as THREE.OrthographicCamera).zoom = zoom;
            } else {
                (this.object as THREE.OrthographicCamera).zoom = 0.1;
            }
        } else {
            const factor = 1.0 - (delta * this.zoomSpeed);
            this.eye.subVectors(this.object.position, this.target);
            this.eye.multiplyScalar(factor);
            this.object.position.addVectors(this.target, this.eye);
            this.checkDistances();
            this.object.lookAt(this.target);
            if (this.lastPosition.distanceToSquared(this.object.position) > this.EPS) {
                this.dispatchEvent(this.changeEvent);
                this.lastPosition.copy(this.object.position);
            }
        }
    };

    zoomOut(delta: number): void {
        if (!delta) {
            return;
        }

        if ((this.object as THREE.OrthographicCamera).isOrthographicCamera) {
            const factor = 1.0 - (delta * this.zoomSpeed);
            const zoom = (this.object as THREE.OrthographicCamera).zoom * factor;
            if (zoom > 0.1) {
                (this.object as THREE.OrthographicCamera).zoom = zoom;
            } else {
                (this.object as THREE.OrthographicCamera).zoom = 0.1;
            }
        } else {
            const factor = 1.0 + (delta * this.zoomSpeed);
            this.eye.subVectors(this.object.position, this.target);
            this.eye.multiplyScalar(factor);
            this.object.position.addVectors(this.target, this.eye);
            this.checkDistances();
            this.object.lookAt(this.target);
            if (this.lastPosition.distanceToSquared(this.object.position) > this.EPS) {
                this.dispatchEvent(this.changeEvent);
                this.lastPosition.copy(this.object.position);
            }
        }
    };

    zoomCamera(): void {
        let factor;

        if (this._state === this.STATE.TOUCH_ZOOM_PAN) {
            factor = this.touchZoomDistanceStart / this.touchZoomDistanceEnd;
            this.touchZoomDistanceStart = this.touchZoomDistanceEnd;
            this.eye.multiplyScalar(factor);
        } else {
            factor = 1.0 + (this.zoomEnd.y - this.zoomStart.y) * this.zoomSpeed;

            if (factor !== 1.0 && factor > 0.0) {
                if ((this.object as THREE.OrthographicCamera).isOrthographicCamera) {
                    // See https://github.com/mrdoob/three.js/issues/1521
                    let zoom = (this.object as THREE.OrthographicCamera).zoom * (2 - factor);
                    (this.object as THREE.OrthographicCamera).zoom = zoom;
                } else {
                    this.eye.multiplyScalar(factor);
                }
            }

            if (this.staticMoving) {
                this.zoomStart.copy(this.zoomEnd);
            } else {
                this.zoomStart.y += (this.zoomEnd.y - this.zoomStart.y) * this.dynamicDampingFactor;
            }
        }
    };

    panCamera(): void {
        let mouseChange = new THREE.Vector2();
        let objectUp = new THREE.Vector3();
        let pan = new THREE.Vector3();;

        mouseChange.copy(this.panEnd).sub(this.panStart);

        if (mouseChange.lengthSq()) {
            mouseChange.multiplyScalar(this.eye.length() * this.panSpeed);

            pan.copy(this.eye).cross(this.object.up).setLength(mouseChange.x);
            pan.add(objectUp.copy(this.object.up).setLength(mouseChange.y));

            this.object.position.add(pan);
            this.target.add(pan);

            if (this.staticMoving) {
                this.panStart.copy(this.panEnd);
            } else {
                this.panStart.add(mouseChange.subVectors(this.panEnd, this.panStart).multiplyScalar(this.dynamicDampingFactor));
            }
        }
    };

    checkDistances(): void {
        if (!this.noZoom || !this.noPan) {
            if (this.eye.lengthSq() > this.maxDistance * this.maxDistance) {
                this.object.position.addVectors(this.target, this.eye.setLength(this.maxDistance));
                this.zoomStart.copy(this.zoomEnd);
            }

            if (this.eye.lengthSq() < this.minDistance * this.minDistance) {
                this.object.position.addVectors(this.target, this.eye.setLength(this.minDistance));
                this.zoomStart.copy(this.zoomEnd);
            }
        }
    };

    update(): void {
        this.eye.subVectors(this.object.position, this.target);

        if (!this.noRotate) {
            this.rotateCamera();
        }

        if (!this.noZoom) {
            this.zoomCamera();
        }

        if (!this.noPan) {
            this.panCamera();
        }

        this.object.position.addVectors(this.target, this.eye);

        this.checkDistances();

        this.object.lookAt(this.target);

        if (this.lastPosition.distanceToSquared(this.object.position) > this.EPS) {
            this.dispatchEvent(this.changeEvent);
            this.lastPosition.copy(this.object.position);
        }
    };

    reset(): void {
        this._state = this.STATE.NONE;
        this._prevState = this.STATE.NONE;

        this.target.copy(this.target0);
        this.object.position.copy(this.position0);
        this.object.up.copy(this.up0);

        this.eye.subVectors(this.object.position, this.target);

        this.object.lookAt(this.target);

        this.dispatchEvent(this.changeEvent);

        this.lastPosition.copy(this.object.position);
    };

    // listeners
    keydown(event: KeyboardEvent): void {
        if (this.enabled === false) return;

        window.removeEventListener('keydown', this.keydown);

        this._prevState = this._state;

        if (this._state !== this.STATE.NONE) {
            return;
        } else if (event.keyCode === this.keys[this.STATE.ROTATE] && !this.noRotate) {
            this._state = this.STATE.ROTATE;
        } else if (event.keyCode === this.keys[this.STATE.ZOOM] && !this.noZoom) {
            this._state = this.STATE.ZOOM;
        } else if (event.keyCode === this.keys[this.STATE.PAN] && !this.noPan) {
            this._state = this.STATE.PAN;
        }
    }

    keyup(_event: KeyboardEvent): void {
        if (this.enabled === false) return;

        this._state = this._prevState;

        window.addEventListener('keydown', this.keydown, false);
    }

    mousedown(event: MouseEvent): void {
        if (this.enabled === false) return;

        event.preventDefault();
        event.stopPropagation();

        if (event.button === 4 || event.button === 5) return;

        if (this._state === this.STATE.NONE) {
            let buttonState = this.getMouseButtonState(event.button);
            this._state = (buttonState === this.STATE.NONE) ? event.button : buttonState;
        }

        if (this._state === this.STATE.ROTATE && !this.noRotate) {
            this.moveCurr.copy(this.getMouseOnCircle(event.pageX, event.pageY));
            this.movePrev.copy(this.moveCurr);

        } else if (this._state === this.STATE.ZOOM && !this.noZoom) {
            this.zoomStart.copy(this.getMouseOnScreen(event.pageX, event.pageY));
            this.zoomEnd.copy(this.zoomStart);

        } else if (this._state === this.STATE.PAN && !this.noPan) {
            this.panStart.copy(this.getMouseOnScreen(event.pageX, event.pageY));
            this.panEnd.copy(this.panStart);
        }

        document.addEventListener('mousemove', this.mousemove, false);
        document.addEventListener('mouseup', this.mouseup, false);

        this.dispatchEvent(this.startEvent);
    }

    mousemove(event: MouseEvent): void {
        if (this.enabled === false) return;

        event.preventDefault();
        event.stopPropagation();

        if (this._state === this.STATE.ROTATE && !this.noRotate) {
            this.movePrev.copy(this.moveCurr);
            this.moveCurr.copy(this.getMouseOnCircle(event.pageX, event.pageY));
        } else if (this._state === this.STATE.ZOOM && !this.noZoom) {
            this.zoomEnd.copy(this.getMouseOnScreen(event.pageX, event.pageY));
        } else if (this._state === this.STATE.PAN && !this.noPan) {
            this.panEnd.copy(this.getMouseOnScreen(event.pageX, event.pageY));
        }
    }

    mouseup(event: MouseEvent): void {
        if (this.enabled === false) return;

        event.preventDefault();
        event.stopPropagation();

        this._state = this.STATE.NONE;

        document.removeEventListener('mousemove', this.mousemove);
        document.removeEventListener('mouseup', this.mouseup);
        this.dispatchEvent(this.endEvent);
    }

    mousewheel(event: WheelEvent): void {
        if (this.enabled === false) return;

        event.preventDefault();
        event.stopPropagation();

        switch (event.deltaMode) {
            case 2:
                // Zoom in pages
                this.zoomStart.y -= event.deltaY * 0.025;
                break;
            case 1:
                // Zoom in lines
                this.zoomStart.y -= event.deltaY * 0.01;
                break;
            default:
                // undefined, 0, assume pixels
                this.zoomStart.y -= event.deltaY * 0.00025;
                break;
        }

        this.dispatchEvent(this.startEvent);
        this.dispatchEvent(this.endEvent);
    }

    touchstart(event: TouchEvent): void {
        if (this.enabled === false) return;

        event.preventDefault();

        switch (event.touches.length) {
            case 1:
                this._state = this.STATE.TOUCH_ROTATE;
                this.moveCurr.copy(this.getMouseOnCircle(event.touches[0].pageX, event.touches[0].pageY));
                this.movePrev.copy(this.moveCurr);
                break;
            default: // 2 or more
                this._state = this.STATE.TOUCH_ZOOM_PAN;
                let dx = event.touches[0].pageX - event.touches[1].pageX;
                let dy = event.touches[0].pageY - event.touches[1].pageY;
                this.touchZoomDistanceEnd = this.touchZoomDistanceStart = Math.sqrt(dx * dx + dy * dy);

                let x = (event.touches[0].pageX + event.touches[1].pageX) / 2;
                let y = (event.touches[0].pageY + event.touches[1].pageY) / 2;
                this.panStart.copy(this.getMouseOnScreen(x, y));
                this.panEnd.copy(this.panStart);
                break;
        }

        this.dispatchEvent(this.startEvent);
    }

    touchmove(event: TouchEvent): void {
        if (this.enabled === false) return;

        event.preventDefault();
        event.stopPropagation();

        switch (event.touches.length) {
            case 1:
                this.movePrev.copy(this.moveCurr);
                this.moveCurr.copy(this.getMouseOnCircle(event.touches[0].pageX, event.touches[0].pageY));
                break;
            default: // 2 or more
                let dx = event.touches[0].pageX - event.touches[1].pageX;
                let dy = event.touches[0].pageY - event.touches[1].pageY;
                this.touchZoomDistanceEnd = Math.sqrt(dx * dx + dy * dy);

                let x = (event.touches[0].pageX + event.touches[1].pageX) / 2;
                let y = (event.touches[0].pageY + event.touches[1].pageY) / 2;
                this.panEnd.copy(this.getMouseOnScreen(x, y));
                break;
        }
    }

    touchend(event: TouchEvent): void {
        if (this.enabled === false) return;

        switch (event.touches.length) {
            case 0:
                this._state = this.STATE.NONE;
                break;
            case 1:
                this._state = this.STATE.TOUCH_ROTATE;
                this.moveCurr.copy(this.getMouseOnCircle(event.touches[0].pageX, event.touches[0].pageY));
                this.movePrev.copy(this.moveCurr);
                break;
        }

        this.dispatchEvent(this.endEvent);
    }

    contextmenu(event: Event): void {
        event.preventDefault();
    }

    dispose() {
        this.domElement.removeEventListener('contextmenu', this.contextmenu, false);
        this.domElement.removeEventListener('mousedown', this.mousedown as EventListener, false);
        this.domElement.removeEventListener('wheel', this.mousewheel as EventListener, false);

        this.domElement.removeEventListener('touchstart', this.touchstart as EventListener, false);
        this.domElement.removeEventListener('touchend', this.touchend as EventListener, false);
        this.domElement.removeEventListener('touchmove', this.touchmove as EventListener, false);

        document.removeEventListener('mousemove', this.mousemove, false);
        document.removeEventListener('mouseup', this.mouseup, false);

        window.removeEventListener('keydown', this.keydown, false);
        window.removeEventListener('keyup', this.keyup, false);
    };
};

TrackballControls.prototype = Object.create(THREE.EventDispatcher.prototype);

export default TrackballControls;
