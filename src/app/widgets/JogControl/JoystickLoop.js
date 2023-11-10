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

    constructor({ gamepadProfile, jog, standardJog, cancelJog, feedrate, multiplier }) {
        this.isRunning = false;
        this.gamepadProfile = gamepadProfile;
        this.jog = jog;
        this.standardJog = standardJog;
        this.cancelJog = throttle(cancelJog, 50, { leading: false, trailing: true });
        this.feedrate = feedrate;
        this.multiplier = multiplier;
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
        const givenFeedrate = this.feedrate;
        const { settings } = controller.settings;

        const maxFeedrate = Math.max(...[Number(settings.$110), Number(settings.$111), Number(settings.$112)]);

        const feedrate = givenFeedrate > maxFeedrate ? maxFeedrate : givenFeedrate;

        return Math.round(Math.abs(feedrate * (stickValue)));
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

        const executionTimeOfSingleCommand = 0.06;

        const incrementalDistance = feedrateInMMPerSec * executionTimeOfSingleCommand;

        return +(incrementalDistance.toFixed(2));
    };

    _runJog = ({ activeAxis }) => {
        const axes = this.axes;

        const timer = (new Date() - this.jogMovementStartTime);

        if (!this.isReadyForNextCommand) {
            return;
        }

        if (this.jogMovementStartTime && timer <= this.jogMovementDuration) {
            return;
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

        const { leftStick, rightStick } = this.multiplier;

        const multiplier = [leftStick, leftStick, rightStick, rightStick][activeAxis];
        const feedrate = this._computeFeedrate(multiplier);

        const axesData = activeAxis < 2 ? axesValues.slice(0, 2) : axesValues.slice(2, 4);

        const updatedAxes = axesData.reduce((acc, curr, index) => {
            const axesData = axes[index];

            if (!axesData) {
                return acc;
            }

            const [axis, axisValue] = Object.entries(axesData)[0];

            const feedrate = this._computeFeedrate(curr);

            acc[axis] = axisValue * this._computeIncrementalDistance({ axis, feedrate });

            return acc;
        }, {});

        const largestAxisMovement = Object.entries(updatedAxes).reduce((acc, [key, value]) => {
            const val = Math.abs(value);
            if (acc === null || val > acc?.value) {
                acc = {
                    axis: key,
                    value: val
                };
            }

            return acc;
        }, null);

        const updatedAxesMovementsAreZero = Object.values(updatedAxes).every((value) => value === 0);

        if (updatedAxesMovementsAreZero) {
            return;
        }

        if (feedrate === 0) {
            return;
        }

        this.jog({ ...updatedAxes, F: feedrate });

        this.jogMovementStartTime = new Date();

        this.jogMovementDuration = Math.abs(((largestAxisMovement.value) / (feedrate / 60)) * 1000);

        this.isReadyForNextCommand = false;
    }

    _axesArrayToObject = (arr) => {
        return arr.reduce((acc, curr) => {
            if (!curr) {
                return acc;
            }

            const [axis, axisValue] = Object.entries(curr)[0];

            acc[axis] = axisValue;

            return acc;
        }, {});
    }

    setOptions = ({ gamepadProfile, feedrate, axes, multiplier }) => {
        this.gamepadProfile = gamepadProfile;
        this.feedrate = feedrate;
        this.axes = axes;
        this.multiplier = multiplier;
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
            this._runJog({ activeAxis });

            this.runLoop = setInterval(() => {
                this._runJog({ activeAxis });
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
            const axes = this._axesArrayToObject(this.axes);
            this.jog(axes, true);
            this.isRunning = false;
            return;
        }

        this.cancelJog();

        this.isRunning = false;
        this.isListeningToController = false;
    }
}
