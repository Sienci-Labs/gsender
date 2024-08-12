import { EEPROMSettings } from "./firmware"

export interface BasicObject {
    [key: string]: string | number | boolean | Array<any> | BasicObject,
};

export interface BasicPosition {
    x: number,
    y: number,
    z: number,
    a: number
};

export interface BBox {
    min: {
        x: number,
        y: number,
        z: number,
    },
    max: {
        x: number,
        y: number,
        z: number,
    },
    delta: {
        x: number,
        y: number,
        z: number,
    }
};

export interface MachineProfile {
    id: number,
    company: string,
    name: string,
    type: string,
    version: string,
    mm: {
        width: number,
        depth: number,
        height: number
    },
    in: {
        width: number,
        depth: number,
        height: number
    },
    endstops: boolean,
    spindle: boolean,
    coolant: boolean,
    laser: boolean,
    eepromSettings?: EEPROMSettings,
    grblHALeepromSettings?: EEPROMSettings
};