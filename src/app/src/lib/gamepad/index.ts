import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';

import GamepadListener from 'app/lib/gamepad/gamepad.js/GamepadListener';
import store from 'app/store';
import { ShuttleEvent } from 'app/lib/definitions/shortcuts';

import shuttleEvents from '../shuttleEvents';
import { GamepadConfig, GamepadDetail, GamepadProfile } from './definitions';
import { toast } from '../toaster';

const macroCallbackDebounce = debounce(
    (action: string) =>
        shuttleEvents.allShuttleControlEvents.MACRO(null, { macroID: action }),
    500,
);

class Gamepad extends GamepadListener {
    shouldHold = false;

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

export const shortcutComboBuilder = (list: Array<string> = []): string => {
    const JOIN_KEY = '+';

    return list.join(JOIN_KEY);
};

export const checkButtonHold = (
    buttonType: 'modifier' | 'lockout',
    currentProfile: GamepadProfile,
): boolean => {
    if (typeof navigator === 'undefined') {
        return false;
    }

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
    if ((GamepadManager.getInstance() as Gamepad).shouldHold) {
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
        !detail.pressed &&
        (foundAction?.primaryAction?.includes('JOG') ||
            foundAction?.secondaryAction?.includes('JOG'))
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
        const shuttleEv = shuttleEvent as ShuttleEvent;

        const throttledCallback = throttle(shuttleEv.callback, 100);

        throttledCallback(null, shuttleEv.payload);
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

export type GamepadInstance =
    | Gamepad
    | { start: () => void; on: () => void; off: () => void };

class GamepadManager {
    private static instance: GamepadInstance | null = null;
    private static connectedListener: (event: GamepadDetail) => void;
    private static disconnectedListener: () => void;
    private static buttonListener: (event: GamepadDetail) => void;

    static initialize(): GamepadInstance {
        if (GamepadManager.instance) {
            return GamepadManager.instance;
        }

        const instance = new Gamepad();

        // Store references to the listeners so we can remove them later
        this.connectedListener = ({ detail }: GamepadDetail) => {
            const { gamepad } = detail;

            const profiles: GamepadProfile[] = store.get(
                'workspace.gamepad.profiles',
                [],
            );

            const foundGamepad = profiles.find((profile) =>
                profile.id.includes(gamepad.id),
            );

            const toastMessage = foundGamepad
                ? `${foundGamepad.name} Connected`
                : 'New gamepad connected, add it as a profile in your preferences';

            toast.info(toastMessage);
        };

        this.disconnectedListener = () => {
            toast.info('Gamepad disconnected');
        };

        this.buttonListener = (event: GamepadDetail) => {
            runAction({ event });
        };

        instance.on('gamepad:connected', this.connectedListener);
        instance.on('gamepad:disconnected', this.disconnectedListener);
        instance.on('gamepad:button', this.buttonListener);

        if (instance instanceof Gamepad) {
            GamepadManager.instance = instance;
        }

        return instance;
    }

    static cleanup() {
        if (GamepadManager.instance) {
            // Remove all event listeners before nullifying the instance
            if (GamepadManager.instance instanceof Gamepad) {
                GamepadManager.instance.off(
                    'gamepad:connected',
                    this.connectedListener,
                );
                GamepadManager.instance.off(
                    'gamepad:disconnected',
                    this.disconnectedListener,
                );
                GamepadManager.instance.off(
                    'gamepad:button',
                    this.buttonListener,
                );
            }
            GamepadManager.instance = null;
        }
    }

    static getInstance():
        | Gamepad
        | { start: () => void; on: () => void; off: () => void } {
        return GamepadManager.instance || this.initialize();
    }
}

export default GamepadManager;
