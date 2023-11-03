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

    _computeFeedrate = (stickValue) => {
        const feedrate = this.feedrate;

        if (!stickValue) {
            return feedrate;
        }

        return Math.round(Math.abs(feedrate * stickValue));
    };

    _computeIncrementalDistance = ({ feedrate }) => {
        const feedrateInMMPerSec = Math.round(feedrate / 60);

        const executionTimeOfSingleCommand = 0.25;

        return +((feedrateInMMPerSec * executionTimeOfSingleCommand).toFixed(2));
    };

    _runJog = ({ axes, activeAxis }) => {
        if (!axes) {
            return;
        }

        if (!this.isReadyForNextCommand) {
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

        const feedrate = this._computeFeedrate(axesValues[activeAxis]);

        const updatedAxis = Object.entries(axes).reduce((acc, [key, value]) => {
            acc[key] = value * this._computeIncrementalDistance({ feedrate });

            return acc;
        }, {});

        this.jog({ ...updatedAxis, F: this._computeFeedrate(axesValues[activeAxis]) });

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

        const INTERVAL_IN_MS = 210;

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
