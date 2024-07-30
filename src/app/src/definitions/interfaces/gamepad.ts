import { AXES_T } from "../types";
import { CommandKey } from "./shortcuts";

export interface GamepadDetail {
    detail: {
        index: number,// Gamepad index: Number [0-3].
        button: number, // Button index: Number [0-N].
        axis: number, // Axis index: Number [0-N].
        value: number, // Current value: Number between 0 and 1. Float in analog mode, integer otherwise.
        pressed: boolean, // Native GamepadButton pressed value: Boolean.
        gamepad: globalThis.Gamepad, // Native Gamepad object
    }
};

export interface GamepadConfig {
    deadZone: number,
    precision: number,
};

export interface GamepadButton {
    label: string;
    value: number;
    primaryAction: string;
    secondaryAction: string;
};

export interface Stick {
    primaryAction: AXES_T,
    secondaryAction: AXES_T,
    isReversed: boolean,
}
export interface JoystickOptions {
    stick1: {
        horizontal: Stick,
        vertical: Stick,
        mpgMode: Stick,
    },
    stick2: {
        horizontal: Stick,
        vertical: Stick,
        mpgMode: Stick,
    },
    zeroThreshold: number,
    movementDistanceOverride: number,
};
export interface GamepadProfile {
    id: Array<string>,
    icon: string,
    active: boolean,
    profileName: string,
    shortcuts: CommandKey,
    name: string,
    mapping: 'standard',
    buttons: Array<GamepadButton>,
    axes: [number, number, number, number],
    joystickOptions: JoystickOptions,
    lockout: {
        button: number | null,
        active: boolean,
    },
    modifier: {
        button: boolean,
    },
};