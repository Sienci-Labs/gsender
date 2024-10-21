import { AXES } from '../../constants';
import { MDI, Shuttle } from 'definitions/general';
import { JogSpeed } from '../Jogging/definitions';

export type AXES_T = (typeof AXES)[keyof typeof AXES];

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
}
