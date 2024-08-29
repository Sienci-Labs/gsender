import { AXES_T } from "app/definitions/types";
import { JogSpeed } from "../jogging";
import { MDI, Shuttle } from "../general";

export interface Axes {
    minimized: boolean;
    axes: AXES_T[];
    jog: {
        xyStep: number;
        zStep: number;
        aStep: number;
        feedrate: number;
        keypad: boolean;
        rapid: JogSpeed;
        normal: JogSpeed;
        precise: JogSpeed;
        step: number;
        distances: number[];
    };
    mdi: MDI;
    shuttle: Shuttle;
};