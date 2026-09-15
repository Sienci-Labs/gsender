import { AXIS_A, AXIS_X, AXIS_Y, AXIS_Z } from '../constants';

export const gamepadMapping = {
    standard: {
        buttons: [
            { label: 'A', value: 0 },
            { label: 'B', value: 1 },
            { label: 'X', value: 2 },
            { label: 'Y', value: 3 },
            { label: 'LB', value: 4 },
            { label: 'RB', value: 5 },
            { label: 'LT', value: 6 },
            { label: 'RT', value: 7 },
            { label: 'Back', value: 8 },
            { label: 'Start', value: 9 },
            { label: 'L3', value: 10 },
            { label: 'R3', value: 11 },
            { label: 'Up', value: 12 },
            { label: 'Down', value: 13 },
            { label: 'Left', value: 14 },
            { label: 'Right', value: 15 },
            { label: 'Home', value: 16 },
        ],
        axes: [
            { label: 'Left Stick X', value: 0 },
            { label: 'Left Stick Y', value: 1 },
            { label: 'Right Stick X', value: 2 },
            { label: 'Right Stick Y', value: 3 },
        ],
    },
};

export const defaultOptions = {
    joystickOptions: {
        stick1: {
            horizontal: {
                primaryAction: AXIS_X,
                secondaryAction: AXIS_X,
                isReversed: false,
            },
            vertical: {
                primaryAction: AXIS_Y,
                secondaryAction: AXIS_Y,
                isReversed: false,
            },
            mpgMode: {
                primaryAction: null,
                secondaryAction: null,
                isReversed: false,
            },
        },
        stick2: {
            horizontal: {
                primaryAction: AXIS_A,
                secondaryAction: AXIS_A,
                isReversed: false,
            },
            vertical: {
                primaryAction: AXIS_Z,
                secondaryAction: AXIS_Z,
                isReversed: false,
            },
            mpgMode: {
                primaryAction: null,
                secondaryAction: null,
                isReversed: false,
            },
        },
        zeroThreshold: 30,
        movementDistanceOverride: 100,
    },
    buttons: [],
};

export const profiles = [
    {
        id: [
            'Logitech Cordless RumblePad 2 (STANDARD GAMEPAD Vendor: 046d Product: c219)',
        ],
        icon: 'fas fa-gamepad',
        active: true,
        profileName: 'Logitech F710 Gamepad',
        shortcuts: {},
        name: 'Logitech F710 Gamepad',
        mapping: 'standard',

        buttons: gamepadMapping.standard.buttons.map((button) => ({
            label: button.label,
            value: button.value,
            primaryAction: null,
            secondaryAction: null,
        })),
        axes: [0, 0, 0, 0],
        joystickOptions: defaultOptions.joystickOptions,
        lockout: {
            button: null,
            active: false,
        },
        modifier: {
            button: false,
        },
    },
    {
        id: [
            'Xbox 360 Controller (XInput STANDARD GAMEPAD)',
            'Xbox 360 Controller (STANDARD GAMEPAD Vendor: 045e Product: 028e)',
            'Wireless Gamepad (Vendor: 2563 Product: 0575)',
        ],
        icon: 'fas fa-gamepad',
        active: true,
        profileName: 'Xbox Controller',
        shortcuts: {},
        name: 'Xbox Controller',
        mapping: 'standard',
        buttons: gamepadMapping.standard.buttons.map((button) => ({
            label: button.label,
            value: button.value,
            primaryAction: null,
            secondaryAction: null,
        })),
        axes: [0, 0, 0, 0],
        joystickOptions: defaultOptions.joystickOptions,
        lockout: {
            button: null,
            active: false,
        },
        modifier: {
            button: false,
        },
    },
];
