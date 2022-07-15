import { ensurePositiveNumber } from 'ensure-type';
import controller from '../lib/controller';

export const outlineResponse = ({ data }, isLaserOn) => {
    if (isLaserOn) {
        const power = 1, maxS = 1000;
        let turnOn = 'G1F1 M3 S' + ensurePositiveNumber(maxS * (power / 100));
        let turnOff = 'M5 S0';
        controller.command('gcode', [turnOn, ...data.outlineGcode, turnOff]);
    } else {
        controller.command('gcode', data.outlineGcode);
    }
};
