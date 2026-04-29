import { GRBL_ACTIVE_STATES, GRBL_HAL_ACTIVE_STATES } from '../constants';

// Types

export type BasicType = string | number | boolean | Array<any> | BasicObject;

export type UNITS_GCODE = 'G20' | 'G21'; // G20: Inches, G21: Millimeters
export type UNITS_EN = 'mm' | 'in';
export type GRBL_ACTIVE_STATES_T =
    (typeof GRBL_ACTIVE_STATES)[keyof typeof GRBL_ACTIVE_STATES];
export type GRBL_HAL_ACTIVE_STATES_T =
    (typeof GRBL_HAL_ACTIVE_STATES)[keyof typeof GRBL_HAL_ACTIVE_STATES];

// Inerfaces

export interface BasicObject {
    [key: string]: string | number | boolean | Array<any> | BasicObject;
}

export interface BasicPosition {
    x: number;
    y: number;
    z: number;
    a?: number;
    b?: number;
    c?: number;
}

export interface BBox {
    min: {
        x: number;
        y: number;
        z: number;
        a?: number;
    };
    max: {
        x: number;
        y: number;
        z: number;
        a?: number;
    };
    delta?: {
        x: number;
        y: number;
        z: number;
        a?: number;
    };
}

export interface Shuttle {
    feedrateMin: number;
    feedrateMax: number;
    hertz: number;
    overshoot: number;
}

export interface MDI {
    disabled: boolean;
}
