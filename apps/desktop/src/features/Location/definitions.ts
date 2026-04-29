import { Shuttle } from 'definitions/general';
import { JogSpeed } from '../Jogging/definitions';

export interface Location {
    minimized: boolean;
    axes: string[];
    jog: {
        keypad: boolean;
        step: number;
        distances: number[];
        speeds: JogSpeed;
    };
    mdi: {
        disabled: boolean;
    };
    shuttle: Shuttle;
}
