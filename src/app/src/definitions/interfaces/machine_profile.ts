import { EEPROMSettings } from "./firmware"

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
    laserOnOutline?: boolean,
    eepromSettings?: EEPROMSettings,
    grblHALeepromSettings?: EEPROMSettings
};