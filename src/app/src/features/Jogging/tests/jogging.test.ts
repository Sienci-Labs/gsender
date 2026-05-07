import { convertValue } from '../utils/units';
import JogHelper from '../utils/jogHelper';
import controller from 'app/lib/controller';
import store from 'app/store';
import {
    stopContinuousJog,
    cancelJog,
    xPlusJog,
    xMinusJog,
    yPlusJog,
    yMinusJog,
    zPlusJog,
    zMinusJog,
    aPlusJog,
    aMinusJog,
    xPlusYPlus,
    xPlusYMinus,
    xMinusYPlus,
    xMinusYMinus,
} from '../utils/Jogging';

jest.mock('lodash', () => ({
    throttle: (fn: Function) => fn,
    map: (obj: object, fn: Function) =>
        Object.entries(obj).map(([k, v]) => fn(v, k)),
}));

jest.mock('app/lib/controller', () => ({
    command: jest.fn(),
    state: {},
}));

jest.mock('app/store', () => ({
    get: jest.fn(),
}));


// convertValue

describe('convertValue', () => {
    it('returns same value when fromUnit and toUnit are both mm', () => {
        expect(convertValue(10, 'mm', 'mm')).toBe(10);
    });
    it('returns same value when fromUnit and toUnit are both in', () => {
        expect(convertValue(5, 'in', 'in')).toBe(5);
    });
    it('converts inches to mm correctly', () => {
        expect(convertValue(1, 'in', 'mm')).toBe(25.4);
    });
    it('converts 0 inches to 0 mm', () => {
        expect(convertValue(0, 'in', 'mm')).toBe(0);
    });
    it('converts mm to inches correctly', () => {
        expect(convertValue(25.4, 'mm', 'in')).toBe(1);
    });
    it('converts 0 mm to 0 inches', () => {
        expect(convertValue(0, 'mm', 'in')).toBe(0);
    });
    it('respects custom precision', () => {
        expect(convertValue(1, 'mm', 'in', 2)).toBe(0.04);
    });
    it('defaults to 3 decimal precision', () => {
        expect(convertValue(1, 'mm', 'in')).toBe(0.039);
    });
    it('handles negative inch to mm conversion', () => {
        expect(convertValue(-1, 'in', 'mm')).toBe(-25.4);
    });
    it('handles negative mm to inch conversion', () => {
        expect(convertValue(-25.4, 'mm', 'in')).toBe(-1);
    });
});


// JogHelper

describe('JogHelper', () => {
    let jogCB: jest.Mock;
    let startContinuousJogCB: jest.Mock;
    let stopContinuousJogCB: jest.Mock;
    let jogHelper: JogHelper;

    beforeEach(() => {
        jest.useFakeTimers();
        jogCB = jest.fn();
        startContinuousJogCB = jest.fn();
        stopContinuousJogCB = jest.fn();
        jogHelper = new JogHelper({ jogCB, startContinuousJogCB, stopContinuousJogCB });
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('initializes with correct default values', () => {
        expect(jogHelper.timeoutFunction).toBeNull();
        expect(jogHelper.startTime).toBe(0);
        expect(jogHelper.didPress).toBe(false);
        expect(jogHelper.currentCoordinates).toBeNull();
        expect(jogHelper.feedrate).toBe(3000);
    });
    it('sets state correctly on keydown', () => {
        jogHelper.onKeyDown({ X: 1 }, 3000);
        expect(jogHelper.didPress).toBe(true);
        expect(jogHelper.currentCoordinates).toEqual({ X: 1 });
        expect(jogHelper.feedrate).toBe(3000);
        expect(jogHelper.timeoutFunction).not.toBeNull();
    });
    it('ignores repeated keydown while key is already held', () => {
        jogHelper.onKeyDown({ X: 1 }, 3000);
        jogHelper.onKeyDown({ X: 1 }, 3000);
        jest.advanceTimersByTime(300);
        expect(startContinuousJogCB).toHaveBeenCalledTimes(1);
    });
    it('starts continuous jog after timeout threshold', () => {
        jogHelper.onKeyDown({ X: 1 }, 3000);
        jest.advanceTimersByTime(300);
        expect(startContinuousJogCB).toHaveBeenCalledWith({ X: 1 }, 3000);
    });
    it('does not start continuous jog before timeout threshold', () => {
        jogHelper.onKeyDown({ X: 1 }, 3000);
        jest.advanceTimersByTime(100);
        expect(startContinuousJogCB).not.toHaveBeenCalled();
    });
    it('triggers single jog on quick keydown + keyup', () => {
        jogHelper.onKeyDown({ X: 1 }, 3000);
        jest.advanceTimersByTime(100);
        jogHelper.onKeyUp();
        expect(jogCB).toHaveBeenCalledWith({ X: 1 }, 3000);
        expect(stopContinuousJogCB).not.toHaveBeenCalled();
    });
    it('stops continuous jog on keyup after long press', () => {
        jogHelper.onKeyDown({ X: 1 }, 3000);
        jest.advanceTimersByTime(300);
        jogHelper.onKeyUp();
        expect(stopContinuousJogCB).toHaveBeenCalled();
        expect(jogCB).not.toHaveBeenCalled();
    });
    it('resets state after keyup', () => {
        jogHelper.onKeyDown({ X: 1 }, 3000);
        jest.advanceTimersByTime(100);
        jogHelper.onKeyUp();
        expect(jogHelper.didPress).toBe(false);
        expect(jogHelper.currentCoordinates).toBeNull();
        expect(jogHelper.timeoutFunction).toBeNull();
    });
    it('does nothing on keyup if no keydown was registered', () => {
        jogHelper.onKeyUp();
        expect(jogCB).not.toHaveBeenCalled();
        expect(stopContinuousJogCB).not.toHaveBeenCalled();
    });
    it('updates timeout threshold correctly', () => {
        jogHelper.updateThreshold(300);
        expect(jogHelper.timeout).toBe(400);
    });
    it('passes correct coordinates and feedrate to jog on short press', () => {
        jogHelper.onKeyDown({ Y: -1 }, 5000);
        jest.advanceTimersByTime(100);
        jogHelper.onKeyUp();
        expect(jogCB).toHaveBeenCalledWith({ Y: -1 }, 5000);
    });
    it('passes correct coordinates and feedrate to continuous jog', () => {
        jogHelper.onKeyDown({ Z: 1 }, 1500);
        jest.advanceTimersByTime(300);
        expect(startContinuousJogCB).toHaveBeenCalledWith({ Z: 1 }, 1500);
    });
});

// Jogging.ts — direction functions

describe('Jogging direction functions', () => {
    beforeEach(() => {
        (controller.command as jest.Mock).mockClear();
        (store.get as jest.Mock).mockImplementation((key: string, defaultVal: any) => {
            if (key === 'workspace.units') return 'mm';
            if (key === 'workspace.preventJoggingPastLimits') return false;
            return defaultVal;
        });
    });

    it('xPlusJog sends positive X command', () => {
        xPlusJog(10, 3000);
        expect(controller.command).toHaveBeenCalledWith('gcode', ['$J=G21 G91 X10 F3000']);
    });
    it('xMinusJog sends negative X command', () => {
        xMinusJog(10, 3000);
        expect(controller.command).toHaveBeenCalledWith('gcode', ['$J=G21 G91 X-10 F3000']);
    });
    it('yPlusJog sends positive Y command', () => {
        yPlusJog(10, 3000);
        expect(controller.command).toHaveBeenCalledWith('gcode', ['$J=G21 G91 Y10 F3000']);
    });
    it('yMinusJog sends negative Y command', () => {
        yMinusJog(10, 3000);
        expect(controller.command).toHaveBeenCalledWith('gcode', ['$J=G21 G91 Y-10 F3000']);
    });
    it('zPlusJog sends positive Z command', () => {
        zPlusJog(5, 1000);
        expect(controller.command).toHaveBeenCalledWith('gcode', ['$J=G21 G91 Z5 F1000']);
    });
    it('zMinusJog sends negative Z command', () => {
        zMinusJog(5, 1000);
        expect(controller.command).toHaveBeenCalledWith('gcode', ['$J=G21 G91 Z-5 F1000']);
    });
    it('aPlusJog sends positive A command in normal mode', () => {
        aPlusJog(10, 3000);
        expect(controller.command).toHaveBeenCalledWith('gcode', ['$J=G21 G91 A10 F3000']);
    });
    it('aMinusJog sends negative A command in normal mode', () => {
        aMinusJog(10, 3000);
        expect(controller.command).toHaveBeenCalledWith('gcode', ['$J=G21 G91 A-10 F3000']);
    });
    it('aPlusJog sends Y command in rotary mode', () => {
        aPlusJog(10, 3000, false, true);
        expect(controller.command).toHaveBeenCalledWith('gcode', ['$J=G21 G91 Y10 F3000']);
    });
    it('aMinusJog sends negative Y command in rotary mode', () => {
        aMinusJog(10, 3000, false, true);
        expect(controller.command).toHaveBeenCalledWith('gcode', ['$J=G21 G91 Y-10 F3000']);
    });
    it('xPlusYPlus sends positive X and Y command', () => {
        xPlusYPlus(10, 3000);
        expect(controller.command).toHaveBeenCalledWith('gcode', ['$J=G21 G91 X10 Y10 F3000']);
    });
    it('xPlusYMinus sends positive X negative Y command', () => {
        xPlusYMinus(10, 3000);
        expect(controller.command).toHaveBeenCalledWith('gcode', ['$J=G21 G91 X10 Y-10 F3000']);
    });
    it('xMinusYPlus sends negative X positive Y command', () => {
        xMinusYPlus(10, 3000);
        expect(controller.command).toHaveBeenCalledWith('gcode', ['$J=G21 G91 X-10 Y10 F3000']);
    });
    it('xMinusYMinus sends negative X and Y command', () => {
        xMinusYMinus(10, 3000);
        expect(controller.command).toHaveBeenCalledWith('gcode', ['$J=G21 G91 X-10 Y-10 F3000']);
    });
    it('uses G20 modal when workspace units are inches', () => {
        (store.get as jest.Mock).mockImplementation((key: string, defaultVal: any) => {
            if (key === 'workspace.units') return 'in';
            if (key === 'workspace.preventJoggingPastLimits') return false;
            return defaultVal;
        });
        xPlusJog(1, 100);
        expect(controller.command).toHaveBeenCalledWith('gcode', ['$J=G20 G91 X1 F100']);
    });
    it('xPlusJog in continuous mode calls jog:start', () => {
        xPlusJog(10, 3000, true);
        expect(controller.command).toHaveBeenCalledWith('jog:start', { X: 10 }, 3000, 'mm');
    });
    it('xMinusJog in continuous mode calls jog:start with negative X', () => {
        xMinusJog(10, 3000, true);
        expect(controller.command).toHaveBeenCalledWith('jog:start', { X: -10 }, 3000, 'mm');
    });
    it('stopContinuousJog sends jog:stop command', () => {
        stopContinuousJog();
        expect(controller.command).toHaveBeenCalledWith('jog:stop');
    });
    it('cancelJog sends jog:cancel when state is JOG', () => {
        cancelJog('Jog', 'Grbl');
        expect(controller.command).toHaveBeenCalledWith('jog:cancel');
    });
    it('cancelJog sends reset when state is not IDLE or JOG', () => {
        cancelJog('Alarm', 'Grbl');
        expect(controller.command).toHaveBeenCalledWith('reset');
    });
    it('cancelJog sends reset:soft for grblHAL firmware', () => {
        cancelJog('Alarm', 'grblHAL');
        expect(controller.command).toHaveBeenCalledWith('reset:soft');
    });
    it('cancelJog does nothing when state is IDLE', () => {
        cancelJog('Idle', 'Grbl');
        expect(controller.command).not.toHaveBeenCalled();
    });
}); 