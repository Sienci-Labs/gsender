import inRange from 'lodash/inRange';
import get from 'lodash/get';

import controller from 'app/lib/controller';

// Helper to check if an action is an override action
export const isOverrideAction = (action) => {
    if (!action) return false;
    return action.startsWith('feed') || action.startsWith('spindle');
};

export const checkThumbstickIsIdle = (axisValue, deadZone) => {
    if (!deadZone || deadZone === 0) {
        return axisValue === 0;
    }
    return inRange(axisValue, -deadZone, deadZone);
};

const OVERRIDE_COMMANDS = {
    feed: {
        majorIncrease: String.fromCharCode(0x91),
        majorDecrease: String.fromCharCode(0x92),
        minorIncrease: String.fromCharCode(0x93),
        minorDecrease: String.fromCharCode(0x94),
    },
    spindle: {
        majorIncrease: String.fromCharCode(0x9A),
        majorDecrease: String.fromCharCode(0x9B),
        minorIncrease: String.fromCharCode(0x9C),
        minorDecrease: String.fromCharCode(0x9D),
    },
};

const REPEAT_INTERVAL_MS = 500;
const COOLDOWN_MS = 400;

// Module-level timestamp shared across ALL instances to prevent duplicate
// commands from stacked event listeners or rapid instance recreation.
let lastOverrideCommandTime = 0;

export class OverrideLoop {
    constructor({ gamepadProfile }) {
        this.isRunning = false;
        this.gamepadProfile = gamepadProfile;
        this.activeAction = null;
        this.activeDirection = 0;
        this.activeAxis = null;
        this.timeoutId = null;
    }

    _getCurrentGamepad = () => {
        // Read fresh gamepad state from the browser API
        const gamepads = navigator.getGamepads();
        if (!gamepads) return null;

        return Array.from(gamepads).find(
            (gp) => gp && this.gamepadProfile.id.includes(gp.id),
        ) || null;
    };

    _getCommand = () => {
        const isFeed = this.activeAction.startsWith('feed');
        const isMajor = this.activeAction.includes('++');
        const isIncrease = this.activeDirection > 0;

        const type = isFeed ? 'feed' : 'spindle';
        const size = isMajor ? 'major' : 'minor';
        const dir = isIncrease ? 'Increase' : 'Decrease';

        return OVERRIDE_COMMANDS[type][size + dir];
    };

    _scheduleNext = () => {
        this.timeoutId = setTimeout(() => {
            if (!this._checkIfStillActive()) {
                return;
            }

            lastOverrideCommandTime = Date.now();
            controller.write(this._getCommand());
            this._scheduleNext();
        }, REPEAT_INTERVAL_MS);
    };

    _checkIfStillActive = () => {
        const currentGamepad = this._getCurrentGamepad();
        if (!currentGamepad) {
            this.stop();
            return false;
        }

        const deadZone =
            (this.gamepadProfile?.joystickOptions?.zeroThreshold || 30) / 100;

        const axisValue = currentGamepad.axes[this.activeAxis];
        if (checkThumbstickIsIdle(axisValue, deadZone)) {
            this.stop();
            return false;
        }

        // Check lockout button
        const lockoutButton = get(this.gamepadProfile, 'lockout.button');
        if (lockoutButton !== null && lockoutButton !== undefined) {
            const isHoldingLockoutButton = get(
                currentGamepad.buttons,
                `${lockoutButton}.pressed`,
                false,
            );
            if (!isHoldingLockoutButton) {
                this.stop();
                return false;
            }
        }

        return true;
    };

    canStart = () => {
        return Date.now() - lastOverrideCommandTime >= COOLDOWN_MS;
    };

    setOptions = ({ gamepadProfile, action, direction, activeAxis }) => {
        this.gamepadProfile = gamepadProfile;
        this.activeAction = action;
        this.activeDirection = direction;
        this.activeAxis = activeAxis;
    };

    start = () => {
        if (this.isRunning) {
            return;
        }

        this.isRunning = true;
        lastOverrideCommandTime = Date.now();
        controller.write(this._getCommand());
        this._scheduleNext();
    };

    stop = () => {
        if (!this.isRunning) {
            return;
        }

        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }

        this.isRunning = false;
        this.activeAction = null;
        this.activeDirection = 0;
        this.activeAxis = null;
    };
}
