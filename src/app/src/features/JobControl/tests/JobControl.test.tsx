import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ControlButton from '../ControlButton';
import controller from 'app/lib/controller';
import pubsub from 'pubsub-js';

// ─── Mocks ───────────────────────────────────────────────────────────────────

jest.mock('app/lib/controller', () => ({
    command: jest.fn(),
}));

jest.mock('pubsub-js', () => ({
    publish: jest.fn(),
}));

jest.mock('app/lib/useKeybinding', () => jest.fn());
jest.mock('app/hooks/useShuttleEvents', () => jest.fn());
jest.mock('app/hooks/useTypedSelector', () => ({
    useTypedSelector: jest.fn(() => undefined),
}));

jest.mock('@posthog/react', () => ({
    usePostHog: () => ({ capture: jest.fn() }),
}));

jest.mock('app/store/redux', () => ({
    default: {
        getState: jest.fn(() => ({
            connection: { isConnected: true },
            file: { fileLoaded: true },
            controller: {
                state: { status: { activeState: 'Idle' } },
                workflow: { state: 'idle' },
                type: 'Grbl',
            },
        })),
    },
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

const defaultProps = {
    isConnected: true,
    fileLoaded: true,
    onStop: jest.fn(),
    validateATC: jest.fn(() => [false, null]),
};

const idleWorkflow = { state: 'idle' as const };
const runningWorkflow = { state: 'running' as const };
const pausedWorkflow = { state: 'paused' as const };

const defaultReduxState = {
    connection: { isConnected: true },
    file: { fileLoaded: true },
    controller: {
        state: { status: { activeState: 'Idle' } },
        workflow: { state: 'idle' },
        type: 'Grbl',
    },
};


// ─── isDisabled logic ────────────────────────────────────────────────────────

describe('ControlButton — disabled state', () => {
    it('START is disabled when not connected', () => {
        render(
            <ControlButton
                {...defaultProps}
                type="START"
                isConnected={false}
                fileLoaded={true}
                workflow={idleWorkflow}
                activeState="Idle"
            />
        );
        expect(screen.getByRole('button')).toBeDisabled();
    });

    it('START is disabled when no file loaded', () => {
        render(
            <ControlButton
                {...defaultProps}
                type="START"
                isConnected={true}
                fileLoaded={false}
                workflow={idleWorkflow}
                activeState="Idle"
            />
        );
        expect(screen.getByRole('button')).toBeDisabled();
    });

    it('START is enabled when connected, file loaded, idle state', () => {
        render(
            <ControlButton
                {...defaultProps}
                type="START"
                workflow={idleWorkflow}
                activeState="Idle"
            />
        );
        expect(screen.getByRole('button')).not.toBeDisabled();
    });

    it('START is enabled when activeState is Hold', () => {
        render(
            <ControlButton
                {...defaultProps}
                type="START"
                workflow={idleWorkflow}
                activeState="Hold"
            />
        );
        expect(screen.getByRole('button')).not.toBeDisabled();
    });

    it('START is enabled when activeState is Check', () => {
        render(
            <ControlButton
                {...defaultProps}
                type="START"
                workflow={idleWorkflow}
                activeState="Check"
            />
        );
        expect(screen.getByRole('button')).not.toBeDisabled();
    });

    it('START is disabled when workflow is running', () => {
        render(
            <ControlButton
                {...defaultProps}
                type="START"
                workflow={runningWorkflow}
                activeState="Idle"
            />
        );
        expect(screen.getByRole('button')).toBeDisabled();
    });

    it('PAUSE is enabled when running and activeState is Run', () => {
        render(
            <ControlButton
                {...defaultProps}
                type="PAUSE"
                workflow={runningWorkflow}
                activeState="Run"
            />
        );
        expect(screen.getByRole('button')).not.toBeDisabled();
    });

    it('PAUSE is enabled when paused and activeState is Hold', () => {
        render(
            <ControlButton
                {...defaultProps}
                type="PAUSE"
                workflow={pausedWorkflow}
                activeState="Hold"
            />
        );
        expect(screen.getByRole('button')).not.toBeDisabled();
    });

    it('PAUSE is disabled when workflow is idle', () => {
        render(
            <ControlButton
                {...defaultProps}
                type="PAUSE"
                workflow={idleWorkflow}
                activeState="Idle"
            />
        );
        expect(screen.getByRole('button')).toBeDisabled();
    });

    it('STOP is enabled when workflow is running', () => {
        render(
            <ControlButton
                {...defaultProps}
                type="STOP"
                workflow={runningWorkflow}
                activeState="Run"
            />
        );
        expect(screen.getByRole('button')).not.toBeDisabled();
    });

    it('STOP is enabled when workflow is paused', () => {
        render(
            <ControlButton
                {...defaultProps}
                type="STOP"
                workflow={pausedWorkflow}
                activeState="Hold"
            />
        );
        expect(screen.getByRole('button')).not.toBeDisabled();
    });

    it('STOP is disabled when workflow is idle', () => {
        render(
            <ControlButton
                {...defaultProps}
                type="STOP"
                workflow={idleWorkflow}
                activeState="Idle"
            />
        );
        expect(screen.getByRole('button')).toBeDisabled();
    });
});


// ─── Rendering ───────────────────────────────────────────────────────────────

describe('ControlButton — rendering', () => {
    it('renders Start label', () => {
        render(
            <ControlButton
                {...defaultProps}
                type="START"
                workflow={idleWorkflow}
                activeState="Idle"
            />
        );
        expect(screen.getByText('Start')).toBeInTheDocument();
    });

    it('renders Pause label', () => {
        render(
            <ControlButton
                {...defaultProps}
                type="PAUSE"
                workflow={runningWorkflow}
                activeState="Run"
            />
        );
        expect(screen.getByText('Pause')).toBeInTheDocument();
    });

    it('renders Stop label', () => {
        render(
            <ControlButton
                {...defaultProps}
                type="STOP"
                workflow={runningWorkflow}
                activeState="Run"
            />
        );
        expect(screen.getByText('Stop')).toBeInTheDocument();
    });
});


// ─── handleRun ───────────────────────────────────────────────────────────────

describe('ControlButton — handleRun (START)', () => {
    beforeEach(() => {
        (controller.command as jest.Mock).mockClear();
    });

    it('sends gcode:start when idle workflow and idle state', () => {
        render(
            <ControlButton
                {...defaultProps}
                type="START"
                workflow={idleWorkflow}
                activeState="Idle"
            />
        );
        fireEvent.click(screen.getByRole('button'));
        expect(controller.command).toHaveBeenCalledWith('gcode:start');
    });

    it('sends gcode:resume when workflow is paused', () => {
        render(
            <ControlButton
                {...defaultProps}
                type="START"
                workflow={pausedWorkflow}
                activeState="Hold"
            />
        );
        fireEvent.click(screen.getByRole('button'));
        expect(controller.command).toHaveBeenCalledWith('gcode:resume');
    });

    it('sends gcode:resume when activeState is Hold', () => {
        render(
            <ControlButton
                {...defaultProps}
                type="START"
                workflow={idleWorkflow}
                activeState="Hold"
            />
        );
        fireEvent.click(screen.getByRole('button'));
        expect(controller.command).toHaveBeenCalledWith('gcode:resume');
    });

    it('sends gcode check mode command when activeState is Check', () => {
        render(
            <ControlButton
                {...defaultProps}
                type="START"
                workflow={idleWorkflow}
                activeState="Check"
            />
        );
        fireEvent.click(screen.getByRole('button'));
        expect(controller.command).toHaveBeenCalledWith(
            'gcode',
            '%global.state.testWCS=modal.wcs',
        );
    });

    it('publishes atc_validator when ATC validation fails', () => {
        const payload = { type: 'error', title: 'ATC Error', body: <div /> };
        render(
            <ControlButton
                {...defaultProps}
                type="START"
                workflow={idleWorkflow}
                activeState="Idle"
                validateATC={() => [true, payload]}
            />
        );
        fireEvent.click(screen.getByRole('button'));
        expect(pubsub.publish).toHaveBeenCalledWith('atc_validator', payload);
        expect(controller.command).not.toHaveBeenCalledWith('gcode:start');
    });
});


// ─── handlePause ─────────────────────────────────────────────────────────────

describe('ControlButton — handlePause (PAUSE)', () => {
    beforeEach(() => {
        (controller.command as jest.Mock).mockClear();
    });

    it('sends gcode:pause when clicked', () => {
        render(
            <ControlButton
                {...defaultProps}
                type="PAUSE"
                workflow={runningWorkflow}
                activeState="Run"
            />
        );
        fireEvent.click(screen.getByRole('button'));
        expect(controller.command).toHaveBeenCalledWith('gcode:pause');
    });
});


// ─── handleStop ──────────────────────────────────────────────────────────────

describe('ControlButton — handleStop (STOP)', () => {
    beforeEach(() => {
        (controller.command as jest.Mock).mockClear();
        defaultProps.onStop.mockClear();
    });

    it('calls onStop and sends gcode:stop when clicked', () => {
        render(
            <ControlButton
                {...defaultProps}
                type="STOP"
                workflow={runningWorkflow}
                activeState="Run"
            />
        );
        fireEvent.click(screen.getByRole('button'));
        expect(defaultProps.onStop).toHaveBeenCalled();
        expect(controller.command).toHaveBeenCalledWith('gcode:stop', { force: true });
    });

    it('sends $C gcode when stopped in Check mode', () => {
        render(
            <ControlButton
                {...defaultProps}
                type="STOP"
                workflow={runningWorkflow}
                activeState="Check"
            />
        );
        fireEvent.click(screen.getByRole('button'));
        expect(controller.command).toHaveBeenCalledWith('gcode', '$C');
    });

    it('does not send $C gcode when stopped outside Check mode', () => {
        render(
            <ControlButton
                {...defaultProps}
                type="STOP"
                workflow={runningWorkflow}
                activeState="Run"
            />
        );
        fireEvent.click(screen.getByRole('button'));
        expect(controller.command).not.toHaveBeenCalledWith('gcode', '$C');
    });
});


// SD File Running

describe('ControlButton — SD file detection', () => {
    it('disables START when SD file is running', () => {
        const { useTypedSelector } = require('app/hooks/useTypedSelector');
        useTypedSelector.mockReturnValue('file.nc');
        render(
            <ControlButton
                {...defaultProps}
                type="START"
                workflow={idleWorkflow}
                activeState="Idle"
            />
        );
        expect(screen.getByRole('button')).toBeDisabled();
    });

    it('enables START when SD file is not running', () => {
        const { useTypedSelector } = require('app/hooks/useTypedSelector');
        useTypedSelector.mockReturnValue(undefined);
        render(
            <ControlButton
                {...defaultProps}
                type="START"
                workflow={idleWorkflow}
                activeState="Idle"
            />
        );
        expect(screen.getByRole('button')).not.toBeDisabled();
    });
});


describe.skip('ControlButton — shuttle callbacks', () => {
    let shuttleEvents: Record<string, any>;
    const mockReduxStore = require('app/store/redux').default;

    beforeEach(() => {
        (controller.command as jest.Mock).mockClear();
        (pubsub.publish as jest.Mock).mockClear();
        defaultProps.onStop.mockClear();

        // Reset getState to a known default implementation before every test
        // so that individual tests which call mockImplementation don't bleed
        // into subsequent tests, causing getState to not be callable.
        mockReduxStore.getState.mockImplementation(() => defaultReduxState);

        const useShuttleEvents = require('app/hooks/useShuttleEvents');
        useShuttleEvents.mockImplementation((events: any) => {
            shuttleEvents = events;
        });
    });

    it('START shuttle callback calls handleRun when not disabled', () => {
        mockReduxStore.getState.mockImplementation(() => ({
            connection: { isConnected: true },
            file: { fileLoaded: true },
            controller: {
                state: { status: { activeState: 'Idle' } },
                workflow: { state: 'idle' },
                type: 'Grbl',
            },
        }));
        render(
            <ControlButton
                {...defaultProps}
                type="START"
                workflow={idleWorkflow}
                activeState="Idle"
            />
        );
        shuttleEvents?.START_JOB?.callback();
        expect(controller.command).toHaveBeenCalledWith('gcode:start');
    });

    it('START shuttle callback returns early when disabled', () => {
        mockReduxStore.getState.mockImplementation(() => ({
            connection: { isConnected: false },
            file: { fileLoaded: false },
            controller: {
                state: { status: { activeState: 'Idle' } },
                workflow: { state: 'idle' },
                type: 'Grbl',
            },
        }));
        render(
            <ControlButton
                {...defaultProps}
                type="START"
                workflow={idleWorkflow}
                activeState="Idle"
            />
        );
        shuttleEvents?.START_JOB?.callback();
        expect(controller.command).not.toHaveBeenCalled();
    });

    it('RUN_OUTLINE shuttle callback publishes outline:start when not disabled', () => {
        mockReduxStore.getState.mockImplementation(() => ({
            connection: { isConnected: true },
            file: { fileLoaded: true },
            controller: {
                state: { status: { activeState: 'Idle' } },
                workflow: { state: 'idle' },
                type: 'Grbl',
            },
        }));
        render(
            <ControlButton
                {...defaultProps}
                type="START"
                workflow={idleWorkflow}
                activeState="Idle"
            />
        );
        shuttleEvents?.RUN_OUTLINE?.callback();
        expect(pubsub.publish).toHaveBeenCalledWith('outline:start');
    });

    it('RUN_OUTLINE shuttle callback returns early when disabled', () => {
        mockReduxStore.getState.mockImplementation(() => ({
            connection: { isConnected: false },
            file: { fileLoaded: false },
            controller: {
                state: { status: { activeState: 'Idle' } },
                workflow: { state: 'idle' },
                type: 'Grbl',
            },
        }));
        render(
            <ControlButton
                {...defaultProps}
                type="START"
                workflow={idleWorkflow}
                activeState="Idle"
            />
        );
        shuttleEvents?.RUN_OUTLINE?.callback();
        expect(pubsub.publish).not.toHaveBeenCalled();
    });

    it('PAUSE shuttle callback calls handlePause when not disabled', () => {
        mockReduxStore.getState.mockImplementation(() => ({
            connection: { isConnected: true },
            file: { fileLoaded: true },
            controller: {
                state: { status: { activeState: 'Run' } },
                workflow: { state: 'running' },
                type: 'Grbl',
            },
        }));
        render(
            <ControlButton
                {...defaultProps}
                type="PAUSE"
                workflow={runningWorkflow}
                activeState="Run"
            />
        );
        shuttleEvents?.PAUSE_JOB?.callback();
        expect(controller.command).toHaveBeenCalledWith('gcode:pause');
    });

    it('PAUSE shuttle callback returns early when disabled', () => {
        mockReduxStore.getState.mockImplementation(() => ({
            connection: { isConnected: false },
            file: { fileLoaded: false },
            controller: {
                state: { status: { activeState: 'Idle' } },
                workflow: { state: 'idle' },
                type: 'Grbl',
            },
        }));
        render(
            <ControlButton
                {...defaultProps}
                type="PAUSE"
                workflow={idleWorkflow}
                activeState="Idle"
            />
        );
        shuttleEvents?.PAUSE_JOB?.callback();
        expect(controller.command).not.toHaveBeenCalled();
    });

    it('STOP shuttle cancels jog when disabled and activeState is Jog', () => {
        mockReduxStore.getState.mockImplementation(() => ({
            connection: { isConnected: true },
            file: { fileLoaded: true },
            controller: {
                state: { status: { activeState: 'Jog' } },
                workflow: { state: 'idle' },
                type: 'Grbl',
            },
        }));
        render(
            <ControlButton
                {...defaultProps}
                type="STOP"
                workflow={idleWorkflow}
                activeState="Jog"
            />
        );
        shuttleEvents?.STOP_JOB?.callback();
        expect(controller.command).toHaveBeenCalledWith('jog:cancel');
    });

    it('STOP shuttle does nothing when disabled and activeState is Idle', () => {
        mockReduxStore.getState.mockImplementation(() => ({
            connection: { isConnected: true },
            file: { fileLoaded: true },
            controller: {
                state: { status: { activeState: 'Idle' } },
                workflow: { state: 'idle' },
                type: 'Grbl',
            },
        }));
        render(
            <ControlButton
                {...defaultProps}
                type="STOP"
                workflow={idleWorkflow}
                activeState="Idle"
            />
        );
        shuttleEvents?.STOP_JOB?.callback();
        expect(controller.command).not.toHaveBeenCalled();
    });

    it('STOP shuttle sends reset:soft when disabled and firmware is grblHAL', () => {
        mockReduxStore.getState.mockImplementation(() => ({
            connection: { isConnected: true },
            file: { fileLoaded: true },
            controller: {
                state: { status: { activeState: 'Alarm' } },
                workflow: { state: 'idle' },
                type: 'grblHAL',
            },
        }));
        render(
            <ControlButton
                {...defaultProps}
                type="STOP"
                workflow={idleWorkflow}
                activeState="Alarm"
            />
        );
        shuttleEvents?.STOP_JOB?.callback();
        expect(controller.command).toHaveBeenCalledWith('reset:soft');
    });

    it('STOP shuttle sends reset when disabled and firmware is Grbl', () => {
        mockReduxStore.getState.mockImplementation(() => ({
            connection: { isConnected: true },
            file: { fileLoaded: true },
            controller: {
                state: { status: { activeState: 'Alarm' } },
                workflow: { state: 'idle' },
                type: 'Grbl',
            },
        }));
        render(
            <ControlButton
                {...defaultProps}
                type="STOP"
                workflow={idleWorkflow}
                activeState="Alarm"
            />
        );
        shuttleEvents?.STOP_JOB?.callback();
        expect(controller.command).toHaveBeenCalledWith('reset');
    });

    it('STOP shuttle calls handleStop when not disabled', () => {
        mockReduxStore.getState.mockImplementation(() => ({
            connection: { isConnected: true },
            file: { fileLoaded: true },
            controller: {
                state: { status: { activeState: 'Run' } },
                workflow: { state: 'running' },
                type: 'Grbl',
            },
        }));
        render(
            <ControlButton
                {...defaultProps}
                type="STOP"
                workflow={runningWorkflow}
                activeState="Run"
            />
        );
        shuttleEvents?.STOP_JOB?.callback();
        expect(defaultProps.onStop).toHaveBeenCalled();
        expect(controller.command).toHaveBeenCalledWith('gcode:stop', { force: true });
    });
});
