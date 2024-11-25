import { GamepadListener } from 'gamepad.js';
import shuttleEvents from '../shuttleEvents';
import store from 'app/store';
import { Toaster, TOASTER_INFO } from '../toaster/ToasterLib';
import { debounce, noop } from 'lodash';
import { GamepadConfig, GamepadDetail, GamepadProfile } from './definitions';
import { ShuttleEvent } from 'app/lib/definitions/shortcuts';
import { toast } from '../toaster';

const macroCallbackDebounce = debounce(
    (action: string) =>
        shuttleEvents.allShuttleControlEvents.MACRO(null, { macroID: action }),
    500,
);
let buttonPressDebounce = noop;
let currentShuttleEvent: ShuttleEvent = null;

class Gamepad extends GamepadListener {
    constructor() {
        super({ axis: { precision: 2 }, button: { analog: false } });
        this.shouldHold = false;
        this.start();
    }

    update = ({ deadZone, precision }: GamepadConfig): void => {
        if (deadZone) {
            this.options.deadZone = deadZone;
        }

        if (precision) {
            this.options.precision = precision;
        }
    };

    holdListener = (): void => {
        this.shouldHold = true;
    };

    unholdListener = (): void => {
        this.shouldHold = false;
    };

    onAxis = ({ detail }: GamepadDetail): void => {
        const profiles: Array<GamepadProfile> = store.get(
            'workspace.gamepad.profiles',
            [],
        );
        const currentProfile = profiles.find((profile) =>
            profile.id.includes(detail.gamepad.id),
        );

        const lockoutButton =
            detail.gamepad.buttons[currentProfile?.lockout?.button];

        if (lockoutButton && !lockoutButton?.pressed) {
            return;
        }

        const deadZone =
            currentProfile?.joystickOptions?.zeroThreshold &&
            currentProfile?.joystickOptions?.zeroThreshold / 100;

        const [leftStickX, leftStickY, rightStickX, rightStickY] =
            detail.gamepad.axes;

        const cartesian2Polar = (x: number, y: number): number => {
            const radians = Math.atan2(y, x);
            const degrees = Math.round(radians * (180 / Math.PI)) * -1;
            return (degrees + 360) % 360; //https://stackoverflow.com/a/25725005
        };

        const cartesian2PolarDistance = (x: number, y: number): number => {
            const distance = Math.sqrt(x * x + y * y);

            return +distance.toFixed(2);
        };

        const leftStickDistance = cartesian2PolarDistance(
            leftStickX,
            leftStickY,
        );
        const rightStickDistance = cartesian2PolarDistance(
            rightStickX,
            rightStickY,
        );

        const leftStick = cartesian2Polar(leftStickX, leftStickY);
        const rightStick = cartesian2Polar(rightStickX, rightStickY);

        const dataOutput = {
            detail: detail,
            degrees: {
                leftStick,
                rightStick,
            },
            distance: {
                leftStick: leftStickDistance,
                rightStick: rightStickDistance,
            },
        };

        const { index } = dataOutput.detail;

        if (deadZone && detail.value < deadZone && detail.value > -deadZone) {
            const payload = {
                ...dataOutput,
                value: 0,
            };

            this.emit('gamepad:axis', payload);
            this.emit(`gamepad:${index}:axis`, payload);
            this.emit(
                `gamepad:${index}:axis:${dataOutput.detail.axis}`,
                payload.detail,
            );

            return;
        }

        this.emit('gamepad:axis', dataOutput);
        this.emit(`gamepad:${index}:axis`, dataOutput);
        this.emit(
            `gamepad:${index}:axis:${dataOutput.detail.axis}`,
            dataOutput.detail,
        );
    };
}

//  TODO:  Remove this when SSL is working correctly
const getGamepadInstance = ():
    | Gamepad
    | { start: () => void; on: () => void; off: () => void } => {
    if (navigator.userAgent.includes('Firefox')) {
        console.log('Mock gamepad');
        return {
            start: () => {},
            on: () => {},
            off: () => {},
        };
    } else {
        return new Gamepad();
    }
};

const gamepadInstance = getGamepadInstance();

gamepadInstance.start();

export const shortcutComboBuilder = (list: Array<string> = []): string => {
    const JOIN_KEY = '+';

    return list.join(JOIN_KEY);
};

export const checkButtonHold = (
    buttonType: 'modifier' | 'lockout',
    currentProfile: GamepadProfile,
): boolean => {
    const gamepads = navigator.getGamepads();

    const currentGamepad = gamepads.find((gamepad) =>
        currentProfile.id.includes(gamepad?.id),
    );

    if (!currentGamepad) {
        return false;
    }

    const isHoldingButton =
        currentGamepad.buttons[currentProfile[buttonType]?.button]?.pressed;

    return isHoldingButton;
};

export const onGamepadButtonPress = ({ detail }: GamepadDetail): string => {
    if ((gamepadInstance as Gamepad).shouldHold) {
        return null;
    }

    const { gamepad, button } = detail;
    const gamepadID = gamepad.id;

    const profiles: Array<GamepadProfile> = store.get(
        'workspace.gamepad.profiles',
        [],
    );
    const currentProfile = profiles.find((profile) =>
        profile.id.includes(gamepadID),
    );

    if (!currentProfile) {
        return null;
    }

    const foundAction = currentProfile.buttons?.find(
        ({ value }) => value === button,
    );

    if (
        (!detail.pressed && foundAction?.primaryAction?.includes('JOG')) ||
        foundAction?.secondaryAction?.includes('JOG')
    ) {
        return 'STOP_CONT_JOG';
    }

    if (!detail.pressed) {
        return null;
    }

    const modifierButton = gamepad.buttons[currentProfile.modifier?.button];
    const lockoutButton = gamepad.buttons[currentProfile.lockout?.button];

    if (lockoutButton && !lockoutButton?.pressed) {
        return null;
    }

    if (modifierButton?.pressed) {
        return foundAction?.secondaryAction;
    }

    return foundAction?.primaryAction;
};

export const runAction = ({ event }: { event: GamepadDetail }): void => {
    const shuttleControlEvents = shuttleEvents.allShuttleControlEvents;
    const action = onGamepadButtonPress(event);

    if (!action) {
        return;
    }
    if (shuttleControlEvents[action]) {
        const shuttleEvent = shuttleControlEvents[action];

        if ((shuttleEvent as ShuttleEvent)?.callback) {
            const shuttleEv = shuttleEvent as ShuttleEvent;
            // gamepads emit many signals on button press, so this stops the shortcut from running a bunch of times
            if (
                currentShuttleEvent &&
                currentShuttleEvent.cmd !== shuttleEv.cmd
            ) {
                currentShuttleEvent = shuttleEv;
                buttonPressDebounce = debounce(() =>
                    shuttleEv.callback(null, shuttleEv.payload),
                );
            }
            buttonPressDebounce();
        }
    } else {
        macroCallbackDebounce(action);
    }
};

export const deleteGamepadMacro = (macroID: string): void => {
    const profiles: Array<GamepadProfile> = store.get(
        'workspace.gamepad.profiles',
        [],
    );

    profiles.forEach((profile) => {
        const macroIndexPrimary = profile.buttons.findIndex(
            (button) => button.primaryAction === macroID,
        );
        if (macroIndexPrimary > -1) {
            profile.buttons[macroIndexPrimary].primaryAction = null;
        }

        const macroIndexSecondary = profile.buttons.findIndex(
            (button) => button.secondaryAction === macroID,
        );
        if (macroIndexSecondary > -1) {
            profile.buttons[macroIndexSecondary].secondaryAction = null;
        }
    });
};

gamepadInstance.on('gamepad:connected', ({ detail }: GamepadDetail): void => {
    const { gamepad } = detail;

    const profiles: Array<GamepadProfile> = store.get(
        'workspace.gamepad.profiles',
    );

    const foundGamepad = profiles.find((profile) =>
        profile.id.includes(gamepad.id),
    );

    toast.info(
        foundGamepad
            ? `${foundGamepad.name} Connected`
            : 'New gamepad connected, add it as a profile in your preferences',
    );
});

gamepadInstance.on('gamepad:disconnected', () => {
    toast.info('Gamepad Disconnected');
});

export default gamepadInstance;
