import { GamepadListener } from 'gamepad.js';
// import { throttle } from 'lodash';
import store from 'app/store';
import { Toaster, TOASTER_INFO } from 'app/lib/toaster/ToasterLib';

class Gamepad extends GamepadListener {
    constructor() {
        // const { deadZone = 0.4 } = store.get('workspace.gamepad');
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
}
const gamepadInstance = new Gamepad();
gamepadInstance.start();

export const shortcutComboBuilder = (list = []) => {
    const JOIN_KEY = '+';

    return list.join(JOIN_KEY);
};

export const onGamepadButtonClick = ({ detail }) => {
    if (gamepadInstance.shouldHold) {
        return null;
    }

    const { gamepad } = detail;
    const buttons = gamepad.buttons;
    const gamepadID = gamepad.id;

    const buttonCombo = shortcutComboBuilder(
        buttons
            .map((button, i) => ({ pressed: button.pressed, touched: button.touched, buttonIndex: i }))
            .filter(button => button.pressed || button.touched)
            .map(button => button.buttonIndex)
    );

    if (!buttonCombo) {
        return null;
    }

    const profiles = store.get('workspace.gamepad.profiles', []);

    const currentProfile = profiles.find(profile => profile.id === gamepadID);

    if (!currentProfile) {
        return null;
    }

    const foundAction = currentProfile.shortcuts.find(shortcut => {
        return shortcut.keys === buttonCombo;
    });

    if (!foundAction) {
        return null;
    }

    if (!foundAction.isActive) {
        return null;
    }

    return foundAction;
};

export const runAction = ({ event, shuttleControlEvents }) => { //Added throttle to prevent uncessary spam when controller is connecting
    const action = onGamepadButtonClick(event);

    if (!action) {
        return;
    }

    const runEvent = shuttleControlEvents[action.cmd];

    if (runEvent) {
        runEvent(null, action.payload);
    }
};

gamepadInstance.on('gamepad:connected', ({ detail }) => {
    const { gamepad } = detail;

    const profiles = store.get('workspace.gamepad.profiles');

    const foundGamepad = profiles.find(profile => profile.id === gamepad.id);

    Toaster.pop({
        msg: foundGamepad ? `${foundGamepad.profileName} Connected` : 'New joystick connected, add it as a profile in your preferences',
        type: TOASTER_INFO,
    });
});

gamepadInstance.on('gamepad:disconnected', () => {
    Toaster.pop({
        msg: 'Joystick Disconnected',
        type: TOASTER_INFO,
        duration: 2000,
    });
});

export default gamepadInstance;
