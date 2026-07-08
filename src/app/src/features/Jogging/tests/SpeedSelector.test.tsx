import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SpeedSelector, SpeedSelectButton } from '../components/SpeedSelector';
import pubsub from 'pubsub-js';

// ─── Mocks ───────────────────────────────────────────────────────────────────

jest.mock('pubsub-js', () => ({
    subscribe: jest.fn(() => 'token'),
    unsubscribe: jest.fn(),
    publish: jest.fn(),
}));

jest.mock('app/store', () => ({
    get: jest.fn(() => ({
        rapid: { xyStep: 10, zStep: 5, feedrate: 5000 },
        normal: { xyStep: 5, zStep: 2, feedrate: 3000 },
        precise: { xyStep: 1, zStep: 0.5, feedrate: 1000 },
        storedInMetric: true,
    })),
}));

jest.mock('app/hooks/useWorkspaceState', () => ({
    useWorkspaceState: jest.fn(() => ({ units: 'mm' })),
}));

jest.mock('app/lib/useKeybinding', () => jest.fn());
jest.mock('app/hooks/useShuttleEvents', () => jest.fn());

jest.mock('app/constants', () => ({
    IMPERIAL_UNITS: 'in',
    METRIC_UNITS: 'mm',
    JOGGING_CATEGORY: 'Jogging',
}));

jest.mock('../utils/units', () => ({
    convertValue: jest.fn((val: number) => val * 0.0393701),
}));


// ─── SpeedSelectButton ───────────────────────────────────────────────────────

describe('SpeedSelectButton', () => {
    it('renders label text', () => {
        render(<SpeedSelectButton label="Normal" />);
        expect(screen.getByText('Normal')).toBeInTheDocument();
    });

    it('uses screenReaderLabel as aria-label when provided', () => {
        render(
            <SpeedSelectButton
                label="Normal"
                screenReaderLabel="Set to Normal jog preset"
            />
        );
        expect(screen.getByRole('button')).toHaveAttribute(
            'aria-label',
            'Set to Normal jog preset',
        );
    });

    it('uses label as aria-label when screenReaderLabel is not provided', () => {
        render(<SpeedSelectButton label="Normal" />);
        expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Normal');
    });

    it('sets aria-pressed=true when active', () => {
        render(<SpeedSelectButton label="Normal" active={true} />);
        expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
    });

    it('sets aria-pressed=false when not active', () => {
        render(<SpeedSelectButton label="Normal" active={false} />);
        expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
    });

    it('calls onClick when clicked', () => {
        const onClick = jest.fn();
        render(<SpeedSelectButton label="Normal" onClick={onClick} />);
        fireEvent.click(screen.getByRole('button'));
        expect(onClick).toHaveBeenCalled();
    });

    it('applies active styling class when active', () => {
        render(<SpeedSelectButton label="Normal" active={true} />);
        expect(screen.getByRole('button').className).toContain('bg-blue-400');
    });

    it('does not apply active styling when not active', () => {
        render(<SpeedSelectButton label="Normal" active={false} />);
        expect(screen.getByRole('button').className).not.toContain('bg-blue-400');
    });
});


// ─── SpeedSelector rendering ─────────────────────────────────────────────────

describe('SpeedSelector — rendering', () => {
    it('renders Precise, Normal, and Rapid buttons', () => {
        render(<SpeedSelector handleClick={jest.fn()} />);
        expect(screen.getByText('Precise')).toBeInTheDocument();
        expect(screen.getByText('Normal')).toBeInTheDocument();
        expect(screen.getByText('Rapid')).toBeInTheDocument();
    });

    it('Normal is active by default', () => {
        render(<SpeedSelector handleClick={jest.fn()} />);
        expect(
            screen.getByLabelText('Set to Normal jog preset'),
        ).toHaveAttribute('aria-pressed', 'true');
    });

    it('Rapid and Precise are not active by default', () => {
        render(<SpeedSelector handleClick={jest.fn()} />);
        expect(
            screen.getByLabelText('Set to Rapid jog preset'),
        ).toHaveAttribute('aria-pressed', 'false');
        expect(
            screen.getByLabelText('Set to Precise jog preset'),
        ).toHaveAttribute('aria-pressed', 'false');
    });
});


// ─── SpeedSelector speed selection ───────────────────────────────────────────

describe('SpeedSelector — speed selection', () => {
    it('sets Rapid as active when Rapid button is clicked', () => {
        render(<SpeedSelector handleClick={jest.fn()} />);
        fireEvent.click(screen.getByLabelText('Set to Rapid jog preset'));
        expect(
            screen.getByLabelText('Set to Rapid jog preset'),
        ).toHaveAttribute('aria-pressed', 'true');
        expect(
            screen.getByLabelText('Set to Normal jog preset'),
        ).toHaveAttribute('aria-pressed', 'false');
    });

    it('sets Precise as active when Precise button is clicked', () => {
        render(<SpeedSelector handleClick={jest.fn()} />);
        fireEvent.click(screen.getByLabelText('Set to Precise jog preset'));
        expect(
            screen.getByLabelText('Set to Precise jog preset'),
        ).toHaveAttribute('aria-pressed', 'true');
        expect(
            screen.getByLabelText('Set to Normal jog preset'),
        ).toHaveAttribute('aria-pressed', 'false');
    });

    it('calls handleClick when speed is selected', () => {
        const handleClick = jest.fn();
        render(<SpeedSelector handleClick={handleClick} />);
        fireEvent.click(screen.getByLabelText('Set to Rapid jog preset'));
        expect(handleClick).toHaveBeenCalled();
    });

    it('calls handleClick with updated values when same speed is clicked again', () => {
        const handleClick = jest.fn();
        render(<SpeedSelector handleClick={handleClick} />);
        fireEvent.click(screen.getByLabelText('Set to Normal jog preset'));
        expect(handleClick).toHaveBeenCalled();
    });
});


// ─── SpeedSelector unit conversion ───────────────────────────────────────────

describe('SpeedSelector — unit conversion', () => {
    it('converts values when units are imperial and storedInMetric is false', () => {
        const { useWorkspaceState } = require('app/hooks/useWorkspaceState');
        useWorkspaceState.mockReturnValue({ units: 'in' });
        const store = require('app/store');
        store.get.mockReturnValue({
            rapid: { xyStep: 10, zStep: 5, feedrate: 5000 },
            normal: { xyStep: 5, zStep: 2, feedrate: 3000 },
            precise: { xyStep: 1, zStep: 0.5, feedrate: 1000 },
            storedInMetric: false,
        });
        const handleClick = jest.fn();
        render(<SpeedSelector handleClick={handleClick} />);
        expect(handleClick).toHaveBeenCalled();
    });

    it('does not convert when storedInMetric is true', () => {
        const { useWorkspaceState } = require('app/hooks/useWorkspaceState');
        useWorkspaceState.mockReturnValue({ units: 'in' });
        const store = require('app/store');
        store.get.mockReturnValue({
            normal: { xyStep: 5, zStep: 2, feedrate: 3000 },
            storedInMetric: true,
        });
        const handleClick = jest.fn();
        render(<SpeedSelector handleClick={handleClick} />);
        expect(handleClick).toHaveBeenCalledWith(
            expect.objectContaining({ xyStep: 5, zStep: 2, feedrate: 3000 }),
        );
    });
});


// ─── SpeedSelector pubsub ────────────────────────────────────────────────────

describe('SpeedSelector — pubsub subscriptions', () => {
    beforeEach(() => {
        (pubsub.subscribe as jest.Mock).mockClear();
        (pubsub.unsubscribe as jest.Mock).mockClear();
    });

    it('subscribes to config:saved and programSettingReset on mount', () => {
        render(<SpeedSelector handleClick={jest.fn()} />);
        expect(pubsub.subscribe).toHaveBeenCalledWith('config:saved', expect.any(Function));
        expect(pubsub.subscribe).toHaveBeenCalledWith('programSettingReset', expect.any(Function));
    });

    it('unsubscribes on unmount', () => {
        const { unmount } = render(<SpeedSelector handleClick={jest.fn()} />);
        unmount();
        expect(pubsub.unsubscribe).toHaveBeenCalled();
    });

    it('calls handleClick when config:saved fires for current speed preset', () => {
        const handleClick = jest.fn();
        let configSavedCallback: Function;
        (pubsub.subscribe as jest.Mock).mockImplementation((event: string, cb: Function) => {
            if (event === 'config:saved') configSavedCallback = cb;
            return 'token';
        });
        render(<SpeedSelector handleClick={handleClick} />);
        handleClick.mockClear();
        configSavedCallback!('config:saved', { 'widgets.axes.jog.normal': {} });
        expect(handleClick).toHaveBeenCalled();
    });

    it('does not call handleClick when config:saved fires for different preset', () => {
        const handleClick = jest.fn();
        let configSavedCallback: Function;
        (pubsub.subscribe as jest.Mock).mockImplementation((event: string, cb: Function) => {
            if (event === 'config:saved') configSavedCallback = cb;
            return 'token';
        });
        render(<SpeedSelector handleClick={handleClick} />);
        handleClick.mockClear();
        configSavedCallback!('config:saved', { 'widgets.axes.jog.rapid': {} });
        expect(handleClick).not.toHaveBeenCalled();
    });

    it('calls handleClick when programSettingReset fires for current preset', () => {
        const handleClick = jest.fn();
        let programResetCallback: Function;
        (pubsub.subscribe as jest.Mock).mockImplementation((event: string, cb: Function) => {
            if (event === 'programSettingReset') programResetCallback = cb;
            return 'token';
        });
        render(<SpeedSelector handleClick={handleClick} />);
        handleClick.mockClear();
        programResetCallback!('programSettingReset', 'widgets.axes.jog.normal');
        expect(handleClick).toHaveBeenCalled();
    });
it('calls handleClick when config:saved fires for rapid preset while rapid is active', () => {
    const handleClick = jest.fn();
    let configSavedCallback: Function;
    (pubsub.subscribe as jest.Mock).mockImplementation((event: string, cb: Function) => {
        if (event === 'config:saved') configSavedCallback = cb;
        return 'token';
    });
    render(<SpeedSelector handleClick={handleClick} />);
    fireEvent.click(screen.getByLabelText('Set to Rapid jog preset')); // switch to Rapid
    handleClick.mockClear();
    configSavedCallback!('config:saved', { 'widgets.axes.jog.rapid': {} });
    expect(handleClick).toHaveBeenCalled();
});

it('calls handleClick when config:saved fires for precise preset while precise is active', () => {
    const handleClick = jest.fn();
    let configSavedCallback: Function;
    (pubsub.subscribe as jest.Mock).mockImplementation((event: string, cb: Function) => {
        if (event === 'config:saved') configSavedCallback = cb;
        return 'token';
    });
    render(<SpeedSelector handleClick={handleClick} />);
    fireEvent.click(screen.getByLabelText('Set to Precise jog preset')); // switch to Precise
    handleClick.mockClear();
    configSavedCallback!('config:saved', { 'widgets.axes.jog.precise': {} });
    expect(handleClick).toHaveBeenCalled();
});

it('calls handleClick when programSettingReset fires for rapid preset while rapid is active', () => {
    const handleClick = jest.fn();
    let programResetCallback: Function;
    (pubsub.subscribe as jest.Mock).mockImplementation((event: string, cb: Function) => {
        if (event === 'programSettingReset') programResetCallback = cb;
        return 'token';
    });
    render(<SpeedSelector handleClick={handleClick} />);
    fireEvent.click(screen.getByLabelText('Set to Rapid jog preset'));
    handleClick.mockClear();
    programResetCallback!('programSettingReset', 'widgets.axes.jog.rapid');
    expect(handleClick).toHaveBeenCalled();
});

it('calls handleClick when programSettingReset fires for precise preset while precise is active', () => {
    const handleClick = jest.fn();
    let programResetCallback: Function;
    (pubsub.subscribe as jest.Mock).mockImplementation((event: string, cb: Function) => {
        if (event === 'programSettingReset') programResetCallback = cb;
        return 'token';
    });
    render(<SpeedSelector handleClick={handleClick} />);
    fireEvent.click(screen.getByLabelText('Set to Precise jog preset'));
    handleClick.mockClear();
    programResetCallback!('programSettingReset', 'widgets.axes.jog.precise');
    expect(handleClick).toHaveBeenCalled();
});

});



import { act } from '@testing-library/react';

// ─── SpeedSelector shuttle callbacks ───────────

describe('SpeedSelector — shuttle callbacks', () => {
    let shuttleEvents: Record<string, any>;

    beforeEach(() => {
        const useShuttleEvents = require('app/hooks/useShuttleEvents');
        useShuttleEvents.mockImplementation((events: any) => {
            shuttleEvents = events;
        });
    });

    it('SET_R_JOG_PRESET callback sets Rapid as active', () => {
        render(<SpeedSelector handleClick={jest.fn()} />);
        act(() => { shuttleEvents?.SET_R_JOG_PRESET?.callback(); });
        expect(screen.getByLabelText('Set to Rapid jog preset')).toHaveAttribute('aria-pressed', 'true');
    });

    it('SET_N_JOG_PRESET callback sets Normal as active', () => {
        render(<SpeedSelector handleClick={jest.fn()} />);
        fireEvent.click(screen.getByLabelText('Set to Rapid jog preset'));
        act(() => { shuttleEvents?.SET_N_JOG_PRESET?.callback(); });
        expect(screen.getByLabelText('Set to Normal jog preset')).toHaveAttribute('aria-pressed', 'true');
    });

    it('SET_P_JOG_PRESET callback sets Precise as active', () => {
        render(<SpeedSelector handleClick={jest.fn()} />);
        act(() => { shuttleEvents?.SET_P_JOG_PRESET?.callback(); });
        expect(screen.getByLabelText('Set to Precise jog preset')).toHaveAttribute('aria-pressed', 'true');
    });

    it('CYCLE_JOG_PRESETS cycles from Normal to Precise', () => {
        render(<SpeedSelector handleClick={jest.fn()} />);
        act(() => { shuttleEvents?.CYCLE_JOG_PRESETS?.callback(); });
        expect(screen.getByLabelText('Set to Precise jog preset')).toHaveAttribute('aria-pressed', 'true');
    });

    it('CYCLE_JOG_PRESETS cycles from Rapid to Normal', () => {
        render(<SpeedSelector handleClick={jest.fn()} />);
        fireEvent.click(screen.getByLabelText('Set to Rapid jog preset'));
        act(() => { shuttleEvents?.CYCLE_JOG_PRESETS?.callback(); });
        expect(screen.getByLabelText('Set to Normal jog preset')).toHaveAttribute('aria-pressed', 'true');
    });

    it('CYCLE_JOG_PRESETS wraps from Precise back to Rapid', () => {
        render(<SpeedSelector handleClick={jest.fn()} />);
        fireEvent.click(screen.getByLabelText('Set to Precise jog preset'));
        act(() => { shuttleEvents?.CYCLE_JOG_PRESETS?.callback(); });
        expect(screen.getByLabelText('Set to Rapid jog preset')).toHaveAttribute('aria-pressed', 'true');
    });

    it('calls handleClick when programSettingReset fires for normal preset while normal is active', () => {
    const handleClick = jest.fn();
    let programResetCallback: Function;
    (pubsub.subscribe as jest.Mock).mockImplementation((event: string, cb: Function) => {
        if (event === 'programSettingReset') programResetCallback = cb;
        return 'token';
    });
    render(<SpeedSelector handleClick={handleClick} />);
    // Normal is active by default — do NOT switch speed
    handleClick.mockClear();
    // fire reset for normal preset specifically
    act(() => {
        programResetCallback!('programSettingReset', 'widgets.axes.jog.normal');
    });
    expect(handleClick).toHaveBeenCalled();
});

it('covers normalActive branch in programSettingReset when normal is re-selected', () => {
    const handleClick = jest.fn();
    let programResetCallback: Function;
    (pubsub.subscribe as jest.Mock).mockImplementation((event: string, cb: Function) => {
        if (event === 'programSettingReset') programResetCallback = cb;
        return 'token';
    });
    render(<SpeedSelector handleClick={handleClick} />);
    // Switch away from Normal then back to force a fresh closure
    fireEvent.click(screen.getByLabelText('Set to Rapid jog preset'));
    fireEvent.click(screen.getByLabelText('Set to Normal jog preset'));
    handleClick.mockClear();
    act(() => {
        programResetCallback!('programSettingReset', 'widgets.axes.jog.normal');
    });
    expect(handleClick).toHaveBeenCalled();
});

});
