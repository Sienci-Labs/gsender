import { Shuttle } from "../general";

export interface JogSpeed {
    xyStep: number,
    zStep: number,
    aStep?: number;
    xaStep?: number;
    feedrate: number,
}

export interface JogSpeeds {
    rapid: JogSpeed,
    normal: JogSpeed,
    precise: JogSpeed
};

export interface Location {
    minimized: boolean,
    axes: string[],
    jog: {
        keypad: boolean,
        step: number,
        distances: number[],
        speeds: JogSpeed,
    },
    mdi: {
        disabled: boolean,
    },
    shuttle: Shuttle,
}