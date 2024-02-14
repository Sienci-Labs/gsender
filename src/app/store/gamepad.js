import { AXIS_A, AXIS_X, AXIS_Y, AXIS_Z } from '../constants';

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
        zeroThreshold: 15,
        movementDistanceOverride: 100,
    },
    buttons: []
};

export const profiles = [
    {
        id: ['Logitech Cordless RumblePad 2 (STANDARD GAMEPAD Vendor: 046d Product: c219)'],
        icon: 'fas fa-gamepad',
        active: true,
        profileName: 'Logitech F710 Gamepad',
        shortcuts: {},
        name: 'Logitech F710 Gamepad',
        mapping: 'standard',
        buttons: [
            { label: 'A', value: 0, primaryAction: null, secondaryAction: null, },
            { label: 'B', value: 1, primaryAction: null, secondaryAction: null, },
            { label: 'X', value: 2, primaryAction: null, secondaryAction: null, },
            { label: 'Y', value: 3, primaryAction: null, secondaryAction: null, },
            { label: 'LB', value: 4, primaryAction: null, secondaryAction: null, },
            { label: 'RB', value: 5, primaryAction: null, secondaryAction: null, },
            { label: 'LT', value: 6, primaryAction: null, secondaryAction: null, },
            { label: 'RT', value: 7, primaryAction: null, secondaryAction: null, },
            { label: 'Back', value: 8, primaryAction: null, secondaryAction: null, },
            { label: 'Start', value: 9, primaryAction: null, secondaryAction: null, },
            { label: 'L3', value: 10, primaryAction: null, secondaryAction: null, },
            { label: 'R3', value: 11, primaryAction: null, secondaryAction: null, },
            { label: 'Up', value: 12, primaryAction: null, secondaryAction: null, },
            { label: 'Down', value: 13, primaryAction: null, secondaryAction: null, },
            { label: 'Left', value: 14, primaryAction: null, secondaryAction: null, },
            { label: 'Right', value: 15, primaryAction: null, secondaryAction: null, },
        ],
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
            'Wireless Gamepad (Vendor: 2563 Product: 0575)'
        ],
        icon: 'fas fa-gamepad',
        active: true,
        profileName: 'Xbox Controller',
        shortcuts: {},
        name: 'Xbox Controller',
        mapping: 'standard',
        buttons: [
            { label: 'A', value: 0, primaryAction: null, secondaryAction: null, },
            { label: 'B', value: 1, primaryAction: null, secondaryAction: null, },
            { label: 'X', value: 2, primaryAction: null, secondaryAction: null, },
            { label: 'Y', value: 3, primaryAction: null, secondaryAction: null, },
            { label: 'LB', value: 4, primaryAction: null, secondaryAction: null, },
            { label: 'RB', value: 5, primaryAction: null, secondaryAction: null, },
            { label: 'LT', value: 6, primaryAction: null, secondaryAction: null, },
            { label: 'RT', value: 7, primaryAction: null, secondaryAction: null, },
            { label: 'Back', value: 8, primaryAction: null, secondaryAction: null, },
            { label: 'Start', value: 9, primaryAction: null, secondaryAction: null, },
            { label: 'L3', value: 10, primaryAction: null, secondaryAction: null, },
            { label: 'R3', value: 11, primaryAction: null, secondaryAction: null, },
            { label: 'Up', value: 12, primaryAction: null, secondaryAction: null, },
            { label: 'Down', value: 13, primaryAction: null, secondaryAction: null, },
            { label: 'Left', value: 14, primaryAction: null, secondaryAction: null, },
            { label: 'Right', value: 15, primaryAction: null, secondaryAction: null, },
            { label: 'Home', value: 16, primaryAction: null, secondaryAction: null, },
        ],
        axes: [0, 0, 0, 0],
        joystickOptions: defaultOptions.joystickOptions,
        lockout: {
            button: null,
            active: false,
        },
        modifier: {
            button: false,
        },
    }
];
