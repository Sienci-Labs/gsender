import store from 'app/store';
import gamepad from 'app/lib/gamepad';

export class JoystickLoop {
    constructor({ gamepadProfile, jog, axis, feedrate }) {
        this.isRunning = false;
        this.gamepadProfile = gamepadProfile;
        this.jog = jog;
        this.axis = axis;
        this.feedrate = feedrate;
    }

    _getCurrentGamepad = () => {
        const currentHandler = gamepad.handlers.find(handler => this.gamepadProfile.id.includes(handler?.gamepad?.id));

        return currentHandler?.gamepad;
    }

    _computeFeedrate = (stickValue) => {
        const feedrate = this.feedrate;

        return Math.round(Math.abs(feedrate * stickValue));
    };


    start = ({ axes }) => {
        if (this.isRunning) {
            return;
        }

        this.isRunning = true;

        const interval = store.get('workspace.temp.gamepad.incrementalAmount', 250);

        this.runLoop = setInterval(() => {
            const axesValues = this._getCurrentGamepad()?.axes;

            const thumbsticksAreIdle = axesValues?.every(axis => axis === 0);

            if (thumbsticksAreIdle) {
                this.stop();
                return;
            }

            this.jog({ ...axes, F: this._computeFeedrate(axesValues[this.axis]) });
        }, interval);
    }

    stop = () => {
        if (!this.isRunning) {
            return;
        }

        clearInterval(this.runLoop);
        this.isRunning = false;
    }
}
