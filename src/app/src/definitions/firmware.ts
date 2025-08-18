import { FIRMWARE_TYPES, HOMING_LOCATIONS } from '../constants';
import { BasicType } from './general';

// Types

export type EEPROM = `$${string}`;
export type FIRMWARE_TYPES_T =
    (typeof FIRMWARE_TYPES)[keyof typeof FIRMWARE_TYPES];
export type HOMING_LOCATIONS_T =
    (typeof HOMING_LOCATIONS)[keyof typeof HOMING_LOCATIONS];

// Interfaces

export interface EEPROMSettings {
    [key: EEPROM]: string;
}

export interface EEPROMDescriptions {
    group: number;
    description: string;
    unit: string;
    dataType: number;
    format: string;
    unitString: string;
    details: string;
}

export interface FilteredEEPROM {
    unit: string;
    setting: EEPROM;
    message?: string;
    category?: string;
    units?: string;
    inputType?: string;
    maxChars?: number;
    defaultValue?: BasicType;
    values?: BasicType;
    min?: number;
    step?: number;
    max?: number;
    bits?: number;
    numBits?: number;
    requiredBit?: number;
    globalIndex: number;
    value: string;
    description?: string;
    details?: string;
    group: BasicType;
    groupID: number;
    dataType?: string;
    format?: string;
    unitString?: string;
}

export interface RotaryModeFirmwareSettings {
    $101: string;
    $111: string;
    $20: string;
    $21: string;
}

export interface MachineProfile {
    id: number;
    company: string;
    name: string;
    type: string;
    version: string;
    mm: {
        width: number;
        depth: number;
        height: number;
    };
    in: {
        width: number;
        depth: number;
        height: number;
    };
    endstops: boolean;
    spindle: boolean;
    coolant: boolean;
    laser: boolean;
    laserOnOutline?: boolean;
    eepromSettings?: EEPROMSettings;
    grblHALeepromSettings?: EEPROMSettings;
}
