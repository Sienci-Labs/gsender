import { AXES_T } from 'app/features/Axes/definitions';
import { CommandKeys } from 'app/lib/definitions/shortcuts';

// Override action types for feed rate and spindle speed control
// Direction is determined by joystick input
// +/- for minor (1%) increments, ++/-- for major (10%) increments
export type OVERRIDE_ACTION_T =
    | 'feed+/-'
    | 'feed++/--'
    | 'spindle+/-'
    | 'spindle++/--';

// Combined type for stick actions - can be an axis, an override action, or null
export type STICK_ACTION_T = AXES_T | OVERRIDE_ACTION_T | null;

export interface GamepadDetail {
    detail: {
        index: number; // Gamepad index: Number [0-3].
        button: number; // Button index: Number [0-N].
        axis: number; // Axis index: Number [0-N].
        value: number; // Current value: Number between 0 and 1. Float in analog mode, integer otherwise.
        pressed: boolean; // Native GamepadButton pressed value: Boolean.
        gamepad: globalThis.Gamepad; // Native Gamepad object
    };
}

export interface GamepadConfig {
    deadZone: number;
    precision: number;
    profiles?: GamepadProfile[];
}

export interface GamepadButton {
    label: string;
    value: number;
    primaryAction: string;
    secondaryAction: string;
}

export interface StickActions {
    primaryAction: STICK_ACTION_T;
    secondaryAction: STICK_ACTION_T;
    isReversed: boolean;
}

export interface StickOptions {
    horizontal: StickActions;
    vertical: StickActions;
    mpgMode: StickActions;
}

export interface JoystickOptions {
    stick1: StickOptions;
    stick2: StickOptions;
    zeroThreshold: number;
    movementDistanceOverride: number;
}

export interface DefaultGamepadOptions {
    joystickOptions: JoystickOptions;
    buttons: any[];
}

export interface GamepadProfile {
    id: Array<string>;
    icon: string;
    active: boolean;
    profileName: string;
    shortcuts: CommandKeys;
    name: string;
    mapping: 'standard';
    buttons: Array<GamepadButton>;
    axes: [number, number, number, number];
    joystickOptions: JoystickOptions;
    lockout: {
        button: number | null;
        active: boolean;
    };
    modifier: {
        button: number | null;
    };
}
