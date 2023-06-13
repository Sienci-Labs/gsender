import { GamepadListener } from 'gamepad.js';
import throttle from 'lodash/throttle';
import store from 'app/store';
import { Toaster, TOASTER_INFO } from 'app/lib/toaster/ToasterLib';

import shuttleEvents from '../shuttleEvents';

const STOP_JOG_CMD = 'STOP_JOG';

class Gamepad extends GamepadListener {
    constructor() {
        super({ deadZone: 0.5, precision: 2, analog: false });
        this.shouldHold = false;
        this.start();
    }

    update = ({ deadZone, precision }) => {
        if (deadZone) {
            this.options.deadZone = deadZone;
        }

        if (precision) {
            this.options.precision = precision;
        }
    }

    holdListener = () => {
        this.shouldHold = true;
    }

    unholdLisetner = () => {
        this.shouldHold = false;
    }

    onAxis = (event) => {
        const [leftStickX, leftStickY, rightStickX, rightStickY] = event.detail.gamepad.axes;

        const cartesian2Polar = (x, y) => {
            const radians = Math.atan2(y, x);
            const degrees = Math.round((radians * (180 / Math.PI))) * -1;
            return (degrees + 360) % 360; //https://stackoverflow.com/a/25725005
        };

        const leftStick = cartesian2Polar(leftStickX, leftStickY);
        const rightStick = cartesian2Polar(rightStickX, rightStickY);

        const dataOutput = {
            ...event.detail,
            degrees: {
                leftStick,
                rightStick,
            }
        };

        const { index } = dataOutput;

        this.emit('gamepad:axis', dataOutput);
        this.emit(`gamepad:${index}:axis`, dataOutput);
        this.emit(`gamepad:${index}:axis:${dataOutput.axis}`, dataOutput.detail);
    }
}

//  TODO:  Remove this when SSL is working correctly
const getGamepadInstance = () => {
    if (navigator.userAgent.includes('Firefox')) {
        console.log('Mock gamepad');
        return {
            start: () => {},
            on: () => {},
        };
    } else {
        return new Gamepad();
    }
};

const gamepadInstance = getGamepadInstance();

gamepadInstance.start();

export const shortcutComboBuilder = (list = []) => {
    const JOIN_KEY = '+';

    return list.join(JOIN_KEY);
};

export const onGamepadButtonClick = ({ detail }) => {
    if (gamepadInstance.shouldHold) {
        return null;
    }

    const { gamepad, pressed } = detail;
    const buttons = gamepad.buttons;
    const gamepadID = gamepad.id;

    const profiles = store.get('workspace.gamepad.profiles', []);
    const currentProfile = profiles.find(profile => profile.id.includes(gamepadID));

    if (!currentProfile) {
        return null;
    }

    const buttonCombo = shortcutComboBuilder(
        buttons
            .map((button, i) => ({ pressed: button.pressed, touched: button.touched, buttonIndex: i }))
            .filter(button => button.pressed || button.touched)
            .map(button => button.buttonIndex)
    );

    // the result is an array, [0] = key and [1] = shortcuts
    const foundAction = Object.entries(currentProfile.shortcuts).find(([key, shortcut]) => shortcut.keys === buttonCombo);

    if (!pressed) {
        const foundStopCommand = currentProfile.shortcuts[STOP_JOG_CMD];
        delete foundStopCommand?.payload; //We don't need to send a payload
        return foundStopCommand;
    }

    if (!buttonCombo || (foundAction && !foundAction[1].isActive)) {
        return null;
    }

    // null check
    return foundAction ? foundAction[1] : foundAction;
};

export const runAction = ({ event, shuttleControlEvents }) => {
    const action = onGamepadButtonClick(event);

    if (!action) {
        return;
    }

    const allShuttleControlEvents = shuttleEvents.allShuttleControlEvents;
    const runEvent = allShuttleControlEvents[action.cmd]?.callback;
    if (runEvent) {
        runEvent(null, action.payload);
    }
};

gamepadInstance.on('gamepad:connected', throttle(({ detail }) => {
    const { gamepad } = detail;

    const profiles = store.get('workspace.gamepad.profiles');

    const foundGamepad = profiles.find(profile => profile.id.includes(gamepad.id));

    Toaster.pop({
        msg: foundGamepad ? `${foundGamepad.profileName} Connected` : 'New gamepad connected, add it as a profile in your preferences',
        type: TOASTER_INFO,
    });
}, 250, { leading: true, trailing: false }));

gamepadInstance.on('gamepad:disconnected', () => {
    Toaster.pop({
        msg: 'Gamepad Disconnected',
        type: TOASTER_INFO,
        duration: 2000,
    });
});

export default gamepadInstance;
