import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { ManualToolChangePosition } from 'app/features/AccessoryInstaller/Wizards/tls/components/ManualToolChangePosition';

// gsender#911: the manual tool-change "Go To" used to send a hardcoded
// "G53 G21 G0 Z-1" safe-retract, which falls outside the soft-limit
// envelope on machines where $27 (pull-off) > 1 and the firmware doesn't
// reset machine origin to 0 after homing.

jest.mock('app/lib/controller.ts', () => ({
    __esModule: true,
    default: { command: jest.fn() },
}));

jest.mock('app/store', () => ({
    __esModule: true,
    default: {
        get: jest.fn((key: string, defaultVal: unknown) =>
            key === 'workspace' ? { units: 'mm' } : defaultVal,
        ),
        on: jest.fn(),
        set: jest.fn(),
    },
}));

const controller = require('app/lib/controller.ts').default;
const mockCommand = controller.command as jest.Mock;

function makeStore(settings: Record<string, string>) {
    const state = {
        controller: {
            mpos: { x: 0, y: 0, z: 0 },
            homingFlag: false,
            settings: { settings },
        },
    };
    return {
        getState: () => state,
        subscribe: () => () => {},
        dispatch: () => {},
    };
}

function renderStep(settings: Record<string, string>) {
    return render(
        <Provider store={makeStore(settings) as any}>
            <ManualToolChangePosition
                onComplete={() => {}}
                onUncomplete={() => {}}
            />
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

describe('ManualToolChangePosition Go To (gsender#911)', () => {
    it('retracts to Z-1 when $22 has the origin-reset bit set', () => {
        renderStep({ $22: '9', $27: '2' });
        clickGoTo();
        expect(lastGcode()[0]).toBe('G53 G21 G0 Z-1');
    });

    it('retracts to Z-<pullOff> when the origin-reset bit is not set', () => {
        renderStep({ $22: '1', $27: '2' });
        clickGoTo();
        expect(lastGcode()[0]).toBe('G53 G21 G0 Z-2');
    });

    it('defaults pull-off to 1 (not NaN) when $27 is missing', () => {
        renderStep({ $22: '1' });
        clickGoTo();
        expect(lastGcode()[0]).toBe('G53 G21 G0 Z-1');
    });
});
