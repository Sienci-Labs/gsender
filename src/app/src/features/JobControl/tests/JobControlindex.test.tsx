/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import JobControl from '../index';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('app/lib/controller', () => ({
    __esModule: true,
    default: { command: jest.fn() },
}));

jest.mock('app/hooks/useWorkspaceState.ts', () => ({
    useWorkspaceState: jest.fn(() => ({ units: 'mm' })),
}));

jest.mock('app/store', () => ({
    __esModule: true,
    default: {
        get: jest.fn((key: string) => {
            if (key === 'workspace.spindleFunctions') return true;
            if (key === 'widgets.spindle.mode') return 'spindle';
            return null;
        }),
        on: jest.fn(),
        removeListener: jest.fn(),
    },
}));

jest.mock('app/lib/units', () => ({
    mapPositionToUnits: jest.fn((value) => value),
}));

jest.mock('pubsub-js', () => ({
    subscribe: jest.fn(() => 'token'),
    unsubscribe: jest.fn(),
    publish: jest.fn(),
}));

jest.mock('app/components/Widget', () => ({
    Widget: ({ children }: any) => <div data-testid="widget">{children}</div>,
}));

jest.mock('app/components/RangeSlider', () => ({
    __esModule: true,
    default: ({ id, title, disabled }: any) => (
        <div data-testid={id}>
            <span data-testid={`${id}-title`}>{title}</span>
            <span data-testid={`${id}-disabled`}>{String(disabled)}</span>
        </div>
    ),
}));

jest.mock('../ControlButton', () => ({
    __esModule: true,
    default: ({ type, isConnected, fileLoaded }: any) => (
        <button data-testid={`control-btn-${type}`} disabled={!isConnected || !fileLoaded}>
            {type}
        </button>
    ),
}));

jest.mock('../OutlineButton', () => ({
    __esModule: true,
    default: ({ disabled }: any) => (
        <button data-testid="outline-btn" disabled={disabled}>Outline</button>
    ),
}));

jest.mock('../StartFromLine', () => ({
    __esModule: true,
    default: ({ disabled, lastLine }: any) => (
        <button data-testid="start-from-line" disabled={disabled}>
            Start from {lastLine}
        </button>
    ),
}));

jest.mock('../ProgressArea', () => ({
    __esModule: true,
    default: ({ senderStatus }: any) => (
        <div data-testid="progress-area">{senderStatus?.sent}</div>
    ),
}));

jest.mock('app/features/JobControl/SDCardProgress.tsx', () => ({
    SDCardProgress: () => <div data-testid="sd-card-progress" />,
}));

jest.mock('classnames', () => (...args: any[]) => args.filter(Boolean).join(' '));

// ─── Mock Store ───────────────────────────────────────────────────────────────

const mockStore = configureStore([]);

const defaultStoreState = {
    controller: {
        workflow: { state: 'idle' },
        state: {
            status: {
                activeState: 'Idle',
                ov: [100, 100, 100],
                ovTimestamp: 1000,
                feedrate: '1000',
                spindle: '12000',
                currentTool: -1,
            },
        },
        sender: {
            status: {
                sent: 0,
                finishTime: 0,
                currentLineRunning: 0,
            },
        },
        settings: {
            toolTable: {},
            info: { NEWOPT: { ATC: '0' } },
        },
    },
    connection: { isConnected: true },
    file: {
        fileLoaded: true,
        spindleToolEvents: {},
    },
};

const renderJobControl = (storeState = {}) => {
    const store = mockStore({ ...defaultStoreState, ...storeState });
    return render(
        <Provider store={store}>
            <JobControl />
        </Provider>
    );
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('JobControl', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ── Rendering ─────────────────────────────────────────────────────────────

    describe('rendering', () => {
        it('renders without crashing', () => {
            renderJobControl();
        });

        it('renders SDCardProgress', () => {
            renderJobControl();
            expect(screen.getByTestId('sd-card-progress')).toBeInTheDocument();
        });

        it('renders START control button', () => {
            renderJobControl();
            expect(screen.getByTestId('control-btn-start')).toBeInTheDocument();
        });

        it('renders PAUSE control button', () => {
            renderJobControl();
            expect(screen.getByTestId('control-btn-pause')).toBeInTheDocument();
        });

        it('renders STOP control button', () => {
            renderJobControl();
            expect(screen.getByTestId('control-btn-stop')).toBeInTheDocument();
        });

        it('renders feed override slider', () => {
            renderJobControl();
            expect(screen.getByTestId('feed-override')).toBeInTheDocument();
        });

        it('renders spindle override slider', () => {
            renderJobControl();
            expect(screen.getByTestId('spindle-override')).toBeInTheDocument();
        });

        it('renders OutlineButton', () => {
            renderJobControl();
            expect(screen.getByTestId('outline-btn')).toBeInTheDocument();
        });

        it('renders StartFromLine button', () => {
            renderJobControl();
            expect(screen.getByTestId('start-from-line')).toBeInTheDocument();
        });
    });

    // ── Progress area ──────────────────────────────────────────────────────────

    describe('progress area', () => {
        it('does not render ProgressArea when sent is 0', () => {
            renderJobControl();
            expect(screen.queryByTestId('progress-area')).not.toBeInTheDocument();
        });

        it('renders ProgressArea when connected, file loaded and sent > 0', () => {
            renderJobControl({
                controller: {
                    ...defaultStoreState.controller,
                    sender: {
                        status: {
                            sent: 10,
                            finishTime: 0,
                            currentLineRunning: 5,
                        },
                    },
                },
            });
            expect(screen.getByTestId('progress-area')).toBeInTheDocument();
        });
    });

    // ── Disabled state ─────────────────────────────────────────────────────────

    describe('disabled state', () => {
        it('OutlineButton is disabled when file is not loaded', () => {
            renderJobControl({
                file: { fileLoaded: false, spindleToolEvents: {} },
            });
            expect(screen.getByTestId('outline-btn')).toBeDisabled();
        });

        it('OutlineButton is disabled when workflow is not idle', () => {
            renderJobControl({
                controller: {
                    ...defaultStoreState.controller,
                    workflow: { state: 'running' },
                },
            });
            expect(screen.getByTestId('outline-btn')).toBeDisabled();
        });

        it('OutlineButton is enabled when file loaded and idle', () => {
            renderJobControl();
            expect(screen.getByTestId('outline-btn')).not.toBeDisabled();
        });
    });

    // ── pubsub subscription ────────────────────────────────────────────────────

    describe('pubsub', () => {
        it('subscribes to disconnect:recovery on mount', () => {
            const pubsub = require('pubsub-js');
            renderJobControl();
            expect(pubsub.subscribe).toHaveBeenCalledWith(
                'disconnect:recovery',
                expect.any(Function),
            );
        });

        it('unsubscribes on unmount', () => {
            const pubsub = require('pubsub-js');
            const { unmount } = renderJobControl();
            unmount();
            expect(pubsub.unsubscribe).toHaveBeenCalled();
        });
    });

    // ── Connection state ───────────────────────────────────────────────────────

    describe('connection state', () => {
        it('does not render ProgressArea when not connected', () => {
            renderJobControl({
                connection: { isConnected: false },
            });
            expect(screen.queryByTestId('progress-area')).not.toBeInTheDocument();
        });
    });
});