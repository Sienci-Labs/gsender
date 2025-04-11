import { SPINDLE_LASER } from '../../constants';

// Types

export type SPINDLE_LASER_T =
    (typeof SPINDLE_LASER)[keyof typeof SPINDLE_LASER];

// Interfaces

export interface SpindleState {
    minimized: boolean;
    mode: SPINDLE_LASER_T;
    speed: number;
    spindleMax: number;
    spindleMin: number;
    delay: number;
    laser: {
        laserOnOutline: boolean,
        power: number;
        duration: number;
        xOffset: number;
        yOffset: number;
        minPower: number;
        maxPower: number;
    };
}

export interface Spindle {
    enabled: boolean;
    id: string;
    label: string;
    capabilities: string;
}
