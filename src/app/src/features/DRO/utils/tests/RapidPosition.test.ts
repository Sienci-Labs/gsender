import { jest } from '@jest/globals';
import {
    getMovementGCode,
    isBitSetInNumber,
    FRONT_RIGHT,
    FRONT_LEFT,
    BACK_RIGHT,
} from 'app/features/DRO/utils/RapidPosition';

// gsender#911: the corner/Go-To Z retract used to be hardcoded to "Z-1",
// which only stayed within the soft-limit envelope when the firmware reset
// machine origin to 0 after homing. On firmware that doesn't (older grbl,
// grblHAL with $22 bit 3 unset), home actually sits at Z=-$27, so the
// retract needs to use -pullOff instead.

jest.mock('app/store/redux', () => {
    const getState = jest.fn();
    const dispatch = jest.fn();
    return { __esModule: true, default: { getState, dispatch } };
});

jest.mock('app/store', () => ({
    __esModule: true,
    default: {
        get: jest.fn((_key: string, defaultVal: unknown) => defaultVal),
    },
}));

const reduxStore = require('app/store/redux').default;
const prefStore = require('app/store').default;

const mockGetState = reduxStore.getState as jest.Mock;
const mockPrefGet = prefStore.get as jest.Mock;

function mockSettings(settings: Record<string, string>) {
    mockGetState.mockReturnValue({
        controller: { settings: { settings } },
    });
}

beforeEach(() => {
    mockPrefGet.mockImplementation((...args: any[]) => args[1]); // defaults controller type to 'grbl'
});

describe('isBitSetInNumber', () => {
    it('reads bit position 3 (value 8) — the grblHAL "set origin to 0" flag', () => {
        expect(isBitSetInNumber('8', 3)).toBe(true);
        expect(isBitSetInNumber('9', 3)).toBe(true); // 9 = enable(1) + origin-reset(8)
    });

    it('does not confuse bit 3 with bit 2 (value 4)', () => {
        expect(isBitSetInNumber('4', 3)).toBe(false);
    });

    it('is false when the bit is unset', () => {
        expect(isBitSetInNumber('1', 3)).toBe(false); // homing enabled, origin not reset
        expect(isBitSetInNumber('0', 3)).toBe(false);
    });
});

describe('getMovementGCode - Z retract (gsender#911)', () => {
    it('retracts to Z-1 when $22 has the origin-reset bit set, regardless of pull-off', () => {
        mockSettings({ $130: '300', $131: '300', $22: '9' });
        const gcode = getMovementGCode(FRONT_RIGHT, '0', true, 5);
        expect(gcode[0]).toBe('G53 G21 G0 Z-1');
    });

    it('retracts to Z-<pullOff> when the origin-reset bit is not set', () => {
        mockSettings({ $130: '300', $131: '300', $22: '1' });
        const gcode = getMovementGCode(FRONT_RIGHT, '0', true, 2);
        expect(gcode[0]).toBe('G53 G21 G0 Z-2');
    });

    it('falls back to -pullOff (not -1) when $22 is missing entirely', () => {
        mockSettings({ $130: '300', $131: '300' });
        const gcode = getMovementGCode(FRONT_RIGHT, '0', true, 3);
        expect(gcode[0]).toBe('G53 G21 G0 Z-3');
    });

    it('handles fractional pull-off distances', () => {
        mockSettings({ $130: '300', $131: '300', $22: '1' });
        const gcode = getMovementGCode(FRONT_RIGHT, '0', true, 2.5);
        expect(gcode[0]).toBe('G53 G21 G0 Z-2.5');
    });

    it('reproduces the exact reported scenario ($27=2, origin not reset -> old code sent Z-1)', () => {
        mockSettings({ $130: '220', $131: '380', $22: '1' });
        const gcode = getMovementGCode(BACK_RIGHT, '0', true, 2);
        expect(gcode[0]).not.toBe('G53 G21 G0 Z-1');
        expect(gcode[0]).toBe('G53 G21 G0 Z-2');
    });
});

describe('getMovementGCode - grblHAL homingFlag override reuses the same $22 check', () => {
    it('overrides the passed-in homingFlag using $22 bit 3 when controller type is grblHAL', () => {
        mockPrefGet.mockImplementation((...args: any[]) =>
            args[0] === 'widgets.connection.controller.type'
                ? 'grblHAL'
                : undefined,
        );
        mockSettings({ $130: '300', $131: '300', $22: '1' }); // origin-reset bit unset

        // Whatever homingFlag the caller passes, grblHAL should force it to
        // match the $22 bit — so both calls produce identical XY movement.
        const withTrue = getMovementGCode(FRONT_RIGHT, '2', true, 1);
        const withFalse = getMovementGCode(FRONT_RIGHT, '2', false, 1);
        expect(withTrue[1]).toBe(withFalse[1]);
    });

    it('does not override homingFlag for plain grbl controllers', () => {
        mockPrefGet.mockImplementation((...args: any[]) => args[1]); // 'grbl'
        mockSettings({ $130: '300', $131: '300', $22: '1' });

        const withTrue = getMovementGCode(FRONT_RIGHT, '2', true, 1);
        const withFalse = getMovementGCode(FRONT_RIGHT, '2', false, 1);
        expect(withTrue[1]).not.toBe(withFalse[1]);
    });
});

describe('getMovementGCode - XY corner movement (unaffected by the Z-retract fix)', () => {
    beforeEach(() => {
        mockSettings({ $130: '300', $131: '200', $22: '9' });
    });

    it('moves to the pull-off offset for the corner matching the home position', () => {
        const gcode = getMovementGCode(BACK_RIGHT, '0', true, 1); // setting 0 = BACK_RIGHT
        expect(gcode[1]).toBe('G53 G21 G0 X-1 Y-1');
    });

    it('moves to the far machine limit for the opposite corner', () => {
        const gcode = getMovementGCode(FRONT_LEFT, '0', true, 1);
        expect(gcode[1]).toBe('G53 G21 G0 X-299 Y-199');
    });

    it('treats homingFlag=false as unhomed and always computes from BACK_RIGHT', () => {
        const unhomed = getMovementGCode(FRONT_RIGHT, '2', false, 1); // setting 2 would normally be FRONT_RIGHT
        const explicitBackRight = getMovementGCode(FRONT_RIGHT, '0', true, 1);
        expect(unhomed[1]).toBe(explicitBackRight[1]);
    });

    it('returns an empty array when machine travel limits ($130/$131) are missing', () => {
        mockSettings({ $22: '9' });
        const gcode = getMovementGCode(FRONT_RIGHT, '0', true, 1);
        expect(gcode).toEqual([]);
    });
});
