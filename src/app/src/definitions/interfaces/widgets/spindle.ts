import { SPINDLE_LASER_T } from "app/definitions/types";

export interface Spindle {
    minimized: boolean;
    mode: SPINDLE_LASER_T;
    speed: number;
    spindleMax: number;
    spindleMin: number;
    delay: number;
    laser: {
        power: number;
        duration: number;
        xOffset: number;
        yOffset: number;
        minPower: number;
        maxPower: number;
    };
}