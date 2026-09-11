import { jest } from '@jest/globals';
import { goToParkLocation } from 'app/features/DRO/component/Parking';

// gsender#911: the Park button used to send a hardcoded "G53 G21 G0 Z-1"
// safe-retract, which falls outside the soft-limit envelope on machines
// where $27 (pull-off) > 1 and the firmware doesn't reset machine origin
// to 0 after homing (grblHAL $22 bit 3 unset, or older grbl builds).

jest.mock('app/store/redux', () => {
    const getState = jest.fn();
    const dispatch = jest.fn();
    return { __esModule: true, default: { getState, dispatch } };
});

jest.mock('app/store', () => ({
    __esModule: true,
    default: {
        get: jest.fn(),
    },
}));

jest.mock('app/lib/controller.ts', () => ({
    __esModule: true,
    default: { command: jest.fn() },
}));

const reduxStore = require('app/store/redux').default;
const store = require('app/store').default;
const controller = require('app/lib/controller.ts').default;

const mockGetState = reduxStore.getState as jest.Mock;
const mockStoreGet = store.get as jest.Mock;
const mockCommand = controller.command as jest.Mock;

function mockSettings(settings: Record<string, string>) {
    mockGetState.mockReturnValue({
        controller: { settings: { settings } },
    });
}

function lastGcode(): string[] {
    const call = mockCommand.mock.calls[mockCommand.mock.calls.length - 1];
    return call[1] as string[];
}

beforeEach(() => {
    jest.clearAllMocks();
    mockStoreGet.mockReturnValue({ x: 10, y: 20, z: -5 });
});

describe('goToParkLocation (gsender#911)', () => {
    it('retracts to Z-1 when $22 has the origin-reset bit set', () => {
        mockSettings({ $22: '9', $27: '2' });
        goToParkLocation();
        expect(lastGcode()[0]).toBe('G53 G21 G0 Z-1');
    });

    it('retracts to Z-<pullOff> when the origin-reset bit is not set', () => {
        mockSettings({ $22: '1', $27: '2' });
        goToParkLocation();
        expect(lastGcode()[0]).toBe('G53 G21 G0 Z-2');
    });

    it('defaults pull-off to 1 (not NaN) when $27 is missing', () => {
        mockSettings({ $22: '1' });
        goToParkLocation();
        expect(lastGcode()[0]).toBe('G53 G21 G0 Z-1');
    });

    it('still moves to the park X/Y then Z after the safe retract', () => {
        mockSettings({ $22: '9' });
        goToParkLocation();
        const code = lastGcode();
        expect(code[1]).toBe('G53 G21 G0 X10 Y20');
        expect(code[2]).toBe('G53 G21 G0 Z-5');
    });

    it('sends the gcode via controller.command with the "gcode" command name', () => {
        mockSettings({ $22: '9' });
        goToParkLocation();
        expect(mockCommand).toHaveBeenCalledWith('gcode', expect.any(Array));
    });
});
