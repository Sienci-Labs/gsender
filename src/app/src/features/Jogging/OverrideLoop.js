import inRange from 'lodash/inRange';
import get from 'lodash/get';

import gamepad from 'app/lib/gamepad';
import controller from 'app/lib/controller';
import reduxStore from 'app/store/redux';

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

export class OverrideLoop {
    constructor({ gamepadProfile }) {
        this.isRunning = false;
        this.gamepadProfile = gamepadProfile;
        this.activeAction = null; // e.g., 'feed+/-', 'feed++/--', 'spindle+/-', etc.
        this.activeDirection = 0; // 1 for increase, -1 for decrease (from joystick)
        this.activeAxis = null; // which gamepad axis triggered this
        this.intervalId = null;
        this.lastCommandTime = 0; // Timestamp of last command sent
    }

    _getCurrentGamepad = () => {
        const gamepadInstance = gamepad.getInstance();
        const currentHandler = gamepadInstance.handlers.find((handler) =>
            this.gamepadProfile.id.includes(handler?.gamepad?.id),
        );
        return currentHandler?.gamepad || null;
    };

    _sendOverrideCommand = () => {
        if (!this.activeAction || !this.activeDirection) {
            return;
        }

        // Debounce: only send command if 500ms has passed since last command
        const now = Date.now();
        if (now - this.lastCommandTime < 500) {
            return;
        }
        this.lastCommandTime = now;

        // Parse the action string to determine type and increment
        // Actions: feed+/-, feed++/--, spindle+/-, spindle++/--
        const isFeed = this.activeAction.startsWith('feed');
        const isMajor = this.activeAction.includes('++');

        const increment = isMajor ? 10 : 1;

        // Get current override values from controller state
        const state = reduxStore.getState();
        const ov = get(state, 'controller.state.status.ov', [100, 100, 100]);

        // ov[0] = feed override, ov[2] = spindle override
        const currentValue = isFeed ? ov[0] : ov[2];

        // Calculate new target value (direction comes from joystick input)
        const change = increment * this.activeDirection;
        let newValue = currentValue + change;

        // Clamp values to valid range (10-200 for feed, 10-230 for spindle)
        if (isFeed) {
            newValue = Math.max(10, Math.min(200, newValue));
        } else {
            newValue = Math.max(10, Math.min(230, newValue));
        }

        // Use the proper controller command
        const commandName = isFeed ? 'feedOverride' : 'spindleOverride';

        controller.command(commandName, newValue);
    };

    _checkIfStillActive = () => {
        const currentGamepad = this._getCurrentGamepad();
        if (!currentGamepad) {
            this.stop();
            return false;
        }

        const deadZone =
            (this.gamepadProfile?.joystickOptions?.zeroThreshold || 30) / 100;

        // Check if the active axis is still outside the dead zone
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

    _runLoop = () => {
        if (!this._checkIfStillActive()) {
            return;
        }

        this._sendOverrideCommand();
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

        // Send first command immediately
        this._sendOverrideCommand();

        // Then repeat every 500ms while held
        this.intervalId = setInterval(() => {
            this._runLoop();
        }, 500);
    };

    stop = () => {
        if (!this.isRunning) {
            return;
        }

        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        this.isRunning = false;
        this.activeAction = null;
        this.activeDirection = 0;
        this.activeAxis = null;
        this.lastCommandTime = 0; // Reset so next start sends immediately
    };
}
