/* eslint-disable no-unused-vars */
import { throttle, inRange } from 'lodash';

import gamepad from 'app/lib/gamepad';
import controller from 'app/lib/controller';

export const checkThumbsticskAreIdle = (axes, profile) => {
    const deadZone = profile?.joystickOptions?.zeroThreshold && profile?.joystickOptions?.zeroThreshold / 100;

    if (!deadZone || deadZone === 0) {
        return axes?.every(axis => axis === 0);
    }

    return axes?.every(axis => inRange(axis, -deadZone, deadZone));
};

export class JoystickLoop {
    timeoutAmount = 600; // 600 ms to be consistent with jog controls

    startTime = 0;

    jogMovementDuration = null;

    jogMovementStartTime = null;

    currentJogDirection = null;

    constructor({ gamepadProfile, jog, standardJog, cancelJog, feedrate }) {
        this.isRunning = false;
        this.gamepadProfile = gamepadProfile;
        this.jog = jog;
        this.standardJog = standardJog;
        this.cancelJog = throttle(cancelJog, 50, { leading: false, trailing: true });
        this.feedrate = feedrate;
        this.isReadyForNextCommand = true;
    }

    _getCurrentGamepad = () => {
        const currentHandler = gamepad.handlers.find(handler => this.gamepadProfile.id.includes(handler?.gamepad?.id));

        return currentHandler?.gamepad;
    }

    _computeJogMoveDuration = (axis, feedrate) => {
        const v = Math.round(feedrate / 60); // Feedrate in mm/sec
        const N = 15; // Number of planner blocks

        const { settings } = controller.settings;

        const axisAcceleration = Number(
            {
                x: settings.$120,
                y: settings.$121,
                z: settings.$122,
                a: settings.$121,
            }[axis] ?? settings.$120
        );

        const T = (v ** 2 / (2 * axisAcceleration * (N - 1)));

        return T;
    }

    _computeFeedrate = (stickValue) => {
        const feedrate = this.feedrate;

        if (!stickValue) {
            return feedrate;
        }

        return Math.round(Math.abs(feedrate * stickValue));
    };

    _computeIncrementalDistance = ({ axis, feedrate: givenFeedrate }) => {
        const { settings } = controller.settings;

        const axisMaxFeedrate = Number(
            {
                x: settings.$110,
                y: settings.$111,
                z: settings.$112,
                a: settings.$111,
            }[axis] ?? settings.$110
        );

        const feedrate = givenFeedrate > axisMaxFeedrate ? axisMaxFeedrate : givenFeedrate;

        const feedrateInMMPerSec = Math.round(feedrate / 60);

        const executionTimeOfSingleCommand = 0.25;

        const incrementalDistance = feedrateInMMPerSec * executionTimeOfSingleCommand;

        return +(incrementalDistance.toFixed(2));

        // const v = Math.round(feedrate / 60); // Feedrate in mm/sec
        // const N = 15;

        // const { settings } = controller.settings;

        // const axisAcceleration = Number(
        //     {
        //         x: settings.$110,
        //         y: settings.$111,
        //         z: settings.$112,
        //         a: settings.$111,
        //     }[axis] ?? settings.$110
        // );

        // const a = (axisAcceleration / 60) ** 2;

        // const dt = ((v ** 2) / (2 * a * (N - 1)));

        // console.log(dt);

        // const s = v * (dt * 2);

        // return +(s.toFixed(2));
    };

    _runJog = ({ axes, activeAxis }) => {
        if (!axes) {
            return;
        }

        const timer = new Date() - this.jogMovementStartTime;
        const nextJogDirection = Object.keys(axes).join();

        if (!this.isReadyForNextCommand) {
            return;
        }

        if (this.jogMovementStartTime && timer <= this.jogMovementDuration) {
            return;
        }

        if (this.currentJogDirection !== nextJogDirection) {
            this.cancelJog();
        }

        const currentGamepad = this._getCurrentGamepad();

        const axesValues = currentGamepad?.axes;

        const lockoutButton = this.gamepadProfile.lockout.button;
        const isHoldingLockoutButton = currentGamepad.buttons?.[lockoutButton]?.pressed;

        const thumbsticksAreIdle = checkThumbsticskAreIdle(axesValues, this.gamepadProfile);

        if (thumbsticksAreIdle || ((lockoutButton === 0 || lockoutButton) && !isHoldingLockoutButton)) {
            this.stop();
            return;
        }

        const feedrate = this._computeFeedrate(axesValues[activeAxis]);

        const updatedAxis = Object.entries(axes).reduce((acc, [key, value]) => {
            acc[key] = value * this._computeIncrementalDistance({ axis: key, feedrate });

            return acc;
        }, {});

        this.jog({ ...updatedAxis, F: feedrate });

        const largestAxisMovement = Object.entries(updatedAxis).reduce((acc, [key, value]) => {
            if (!acc || value > acc?.value) {
                acc = {
                    axis: key,
                    value
                };
            }

            return acc;
        }, null);

        this.currentJogDirection = nextJogDirection;

        this.jogMovementStartTime = new Date();

        this.jogMovementDuration = Math.abs((largestAxisMovement.value / (feedrate / 60)) * 1000);

        this.isReadyForNextCommand = false;
    }

    setOptions = ({ gamepadProfile, feedrate, axes }) => {
        this.gamepadProfile = gamepadProfile;
        this.feedrate = feedrate;
        this.axes = axes;
    }

    start = (activeAxis) => {
        if (this.isRunning) {
            return;
        }

        this.isListeningToController = true;

        controller.addListener('serialport:read', (data) => {
            if (data === 'ok') {
                this.isReadyForNextCommand = true;
            }
        });

        this.isRunning = true;
        this.startTime = new Date();

        const INTERVAL_IN_MS = 0;

        this.timeout = setTimeout(() => {
            this._runJog({ axes: this.axes, activeAxis });

            this.runLoop = setInterval(() => {
                this._runJog({ axes: this.axes, activeAxis });
            }, INTERVAL_IN_MS);
        }, this.timeoutAmount);
    }

    stop = () => {
        if (!this.isRunning) {
            return;
        }

        clearInterval(this.runLoop);
        clearTimeout(this.timeout);
        controller.removeListener('serialport:read');

        const timer = new Date() - this.startTime;

        if (timer < this.timeoutAmount) {
            this.jog(this.axes, true);
            this.isRunning = false;
            return;
        }

        this.cancelJog();

        this.isRunning = false;
        this.isListeningToController = false;
    }
}
