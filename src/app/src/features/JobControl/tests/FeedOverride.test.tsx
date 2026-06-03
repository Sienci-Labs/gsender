import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Overrides from '../FeedOverride';

// ─── Mocks ───────────────────────────────────────────────────────────────────

jest.mock('app/lib/controller', () => ({
    __esModule: true,
    default: { command: jest.fn() },
}));

jest.mock('app/lib/units', () => ({
    mapPositionToUnits: jest.fn((value) => value),
}));

jest.mock('app/hooks/useWorkspaceState.ts', () => ({
    useWorkspaceState: jest.fn(() => ({ units: 'mm' })),
}));

const mockStoreData: Record<string, unknown> = {
    'workspace.spindleFunctions': true,
    'widgets.spindle.mode': 'spindle',
};

jest.mock('app/store', () => ({
    __esModule: true,
    default: {
        get: jest.fn((key: string) => mockStoreData[key]),
        on: jest.fn(),
        removeListener: jest.fn(),
    },
}));

jest.mock('app/components/RangeSlider', () => ({
    __esModule: true,
    default: ({
        id,
        title,
        disabled,
        onChange,
        onButtonPress,
        onLostPointerCapture,
        onPointerUp,
        value,
        percentage,
    }: any) => (
        <div data-testid={id}>
            <span data-testid={`${id}-title`}>{title}</span>
            <span data-testid={`${id}-value`}>{value}</span>
            <span data-testid={`${id}-pct`}>{percentage?.[0]}</span>
            <span data-testid={`${id}-disabled`}>{String(disabled)}</span>
            <button data-testid={`${id}-change`} onClick={() => onChange?.([75])}>change</button>
            <button data-testid={`${id}-press`} onClick={() => onButtonPress?.([80])}>press</button>
            {onLostPointerCapture && (
                <button data-testid={`${id}-lost-pointer`} onClick={() => onLostPointerCapture?.({})}>lost pointer</button>
            )}
            {onPointerUp && (
                <button data-testid={`${id}-pointer-up`} onClick={() => onPointerUp?.({})}>pointer up</button>
            )}
        </div>
    ),
}));

// ─── Default props ────────────────────────────────────────────────────────────

const defaultProps = {
    ovF: 100,
    ovS: 100,
    ovTimestamp: 1000,
    feedrate: '1000',
    spindle: '12000',
    isConnected: true,
};

const renderOverrides = (props = {}) =>
    render(<Overrides {...defaultProps} {...props} />);

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Overrides', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        mockStoreData['workspace.spindleFunctions'] = true;
        mockStoreData['widgets.spindle.mode'] = 'spindle';
    });

    // ── Rendering ─────────────────────────────────────────────────────────────

    describe('rendering', () => {
        it('renders without crashing', () => {
            renderOverrides();
        });

        it('renders feed override slider', () => {
            renderOverrides();
            expect(screen.getByTestId('feed-override')).toBeInTheDocument();
        });

        it('renders spindle override slider when spindleFunctions is true', () => {
            renderOverrides();
            expect(screen.getByTestId('spindle-override')).toBeInTheDocument();
        });

        it('does NOT render spindle override when spindleFunctions is false', () => {
            mockStoreData['workspace.spindleFunctions'] = false;
            renderOverrides();
            expect(screen.queryByTestId('spindle-override')).not.toBeInTheDocument();
        });

        it('renders Feed title on feed slider', () => {
            renderOverrides();
            expect(screen.getByTestId('feed-override-title')).toHaveTextContent('Feed');
        });

        it('renders Spindle title when mode is spindle', () => {
            mockStoreData['widgets.spindle.mode'] = 'spindle';
            renderOverrides();
            expect(screen.getByTestId('spindle-override-title')).toHaveTextContent('Spindle');
        });

        it('renders Laser title when mode is laser', () => {
            mockStoreData['widgets.spindle.mode'] = 'laser';
            renderOverrides();
            expect(screen.getByTestId('spindle-override-title')).toHaveTextContent('Laser');
        });
    });

    // ── Connected / disabled state ─────────────────────────────────────────────

    describe('connected state', () => {
        it('feed slider is enabled when connected', () => {
            renderOverrides({ isConnected: true });
            expect(screen.getByTestId('feed-override-disabled')).toHaveTextContent('false');
        });

        it('feed slider is disabled when not connected', () => {
            renderOverrides({ isConnected: false });
            expect(screen.getByTestId('feed-override-disabled')).toHaveTextContent('true');
        });

        it('spindle slider is enabled when connected', () => {
            renderOverrides({ isConnected: true });
            expect(screen.getByTestId('spindle-override-disabled')).toHaveTextContent('false');
        });

        it('spindle slider is disabled when not connected', () => {
            renderOverrides({ isConnected: false });
            expect(screen.getByTestId('spindle-override-disabled')).toHaveTextContent('true');
        });
    });

    // ── Feed override interactions ─────────────────────────────────────────────

    describe('feed override interactions', () => {
        it('updates localOvF when feed onChange fires', () => {
            renderOverrides();
            fireEvent.click(screen.getByTestId('feed-override-change'));
            expect(screen.getByTestId('feed-override-pct')).toHaveTextContent('75');
        });

        it('calls feedOverride command on feed onButtonPress', () => {
            jest.useFakeTimers();
            const controller = require('app/lib/controller').default;
            renderOverrides();
            fireEvent.click(screen.getByTestId('feed-override-press'));
            act(() => { jest.advanceTimersByTime(1000); });
            expect(controller.command).toHaveBeenCalledWith('feedOverride', 80);
            jest.useRealTimers();
        });

        it('calls feedOverride command on onLostPointerCapture', () => {
            jest.useFakeTimers();
            const controller = require('app/lib/controller').default;
            renderOverrides();
            fireEvent.click(screen.getByTestId('feed-override-lost-pointer'));
            act(() => { jest.advanceTimersByTime(1000); });
            expect(controller.command).toHaveBeenCalledWith('feedOverride', expect.any(Number));
            jest.useRealTimers();
        });

        it('passes feedrate value to feed slider', () => {
            renderOverrides({ feedrate: '2000' });
            expect(screen.getByTestId('feed-override-value')).toHaveTextContent('2000');
        });

        it('passes ovF percentage to feed slider', () => {
            renderOverrides({ ovF: 110 });
            expect(screen.getByTestId('feed-override-pct')).toHaveTextContent('110');
        });
    });

    // ── Spindle override interactions ──────────────────────────────────────────

    describe('spindle override interactions', () => {
        it('updates localOvS when spindle onChange fires', () => {
            renderOverrides();
            fireEvent.click(screen.getByTestId('spindle-override-change'));
            expect(screen.getByTestId('spindle-override-pct')).toHaveTextContent('75');
        });

        it('calls spindleOverride command on spindle onButtonPress', () => {
            jest.useFakeTimers();
            const controller = require('app/lib/controller').default;
            renderOverrides();
            fireEvent.click(screen.getByTestId('spindle-override-press'));
            act(() => { jest.advanceTimersByTime(1500); });
            expect(controller.command).toHaveBeenCalledWith('spindleOverride', 80);
            jest.useRealTimers();
        });

        it('calls spindleOverride command on onPointerUp', () => {
            jest.useFakeTimers();
            const controller = require('app/lib/controller').default;
            renderOverrides();
            fireEvent.click(screen.getByTestId('spindle-override-pointer-up'));
            act(() => { jest.advanceTimersByTime(1500); });
            expect(controller.command).toHaveBeenCalledWith('spindleOverride', expect.any(Number));
            jest.useRealTimers();
        });

        it('passes spindle value to spindle slider', () => {
            renderOverrides({ spindle: '8000' });
            expect(screen.getByTestId('spindle-override-value')).toHaveTextContent('8000');
        });

        it('passes ovS percentage to spindle slider', () => {
            renderOverrides({ ovS: 90 });
            expect(screen.getByTestId('spindle-override-pct')).toHaveTextContent('90');
        });
    });

    // ── Units conversion ───────────────────────────────────────────────────────

    describe('units conversion', () => {
        it('calls mapPositionToUnits when units are imperial', () => {
            const { useWorkspaceState } = require('app/hooks/useWorkspaceState.ts');
            useWorkspaceState.mockReturnValue({ units: 'in' });
            const { mapPositionToUnits } = require('app/lib/units');
            renderOverrides({ feedrate: '100' });
            expect(mapPositionToUnits).toHaveBeenCalledWith('100', 'in');
        });

        it('does NOT call mapPositionToUnits when units are metric', () => {
            const { useWorkspaceState } = require('app/hooks/useWorkspaceState.ts');
            useWorkspaceState.mockReturnValue({ units: 'mm' });
            const { mapPositionToUnits } = require('app/lib/units');
            renderOverrides({ feedrate: '1000' });
            expect(mapPositionToUnits).not.toHaveBeenCalled();
        });
    });

    // ── Store event listener ───────────────────────────────────────────────────

    describe('store event listener', () => {
        it('registers store change listener on mount', () => {
            const store = require('app/store').default;
            renderOverrides();
            expect(store.on).toHaveBeenCalledWith('change', expect.any(Function));
        });

        it('removes store change listener on unmount', () => {
            const store = require('app/store').default;
            const { unmount } = renderOverrides();
            unmount();
            expect(store.removeListener).toHaveBeenCalledWith('change', expect.any(Function));
        });

        it('updates spindle label to Laser when store changes to laser mode', () => {
            const store = require('app/store').default;
            let changeHandler: () => void;
            store.on.mockImplementation((event: string, handler: () => void) => {
                if (event === 'change') changeHandler = handler;
            });
            store.get.mockImplementation((key: string) => {
                if (key === 'workspace.spindleFunctions') return true;
                if (key === 'widgets.spindle.mode') return 'laser';
                return mockStoreData[key];
            });
            renderOverrides();
            act(() => { changeHandler?.(); });
            expect(screen.getByTestId('spindle-override-title')).toHaveTextContent('Laser');
        });
    });

    // ── Layout ─────────────────────────────────────────────────────────────────

    describe('layout', () => {
        it('uses grid layout when spindle override is shown', () => {
            const { container } = renderOverrides();
            const wrapper = container.firstChild as HTMLElement;
            expect(wrapper.className).toContain('grid');
        });

 it('uses flex layout when spindle override is hidden', () => {
    const store = require('app/store').default;
    store.get.mockImplementation((key: string) => {
        if (key === 'workspace.spindleFunctions') return false;
        if (key === 'widgets.spindle.mode') return 'spindle';
        return undefined;
    });
    const { container } = renderOverrides();
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('flex');
});
    });

});