/* eslint-disable no-unused-vars */
import { throttle, inRange } from 'lodash';

import gamepad, { checkButtonHold } from 'app/lib/gamepad';
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

        const { joystickOptions: { movementDistanceOverride = 100 } } = this.gamepadProfile;

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

        const COMMAND_EXECUTION_TIME_IN_SECONDS = 0.06;

        const incrementalDistance = (feedrateInMMPerSec * COMMAND_EXECUTION_TIME_IN_SECONDS) * (movementDistanceOverride / 100);

        return +(incrementalDistance.toFixed(2));
    };

    _getAxesAndDirection = ({ degrees, activeAxis }) => {
        const { joystickOptions } = this.gamepadProfile;

        const activeStick = ['stick1', 'stick1', 'stick2', 'stick2'][activeAxis];

        const { horizontal, vertical } = joystickOptions[activeStick];


        const getDirection = (isReversed) => (!isReversed ? 1 : -1);

        const MOVEMENT_DISTANCE = 1;

        const isHoldingModifierButton = checkButtonHold('modifier', this.gamepadProfile);

        const actionType = !isHoldingModifierButton ? 'primaryAction' : 'secondaryAction';

        const stickX = {
            axis: horizontal[actionType],
            positiveDirection: MOVEMENT_DISTANCE * getDirection(horizontal.isReversed),
            negativeDirection: MOVEMENT_DISTANCE * getDirection(!horizontal.isReversed),
        };

        const stickY = {
            axis: vertical[actionType],
            positiveDirection: MOVEMENT_DISTANCE * getDirection(vertical.isReversed),
            negativeDirection: MOVEMENT_DISTANCE * getDirection(!vertical.isReversed)
        };

        // X-axis Positive
        if (inRange(degrees, 0, 15) || inRange(degrees, 345, 360)) {
            return [
                stickX.axis ? { [stickX.axis]: stickX.positiveDirection } : null
            ];
        }

        // Top Right
        if (inRange(degrees, 16, 74)) {
            return [
                stickX.axis ? { [stickX.axis]: stickX.positiveDirection } : null,
                stickY.axis ? { [stickY.axis]: stickY.positiveDirection } : null,
            ];
        }

        // Y-axis Positive
        if (inRange(degrees, 75, 105)) {
            return [
                null,
                stickY.axis ? { [stickY.axis]: stickY.positiveDirection } : null
            ];
        }

        // Top Left
        if (inRange(degrees, 106, 164)) {
            return [
                stickX.axis ? { [stickX.axis]: stickX.negativeDirection } : null,
                stickY.axis ? { [stickY.axis]: stickY.positiveDirection } : null,
            ];
        }

        // X-axis Negative
        if (inRange(degrees, 165, 195)) {
            return [
                stickX.axis ? { [stickX.axis]: stickX.negativeDirection } : null,
            ];
        }

        // Bottom Left
        if (inRange(degrees, 196, 254)) {
            return [
                stickX.axis ? { [stickX.axis]: stickX.negativeDirection } : null,
                stickY.axis ? { [stickY.axis]: stickY.negativeDirection } : null,
            ];
        }

        // Y-axis Negative
        if (inRange(degrees, 255, 285)) {
            return [
                null,
                stickY.axis ? { [stickY.axis]: stickY.negativeDirection } : null
            ];
        }

        // Bottom Right
        if (inRange(degrees, 286, 344)) {
            return [
                stickX.axis ? { [stickX.axis]: stickX.positiveDirection } : null,
                stickY.axis ? { [stickY.axis]: stickY.negativeDirection } : null,
            ];
        }

        return [];
    }

    _runJog = () => {
        const { degrees, activeAxis, multiplier: { leftStick, rightStick } } = this;

        const axes = this._getAxesAndDirection({ degrees, activeAxis });

        const numberOfAxes = axes.reduce((acc, curr) => (curr !== null ? acc + 1 : acc), 0);

        const timer = (new Date() - this.jogMovementStartTime);

        if (!this.isReadyForNextCommand) {
            return;
        }

        if (this.jogMovementStartTime && timer <= this.jogMovementDuration) {
            return;
        }

        const currentGamepad = this._getCurrentGamepad();

        const axesValues = currentGamepad?.axes;

        const movementDistanceOverride = this.gamepadProfile.joystickOptions.movementDistanceOverride;
        const lockoutButton = this.gamepadProfile.lockout.button;
        const isHoldingLockoutButton = currentGamepad.buttons?.[lockoutButton]?.pressed;

        const thumbsticksAreIdle = checkThumbsticskAreIdle(axesValues, this.gamepadProfile);

        if (thumbsticksAreIdle || ((lockoutButton === 0 || lockoutButton) && !isHoldingLockoutButton)) {
            this.stop();
            return;
        }

        const multiplier = [leftStick, leftStick, rightStick, rightStick][activeAxis];
        const axesData = activeAxis < 2 ? axesValues.slice(0, 2) : axesValues.slice(2, 4);

        const feedrate = this._computeFeedrate(numberOfAxes === 1 ? Math.max(...axesData.map(item => Math.abs(item))) : multiplier);

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

        const updatedAxesWithOverride = Object.entries(updatedAxes).reduce((acc, curr) => {
            const [axis, value] = curr;

            acc[axis] = +((value * (movementDistanceOverride / 100)).toFixed(3));

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

        this.jog({ ...updatedAxesWithOverride, F: feedrate });

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

    setOptions = ({ gamepadProfile, feedrate, axes, multiplier, degrees, activeAxis }) => {
        this.gamepadProfile = gamepadProfile;
        this.feedrate = feedrate;
        this.axes = axes;
        this.multiplier = multiplier;
        this.degrees = degrees;
        this.activeAxis = activeAxis;
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
            if (this.axes.every(item => item === null)) {
                this.isRunning = false;
                return;
            }

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
