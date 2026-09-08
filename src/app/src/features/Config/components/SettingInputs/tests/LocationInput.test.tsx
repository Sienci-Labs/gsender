import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { LocationInput } from 'app/features/Config/components/SettingInputs/LocationInput';

// gsender#911: the "Go To" button's safe-retract used to be hardcoded
// "G53 G0 Z-1", which falls outside the soft-limit envelope on machines
// where $27 (pull-off) > 1 and the firmware doesn't reset machine origin
// to 0 after homing.

jest.mock('app/lib/controller.ts', () => ({
    __esModule: true,
    default: { command: jest.fn() },
}));

const controller = require('app/lib/controller.ts').default;
const mockCommand = controller.command as jest.Mock;

function makeStore(settings: Record<string, string>, isConnected = true) {
    const state = {
        controller: {
            mpos: { x: 0, y: 0, z: 0 },
            settings: { settings },
        },
        connection: { isConnected },
    };
    return {
        getState: () => state,
        subscribe: () => () => {},
        dispatch: () => {},
    };
}

function renderLocationInput(
    settings: Record<string, string>,
    value = { x: 10, y: 20, z: -5 },
) {
    return render(
        <Provider store={makeStore(settings) as any}>
            <LocationInput value={value} onChange={() => {}} unit="mm" />
        </Provider>,
    );
}

function clickGoTo() {
    const goToButton = screen
        .getAllByRole('button')
        .find((btn) => btn.textContent?.includes('Go To'));
    if (!goToButton) throw new Error('Go To button not found');
    fireEvent.click(goToButton);
}

function lastGcode(): string[] {
    const call = mockCommand.mock.calls[mockCommand.mock.calls.length - 1];
    return call[1] as string[];
}

beforeEach(() => {
    jest.clearAllMocks();
});

describe('LocationInput Go To (gsender#911)', () => {
    it('retracts to Z-1 when $22 has the origin-reset bit set', () => {
        renderLocationInput({ $22: '9', $27: '2' });
        clickGoTo();
        expect(lastGcode()[0]).toBe('G53 G0 Z-1');
    });

    it('retracts to Z-<pullOff> when the origin-reset bit is not set', () => {
        renderLocationInput({ $22: '1', $27: '2' });
        clickGoTo();
        expect(lastGcode()[0]).toBe('G53 G0 Z-2');
    });

    it('defaults pull-off to 1 (not NaN) when $27 is missing', () => {
        renderLocationInput({ $22: '1' });
        clickGoTo();
        expect(lastGcode()[0]).toBe('G53 G0 Z-1');
    });

    it('moves to the entered X/Y/Z location after the safe retract', () => {
        renderLocationInput({ $22: '9' });
        clickGoTo();
        const code = lastGcode();
        expect(code[1]).toBe('G53 G0 X10 Y20');
        expect(code[2]).toBe('G53 G0 Z-5');
    });

    it('disables Go To when not connected', () => {
        render(
            <Provider store={makeStore({ $22: '9' }, false) as any}>
                <LocationInput
                    value={{ x: 0, y: 0, z: 0 }}
                    onChange={() => {}}
                    unit="mm"
                />
            </Provider>,
        );
        const goToButton = screen
            .getAllByRole('button')
            .find((btn) => btn.textContent?.includes('Go To'));
        expect(goToButton).toBeDisabled();
    });
});
