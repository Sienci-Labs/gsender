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

const TrackballControls = function (object, domElement) {
    var _this = this;
    var STATE = {
        NONE: -1,
        ROTATE: 0,
        ZOOM: 1,
        PAN: 2,
        TOUCH_ROTATE: 3,
        TOUCH_ZOOM_PAN: 4,
    };

    this.object = object;
    this.domElement = domElement !== undefined ? domElement : document;

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

    // https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
    //
    // A number representing a given button:
    // 0: Main button pressed, usually the left button or the un-initialized state
    // 1: Auxiliary button pressed, usually the wheel button or the middle button (if present)
    // 2: Secondary button pressed, usually the right button
    // 3: Fourth button, typically the Browser Back button
    // 4: Fifth button, typically the Browser Forward button
    this.mouseButtonState = [
        STATE.NONE, // 0
        STATE.NONE, // 1
        STATE.NONE, // 2
        STATE.NONE, // 3
        STATE.NONE, // 4
    ];

    // internals

    this.target = new THREE.Vector3();

    var EPS = 0.000001;

    var lastPosition = new THREE.Vector3();

    var _state = STATE.NONE,
        _prevState = STATE.NONE,
        _eye = new THREE.Vector3(),
        _movePrev = new THREE.Vector2(),
        _moveCurr = new THREE.Vector2(),
        _lastAxis = new THREE.Vector3(),
        _lastAngle = 0,
        _zoomStart = new THREE.Vector2(),
        _zoomEnd = new THREE.Vector2(),
        _touchZoomDistanceStart = 0,
        _touchZoomDistanceEnd = 0,
        _panStart = new THREE.Vector2(),
        _panEnd = new THREE.Vector2();

    // for reset

    this.target0 = this.target.clone();
    this.position0 = this.object.position.clone();
    this.up0 = this.object.up.clone();

    // events

    var changeEvent = { type: 'change' };
    var startEvent = { type: 'start' };
    var endEvent = { type: 'end' };

    // methods

    this.setMouseButtonState = function (button, state) {
        if (this.mouseButtonState[button] === undefined) {
            return;
        }
        if (state < STATE.NONE || state > STATE.TOUCH_ZOOM_PAN) {
            return;
        }

        this.mouseButtonState[button] = state;
    };

    this.getMouseButtonState = function (button) {
        var buttonState = this.mouseButtonState[button];

        if (buttonState === undefined) {
            return STATE.NONE;
        }

        return buttonState;
    };

    this.handleResize = function () {
        if (this.domElement === document) {
            this.screen.left = 0;
            this.screen.top = 0;
            this.screen.width = window.innerWidth;
            this.screen.height = window.innerHeight;
        } else {
            var box = this.domElement.getBoundingClientRect();
            // adjustments come from similar code in the jquery offset() function
            var d = this.domElement.ownerDocument.documentElement;
            this.screen.left = box.left + window.pageXOffset - d.clientLeft;
            this.screen.top = box.top + window.pageYOffset - d.clientTop;
            this.screen.width = box.width;
            this.screen.height = box.height;
        }
    };

    var getMouseOnScreen = (function () {
        var vector = new THREE.Vector2();

        return function getMouseOnScreen(pageX, pageY) {
            vector.set(
                (pageX - _this.screen.left) / _this.screen.width,
                (pageY - _this.screen.top) / _this.screen.height,
            );

            return vector;
        };
    })();

    var getMouseOnCircle = (function () {
        var vector = new THREE.Vector2();

        return function getMouseOnCircle(pageX, pageY) {
            vector.set(
                (pageX - _this.screen.width * 0.5 - _this.screen.left) /
                    (_this.screen.width * 0.5),
                (_this.screen.height + 2 * (_this.screen.top - pageY)) /
                    _this.screen.width, // screen.width intentional
            );

            return vector;
        };
    })();

    this.rotateCamera = (function () {
        var axis = new THREE.Vector3(),
            quaternion = new THREE.Quaternion(),
            eyeDirection = new THREE.Vector3(),
            objectUpDirection = new THREE.Vector3(),
            objectSidewaysDirection = new THREE.Vector3(),
            moveDirection = new THREE.Vector3(),
            angle;

        return function rotateCamera() {
            moveDirection.set(
                _moveCurr.x - _movePrev.x,
                _moveCurr.y - _movePrev.y,
                0,
            );
            angle = moveDirection.length();

            if (angle) {
                _eye.copy(_this.object.position).sub(_this.target);

                eyeDirection.copy(_eye).normalize();
                objectUpDirection.copy(_this.object.up).normalize();
                objectSidewaysDirection
                    .crossVectors(objectUpDirection, eyeDirection)
                    .normalize();

                objectUpDirection.setLength(_moveCurr.y - _movePrev.y);
                objectSidewaysDirection.setLength(_moveCurr.x - _movePrev.x);

                moveDirection.copy(
                    objectUpDirection.add(objectSidewaysDirection),
                );

                axis.crossVectors(moveDirection, _eye).normalize();

                angle *= _this.rotateSpeed;
                quaternion.setFromAxisAngle(axis, angle);

                _eye.applyQuaternion(quaternion);
                _this.object.up.applyQuaternion(quaternion);

                _lastAxis.copy(axis);
                _lastAngle = angle;
            } else if (!_this.staticMoving && _lastAngle) {
                _lastAngle *= Math.sqrt(1.0 - _this.dynamicDampingFactor);
                _eye.copy(_this.object.position).sub(_this.target);
                quaternion.setFromAxisAngle(_lastAxis, _lastAngle);
                _eye.applyQuaternion(quaternion);
                _this.object.up.applyQuaternion(quaternion);
            }

            _movePrev.copy(_moveCurr);
        };
    })();

    this.zoomIn = function (delta) {
        if (!delta) {
            return;
        }

        if (_this.object.inOrthographicMode) {
            const factor = 1.0 + delta * _this.zoomSpeed;
            const zoom = _this.object.zoom * factor;
            if (zoom > 0.1) {
                _this.object.setZoom(zoom);
            } else {
                _this.object.setZoom(0.1);
            }
        } else {
            const factor = 1.0 - delta * _this.zoomSpeed;
            _eye.subVectors(_this.object.position, _this.target);
            _eye.multiplyScalar(factor);
            _this.object.position.addVectors(_this.target, _eye);
            _this.checkDistances();
            _this.object.lookAt(_this.target);
            if (lastPosition.distanceToSquared(_this.object.position) > EPS) {
                _this.dispatchEvent(changeEvent);
                lastPosition.copy(_this.object.position);
            }
        }
    };

    this.zoomOut = function (delta) {
        if (!delta) {
            return;
        }

        if (_this.object.inOrthographicMode) {
            const factor = 1.0 - delta * _this.zoomSpeed;
            const zoom = _this.object.zoom * factor;
            if (zoom > 0.1) {
                _this.object.setZoom(zoom);
            } else {
                _this.object.setZoom(0.1);
            }
        } else {
            const factor = 1.0 + delta * _this.zoomSpeed;
            _eye.subVectors(_this.object.position, _this.target);
            _eye.multiplyScalar(factor);
            _this.object.position.addVectors(_this.target, _eye);
            _this.checkDistances();
            _this.object.lookAt(_this.target);
            if (lastPosition.distanceToSquared(_this.object.position) > EPS) {
                _this.dispatchEvent(changeEvent);
                lastPosition.copy(_this.object.position);
            }
        }
    };

    this.zoomCamera = function () {
        var factor;

        if (_state === STATE.TOUCH_ZOOM_PAN) {
            factor = _touchZoomDistanceStart / _touchZoomDistanceEnd;
        } else {
            factor = 1.0 + (_zoomEnd.y - _zoomStart.y) * _this.zoomSpeed;
        }

        if (factor !== 1.0 && factor > 0.0) {
            if (_this.object.inOrthographicMode) {
                // See https://github.com/mrdoob/three.js/issues/1521
                var zoom = _this.object.zoom * (2 - factor);
                _this.object.setZoom(zoom);
            } else {
                _eye.multiplyScalar(factor);
            }
        }

        if (_this.staticMoving) {
            _zoomStart.copy(_zoomEnd);
            _touchZoomDistanceStart = _touchZoomDistanceEnd;
        } else {
            _zoomStart.y +=
                (_zoomEnd.y - _zoomStart.y) * this.dynamicDampingFactor;
        }
    };

    this.panCamera = (function () {
        var mouseChange = new THREE.Vector2(),
            objectUp = new THREE.Vector3(),
            pan = new THREE.Vector3();

        return function panCamera() {
            mouseChange.copy(_panEnd).sub(_panStart);

            if (mouseChange.lengthSq()) {
                mouseChange.multiplyScalar(_eye.length() * _this.panSpeed);

                pan.copy(_eye).cross(_this.object.up).setLength(mouseChange.x);
                pan.add(
                    objectUp.copy(_this.object.up).setLength(mouseChange.y),
                );

                _this.object.position.add(pan);
                _this.target.add(pan);

                if (_this.staticMoving) {
                    _panStart.copy(_panEnd);
                } else {
                    _panStart.add(
                        mouseChange
                            .subVectors(_panEnd, _panStart)
                            .multiplyScalar(_this.dynamicDampingFactor),
                    );
                }
            }
        };
    })();

    this.checkDistances = function () {
        if (!_this.noZoom || !_this.noPan) {
            if (_eye.lengthSq() > _this.maxDistance * _this.maxDistance) {
                _this.object.position.addVectors(
                    _this.target,
                    _eye.setLength(_this.maxDistance),
                );
                _zoomStart.copy(_zoomEnd);
            }

            if (_eye.lengthSq() < _this.minDistance * _this.minDistance) {
                _this.object.position.addVectors(
                    _this.target,
                    _eye.setLength(_this.minDistance),
                );
                _zoomStart.copy(_zoomEnd);
            }
        }
    };

    this.update = function () {
        _eye.subVectors(_this.object.position, _this.target);

        if (!_this.noRotate) {
            _this.rotateCamera();
        }

        if (!_this.noZoom) {
            _this.zoomCamera();
        }

        if (!_this.noPan) {
            _this.panCamera();
        }

        _this.object.position.addVectors(_this.target, _eye);

        _this.checkDistances();

        _this.object.lookAt(_this.target);

        if (lastPosition.distanceToSquared(_this.object.position) > EPS) {
            _this.dispatchEvent(changeEvent);

            lastPosition.copy(_this.object.position);
        }
    };

    this.reset = function () {
        _state = STATE.NONE;
        _prevState = STATE.NONE;

        _this.target.copy(_this.target0);
        _this.object.position.copy(_this.position0);
        _this.object.up.copy(_this.up0);

        _eye.subVectors(_this.object.position, _this.target);

        _this.object.lookAt(_this.target);

        _this.dispatchEvent(changeEvent);

        lastPosition.copy(_this.object.position);
    };

    // listeners

    function keydown(event) {
        if (_this.enabled === false) return;

        window.removeEventListener('keydown', keydown);

        _prevState = _state;

        if (_state !== STATE.NONE) {
            return;
        } else if (
            event.keyCode === _this.keys[STATE.ROTATE] &&
            !_this.noRotate
        ) {
            _state = STATE.ROTATE;
        } else if (event.keyCode === _this.keys[STATE.ZOOM] && !_this.noZoom) {
            _state = STATE.ZOOM;
        } else if (event.keyCode === _this.keys[STATE.PAN] && !_this.noPan) {
            _state = STATE.PAN;
        }
    }

    function keyup(event) {
        if (_this.enabled === false) return;

        _state = _prevState;

        window.addEventListener('keydown', keydown, false);
    }

    function mousedown(event) {
        if (_this.enabled === false) return;

        event.preventDefault();
        event.stopPropagation();

        if (event.button === 4 || event.button === 5) return;

        if (_state === STATE.NONE) {
            var buttonState = _this.getMouseButtonState(event.button);
            _state = buttonState === STATE.NONE ? event.button : buttonState;
        }

        if (_state === STATE.ROTATE && !_this.noRotate) {
            _moveCurr.copy(getMouseOnCircle(event.pageX, event.pageY));
            _movePrev.copy(_moveCurr);
        } else if (_state === STATE.ZOOM && !_this.noZoom) {
            _zoomStart.copy(getMouseOnScreen(event.pageX, event.pageY));
            _zoomEnd.copy(_zoomStart);
        } else if (_state === STATE.PAN && !_this.noPan) {
            _panStart.copy(getMouseOnScreen(event.pageX, event.pageY));
            _panEnd.copy(_panStart);
        }

        document.addEventListener('mousemove', mousemove, false);
        document.addEventListener('mouseup', mouseup, false);

        _this.dispatchEvent(startEvent);
    }

    function mousemove(event) {
        if (_this.enabled === false) return;

        event.preventDefault();
        event.stopPropagation();

        if (_state === STATE.ROTATE && !_this.noRotate) {
            _movePrev.copy(_moveCurr);
            _moveCurr.copy(getMouseOnCircle(event.pageX, event.pageY));
        } else if (_state === STATE.ZOOM && !_this.noZoom) {
            _zoomEnd.copy(getMouseOnScreen(event.pageX, event.pageY));
        } else if (_state === STATE.PAN && !_this.noPan) {
            _panEnd.copy(getMouseOnScreen(event.pageX, event.pageY));
        }
    }

    function mouseup(event) {
        if (_this.enabled === false) return;

        event.preventDefault();
        event.stopPropagation();

        _state = STATE.NONE;

        document.removeEventListener('mousemove', mousemove);
        document.removeEventListener('mouseup', mouseup);
        _this.dispatchEvent(endEvent);
    }

    function mousewheel(event) {
        if (_this.enabled === false) return;

        event.preventDefault();
        event.stopPropagation();

        switch (event.deltaMode) {
            case 2:
                // Zoom in pages
                _zoomStart.y -= event.deltaY * 0.025;
                break;

            case 1:
                // Zoom in lines
                _zoomStart.y -= event.deltaY * 0.01;
                break;

            default:
                // undefined, 0, assume pixels
                _zoomStart.y -= event.deltaY * 0.00025;
                break;
        }

        _this.dispatchEvent(startEvent);
        _this.dispatchEvent(endEvent);
    }

    function touchstart(event) {
        if (_this.enabled === false) return;

        event.preventDefault();

        switch (event.touches.length) {
            case 1:
                _state = STATE.TOUCH_ROTATE;
                _moveCurr.copy(
                    getMouseOnCircle(
                        event.touches[0].pageX,
                        event.touches[0].pageY,
                    ),
                );
                _movePrev.copy(_moveCurr);
                break;

            default: // 2 or more
                _state = STATE.TOUCH_ZOOM_PAN;
                var dx = event.touches[0].pageX - event.touches[1].pageX;
                var dy = event.touches[0].pageY - event.touches[1].pageY;
                _touchZoomDistanceEnd = _touchZoomDistanceStart = Math.sqrt(
                    dx * dx + dy * dy,
                );

                var x = (event.touches[0].pageX + event.touches[1].pageX) / 2;
                var y = (event.touches[0].pageY + event.touches[1].pageY) / 2;
                _panStart.copy(getMouseOnScreen(x, y));
                _panEnd.copy(_panStart);
                _zoomStart.copy(getMouseOnScreen(x, y));
                break;
        }

        _this.dispatchEvent(startEvent);
    }

    function touchmove(event) {
        if (_this.enabled === false) return;

        event.preventDefault();
        event.stopPropagation();

        switch (event.touches.length) {
            case 1:
                _movePrev.copy(_moveCurr);
                _moveCurr.copy(
                    getMouseOnCircle(
                        event.touches[0].pageX,
                        event.touches[0].pageY,
                    ),
                );
                break;

            default: // 2 or more
                var dx = event.touches[0].pageX - event.touches[1].pageX;
                var dy = event.touches[0].pageY - event.touches[1].pageY;
                _touchZoomDistanceEnd = Math.sqrt(dx * dx + dy * dy);

                var x = (event.touches[0].pageX + event.touches[1].pageX) / 2;
                var y = (event.touches[0].pageY + event.touches[1].pageY) / 2;
                _panEnd.copy(getMouseOnScreen(x, y));
                _zoomEnd.copy(getMouseOnCircle(x, y));
                break;
        }
    }

    function touchend(event) {
        if (_this.enabled === false) return;

        switch (event.touches.length) {
            case 0:
                _state = STATE.NONE;
                break;

            case 1:
                _state = STATE.TOUCH_ROTATE;
                _moveCurr.copy(
                    getMouseOnCircle(
                        event.touches[0].pageX,
                        event.touches[0].pageY,
                    ),
                );
                _movePrev.copy(_moveCurr);
                break;
        }

        _this.dispatchEvent(endEvent);
    }

    function contextmenu(event) {
        event.preventDefault();
    }

    this.dispose = function () {
        this.domElement.removeEventListener('contextmenu', contextmenu, false);
        this.domElement.removeEventListener('mousedown', mousedown, false);
        this.domElement.removeEventListener('wheel', mousewheel, false);

        this.domElement.removeEventListener('touchstart', touchstart, false);
        this.domElement.removeEventListener('touchend', touchend, false);
        this.domElement.removeEventListener('touchmove', touchmove, false);

        document.removeEventListener('mousemove', mousemove, false);
        document.removeEventListener('mouseup', mouseup, false);

        window.removeEventListener('keydown', keydown, false);
        window.removeEventListener('keyup', keyup, false);
    };

    this.domElement.addEventListener('contextmenu', contextmenu, false);
    this.domElement.addEventListener('mousedown', mousedown, false);
    this.domElement.addEventListener('wheel', mousewheel, false);

    this.domElement.addEventListener('touchstart', touchstart, false);
    this.domElement.addEventListener('touchend', touchend, false);
    this.domElement.addEventListener('touchmove', touchmove, false);

    window.addEventListener('keydown', keydown, false);
    window.addEventListener('keyup', keyup, false);

    this.handleResize();

    // force an update at start
    this.update();
};

TrackballControls.prototype = Object.create(THREE.EventDispatcher.prototype);
TrackballControls.prototype.constructor = TrackballControls;

export default TrackballControls;
