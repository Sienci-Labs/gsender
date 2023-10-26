import gamepad from 'app/lib/gamepad';

export class JoystickLoop {
    constructor({ gamepadProfile, jog, feedrate }) {
        this.isRunning = false;
        this.gamepadProfile = gamepadProfile;
        this.jog = jog;
        this.feedrate = feedrate;
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

    update = ({ gamepadProfile, feedrate }) => {
        this.gamepadProfile = gamepadProfile;
        this.feedrate = feedrate;
    }

    start = ({ axes }, activeAxis) => {
        if (this.isRunning) {
            return;
        }

        this.isRunning = true;

        const INTERVAL_IN_MS = 200;

        this._runJog({ axes, activeAxis });

        this.runLoop = setInterval(() => this._runJog({ axes, activeAxis }), INTERVAL_IN_MS);
    }

    _runJog = ({ axes, activeAxis }) => {
        const axesValues = this._getCurrentGamepad()?.axes;

        const thumbsticksAreIdle = axesValues?.every(axis => axis === 0);

        if (thumbsticksAreIdle) {
            this.stop();
            return;
        }

        const feedrate = this._computeFeedrate(axesValues[activeAxis]);

        const updatedAxis = Object.entries(axes).reduce((acc, [key, value]) => {
            acc[key] = value * this._computeIncrementalDistance({ feedrate });

            return acc;
        }, {});

        this.jog({ ...updatedAxis, F: this._computeFeedrate(axesValues[activeAxis]) });
    }

    stop = () => {
        if (!this.isRunning) {
            return;
        }

        clearInterval(this.runLoop);
        this.isRunning = false;
    }
}
