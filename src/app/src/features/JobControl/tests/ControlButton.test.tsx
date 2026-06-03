import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
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

const mockShuttleEvents: { current: Record<string, any> } = { current: {} };
jest.mock('app/hooks/useShuttleEvents', () =>
    jest.fn((events: any) => {
        if (events) mockShuttleEvents.current = events;
    }),
);

const mockSdName = { current: undefined as string | undefined };
jest.mock('app/hooks/useTypedSelector', () => ({
    useTypedSelector: jest.fn(() => mockSdName.current),
}));

jest.mock('@posthog/react', () => ({
    usePostHog: () => ({ capture: jest.fn() }),
}));

const mockReduxState = {
    current: {
        connection: { isConnected: true },
        file: { fileLoaded: true },
        controller: {
            state: { status: { activeState: 'Idle' } },
            workflow: { state: 'idle' },
            type: 'Grbl',
        },
    },
};

jest.mock('app/store/redux', () => ({
    __esModule: true,
    default: {
        getState: jest.fn(() => mockReduxState.current),
    },
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

const idleWorkflow = { state: 'idle' as const };
const runningWorkflow = { state: 'running' as const };
const pausedWorkflow = { state: 'paused' as const };

const defaultProps = {
    isConnected: true,
    fileLoaded: true,
    onStop: jest.fn(),
    validateATC: jest.fn(() => [false, null] as [boolean, null]),
};

const renderButton = (
    type: 'START' | 'PAUSE' | 'STOP',
    props: Partial<typeof defaultProps & { workflow: any; activeState: any }> = {},
) => {
    return render(
        <ControlButton
            type={type}
            workflow={idleWorkflow}
            activeState="Idle"
            {...defaultProps}
            {...props}
        />,
    );
};

// ─── Reset before each ───────────────────────────────────────────────────────

beforeEach(() => {
    jest.clearAllMocks();
    mockSdName.current = undefined;
    mockShuttleEvents.current = {};
    mockReduxState.current = {
        connection: { isConnected: true },
        file: { fileLoaded: true },
        controller: {
            state: { status: { activeState: 'Idle' } },
            workflow: { state: 'idle' },
            type: 'Grbl',
        },
    };
});

// ── Rendering ─────────────────────────────────────────────────────────────────

describe('rendering', () => {
    it('renders Start label', () => {
        renderButton('START');
        expect(screen.getByText('Start')).toBeInTheDocument();
    });

    it('renders Pause label', () => {
        renderButton('PAUSE', { workflow: runningWorkflow, activeState: 'Run' });
        expect(screen.getByText('Pause')).toBeInTheDocument();
    });

    it('renders Stop label', () => {
        renderButton('STOP', { workflow: runningWorkflow, activeState: 'Run' });
        expect(screen.getByText('Stop')).toBeInTheDocument();
    });
});

// ── Disabled state ─────────────────────────────────────────────────────────────

describe('disabled state', () => {
    it('START is disabled when not connected', () => {
        renderButton('START', { isConnected: false });
        expect(screen.getByRole('button')).toBeDisabled();
    });

    it('START is disabled when file not loaded', () => {
        renderButton('START', { fileLoaded: false });
        expect(screen.getByRole('button')).toBeDisabled();
    });

    it('START is disabled when workflow is running', () => {
        renderButton('START', { workflow: runningWorkflow, activeState: 'Run' });
        expect(screen.getByRole('button')).toBeDisabled();
    });

    it('PAUSE is disabled when workflow is idle', () => {
        renderButton('PAUSE', { workflow: idleWorkflow, activeState: 'Idle' });
        expect(screen.getByRole('button')).toBeDisabled();
    });

    it('STOP is disabled when workflow is idle', () => {
        renderButton('STOP', { workflow: idleWorkflow, activeState: 'Idle' });
        expect(screen.getByRole('button')).toBeDisabled();
    });

    it('has cursor-not-allowed class when disabled', () => {
        renderButton('START', { isConnected: false });
        expect(screen.getByRole('button')).toHaveClass('cursor-not-allowed');
    });
});

// ── Enabled state ──────────────────────────────────────────────────────────────

describe('enabled state', () => {
    it('START is enabled when idle and file loaded', () => {
        renderButton('START', { workflow: idleWorkflow, activeState: 'Idle' });
        expect(screen.getByRole('button')).not.toBeDisabled();
    });

    it('START is enabled when activeState is Hold', () => {
        renderButton('START', { workflow: idleWorkflow, activeState: 'Hold' });
        expect(screen.getByRole('button')).not.toBeDisabled();
    });

    it('START is enabled when activeState is Check', () => {
        renderButton('START', { workflow: idleWorkflow, activeState: 'Check' });
        expect(screen.getByRole('button')).not.toBeDisabled();
    });

    it('PAUSE is enabled when running and activeState is Run', () => {
        renderButton('PAUSE', { workflow: runningWorkflow, activeState: 'Run' });
        expect(screen.getByRole('button')).not.toBeDisabled();
    });

    it('PAUSE is enabled when paused and activeState is Hold', () => {
        renderButton('PAUSE', { workflow: pausedWorkflow, activeState: 'Hold' });
        expect(screen.getByRole('button')).not.toBeDisabled();
    });

    it('STOP is enabled when workflow is running', () => {
        renderButton('STOP', { workflow: runningWorkflow, activeState: 'Run' });
        expect(screen.getByRole('button')).not.toBeDisabled();
    });

    it('STOP is enabled when workflow is paused', () => {
        renderButton('STOP', { workflow: pausedWorkflow, activeState: 'Hold' });
        expect(screen.getByRole('button')).not.toBeDisabled();
    });

    it('START has green background when enabled', () => {
        renderButton('START', { workflow: idleWorkflow, activeState: 'Idle' });
        expect(screen.getByRole('button')).toHaveClass('bg-green-600');
    });

    it('PAUSE has orange background when enabled', () => {
        renderButton('PAUSE', { workflow: runningWorkflow, activeState: 'Run' });
        expect(screen.getByRole('button')).toHaveClass('bg-orange-400');
    });

    it('STOP has red background when enabled', () => {
        renderButton('STOP', { workflow: runningWorkflow, activeState: 'Run' });
        expect(screen.getByRole('button')).toHaveClass('bg-red-500');
    });
});

// ── SD file running — line 81 ──────────────────────────────────────────────────

describe('SD file detection (line 81)', () => {
    it('START is disabled when SD file name is set', async () => {
        mockSdName.current = 'file.nc';
        renderButton('START', { workflow: idleWorkflow, activeState: 'Idle' });
        await act(async () => {});
        expect(screen.getByRole('button')).toBeDisabled();
    });

    it('START is enabled when SD file name is undefined', async () => {
        mockSdName.current = undefined;
        renderButton('START', { workflow: idleWorkflow, activeState: 'Idle' });
        await act(async () => {});
        expect(screen.getByRole('button')).not.toBeDisabled();
    });
});

// ── handleRun — lines 190-216 ─────────────────────────────────────────────────

describe('handleRun (lines 190-216)', () => {
    it('calls gcode:start when workflow is idle and ATC valid', () => {
        renderButton('START', { workflow: idleWorkflow, activeState: 'Idle' });
        fireEvent.click(screen.getByRole('button'));
        expect(controller.command).toHaveBeenCalledWith('gcode:start');
    });

    it('calls gcode:resume when workflow is paused', () => {
        renderButton('START', { workflow: pausedWorkflow, activeState: 'Hold' });
        fireEvent.click(screen.getByRole('button'));
        expect(controller.command).toHaveBeenCalledWith('gcode:resume');
    });

    it('calls gcode:resume when activeState is Hold', () => {
        renderButton('START', { workflow: idleWorkflow, activeState: 'Hold' });
        fireEvent.click(screen.getByRole('button'));
        expect(controller.command).toHaveBeenCalledWith('gcode:resume');
    });

    it('sends WCS test command when activeState is Check', () => {
        renderButton('START', { workflow: idleWorkflow, activeState: 'Check' });
        fireEvent.click(screen.getByRole('button'));
        expect(controller.command).toHaveBeenCalledWith(
            'gcode',
            '%global.state.testWCS=modal.wcs',
        );
    });

    it('publishes atc_validator and does NOT start when ATC is invalid', () => {
        const payload = { type: 'error', title: 'ATC Error', body: <div /> };
        renderButton('START', {
            workflow: idleWorkflow,
            activeState: 'Idle',
            validateATC: jest.fn(() => [true, payload] as [boolean, typeof payload]),
        });
        fireEvent.click(screen.getByRole('button'));
        expect(pubsub.publish).toHaveBeenCalledWith('atc_validator', payload);
        expect(controller.command).not.toHaveBeenCalledWith('gcode:start');
    });
});

// ── handlePause — lines 142-162 ───────────────────────────────────────────────

describe('handlePause (lines 142-162)', () => {
    it('calls gcode:pause when PAUSE clicked while running', () => {
        renderButton('PAUSE', { workflow: runningWorkflow, activeState: 'Run' });
        fireEvent.click(screen.getByRole('button'));
        expect(controller.command).toHaveBeenCalledWith('gcode:pause');
    });

    it('calls gcode:pause when PAUSE clicked while paused/Hold', () => {
        renderButton('PAUSE', { workflow: pausedWorkflow, activeState: 'Hold' });
        fireEvent.click(screen.getByRole('button'));
        expect(controller.command).toHaveBeenCalledWith('gcode:pause');
    });
});

// ── handleStop — lines 235-238, 254-276 ───────────────────────────────────────

describe('handleStop (lines 235-238, 254-276)', () => {
    it('calls onStop when STOP button is clicked', () => {
        const onStop = jest.fn();
        renderButton('STOP', { workflow: runningWorkflow, activeState: 'Run', onStop });
        fireEvent.click(screen.getByRole('button'));
        expect(onStop).toHaveBeenCalled();
    });

    it('calls gcode:stop with force:true', () => {
        renderButton('STOP', { workflow: runningWorkflow, activeState: 'Run' });
        fireEvent.click(screen.getByRole('button'));
        expect(controller.command).toHaveBeenCalledWith('gcode:stop', { force: true });
    });

    it('calls gcode $C when stopped in Check mode', () => {
        renderButton('STOP', { workflow: runningWorkflow, activeState: 'Check' });
        fireEvent.click(screen.getByRole('button'));
        expect(controller.command).toHaveBeenCalledWith('gcode', '$C');
    });

    it('does NOT call gcode $C when stopped outside Check mode', () => {
        renderButton('STOP', { workflow: runningWorkflow, activeState: 'Run' });
        fireEvent.click(screen.getByRole('button'));
        const calledWithDollarC = (controller.command as jest.Mock).mock.calls.some(
            (call) => call[0] === 'gcode' && call[1] === '$C',
        );
        expect(calledWithDollarC).toBe(false);
    });
});

// ── Shuttle callbacks — lines 142-162, 190-216, 235-238, 254-276 ──────────────

describe('shuttle callbacks', () => {
    it('START_JOB callback calls gcode:start when not disabled', () => {
        renderButton('START', { workflow: idleWorkflow, activeState: 'Idle' });
        act(() => { mockShuttleEvents.current?.START_JOB?.callback(); });
        expect(controller.command).toHaveBeenCalledWith('gcode:start');
    });

    it('START_JOB callback returns early when shortcut disabled', () => {
        mockReduxState.current.connection.isConnected = false;
        renderButton('START', { workflow: idleWorkflow, activeState: 'Idle' });
        act(() => { mockShuttleEvents.current?.START_JOB?.callback(); });
        expect(controller.command).not.toHaveBeenCalled();
    });

    it('RUN_OUTLINE callback publishes outline:start when not disabled', () => {
        renderButton('START', { workflow: idleWorkflow, activeState: 'Idle' });
        act(() => { mockShuttleEvents.current?.RUN_OUTLINE?.callback(); });
        expect(pubsub.publish).toHaveBeenCalledWith('outline:start');
    });

    it('RUN_OUTLINE callback returns early when shortcut disabled', () => {
        mockReduxState.current.connection.isConnected = false;
        renderButton('START', { workflow: idleWorkflow, activeState: 'Idle' });
        act(() => { mockShuttleEvents.current?.RUN_OUTLINE?.callback(); });
        expect(pubsub.publish).not.toHaveBeenCalled();
    });

    it('PAUSE_JOB callback calls gcode:pause when not disabled', () => {
        mockReduxState.current.controller.state.status.activeState = 'Run';
        mockReduxState.current.controller.workflow.state = 'running';
        renderButton('PAUSE', { workflow: runningWorkflow, activeState: 'Run' });
        act(() => { mockShuttleEvents.current?.PAUSE_JOB?.callback(); });
        expect(controller.command).toHaveBeenCalledWith('gcode:pause');
    });

    it('PAUSE_JOB callback returns early when shortcut disabled', () => {
        mockReduxState.current.connection.isConnected = false;
        renderButton('PAUSE', { workflow: idleWorkflow, activeState: 'Idle' });
        act(() => { mockShuttleEvents.current?.PAUSE_JOB?.callback(); });
        expect(controller.command).not.toHaveBeenCalled();
    });

    it('STOP_JOB callback calls handleStop when job is running', () => {
        mockReduxState.current.controller.state.status.activeState = 'Run';
        mockReduxState.current.controller.workflow.state = 'running';
        const onStop = jest.fn();
        renderButton('STOP', { workflow: runningWorkflow, activeState: 'Run', onStop });
        act(() => { mockShuttleEvents.current?.STOP_JOB?.callback(); });
        expect(onStop).toHaveBeenCalled();
        expect(controller.command).toHaveBeenCalledWith('gcode:stop', { force: true });
    });

    it('STOP_JOB callback cancels jog when disabled and activeState is Jog', () => {
        mockReduxState.current.controller.state.status.activeState = 'Jog';
        mockReduxState.current.controller.workflow.state = 'idle';
        renderButton('STOP', { workflow: idleWorkflow, activeState: 'Jog' });
        act(() => { mockShuttleEvents.current?.STOP_JOB?.callback(); });
        expect(controller.command).toHaveBeenCalledWith('jog:cancel');
    });

    it('STOP_JOB callback does nothing when disabled and activeState is Idle', () => {
        renderButton('STOP', { workflow: idleWorkflow, activeState: 'Idle' });
        act(() => { mockShuttleEvents.current?.STOP_JOB?.callback(); });
        expect(controller.command).not.toHaveBeenCalled();
    });

    it('STOP_JOB callback sends reset:soft when disabled and firmware is grblHAL', () => {
        mockReduxState.current.controller.state.status.activeState = 'Alarm';
        mockReduxState.current.controller.type = 'grblHAL';
        renderButton('STOP', { workflow: idleWorkflow, activeState: 'Alarm' });
        act(() => { mockShuttleEvents.current?.STOP_JOB?.callback(); });
        expect(controller.command).toHaveBeenCalledWith('reset:soft');
    });

    it('STOP_JOB callback sends reset when disabled and firmware is Grbl', () => {
        mockReduxState.current.controller.state.status.activeState = 'Alarm';
        mockReduxState.current.controller.type = 'Grbl';
        renderButton('STOP', { workflow: idleWorkflow, activeState: 'Alarm' });
        act(() => { mockShuttleEvents.current?.STOP_JOB?.callback(); });
        expect(controller.command).toHaveBeenCalledWith('reset');
    });
});