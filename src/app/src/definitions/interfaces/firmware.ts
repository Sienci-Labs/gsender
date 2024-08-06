import { EEPROM } from "../types";

export interface EEPROMSettings {
    [key: EEPROM]: string
};

export interface FirmwareOptions {
    OPT: string,
    NEWOPT: string,
    FIRMWARE: string,
    NVS_STORAGE: string,
    FREE_MEMORY: string,
    DRIVER: string,
    DRIVER_VERSION: string,
    BOARD: string,
    AUX_IO: string,
    WIZCHIP: string,
    IP: string,
    PLUGIN: string,
    SPINDLE: string,
};

export interface EEPROMDescriptions {
    group: number,
    description: string,
    unit: string,
    dataType: number,
    format: string,
    unitString: string,
    details: string,
};

export interface RotaryModeFirmwareSettings {
    $101: string,
    $111: string,
    $20: string,
    $21: string,
};