/*
 * The probe cycle as the component actually runs it.
 *
 * The pure state machine is covered in probeCycle.test.ts. What is left here is
 * everything that needs the outside world and so could not be reasoned about:
 * the serial listener's lifetime, the watchdog timer, and reacting to an alarm.
 *
 * Only the boundaries are mocked -- controller, redux, persisted settings, the
 * two visualisers. The component and every util it calls are the real thing, so
 * a pass here means the real wiring works rather than that the mocks agree with
 * each other.
 *
 * The three faults being pinned:
 *
 *   1. Nothing ended the cycle when the machine simply never answered.
 *   2. The serial listener was rebuilt after every accepted point, because
 *      handleSerialRead depended on completeProbing which depended on the whole
 *      state object, which changed on every progress update. A response landing
 *      in that window was dropped -- which then presented as fault 1.
 *   3. An alarm was not observed at all, and it flushes the planner buffer
 *      including the queued G90, leaving the session in incremental mode.
 */

import React from 'react';
import { render, screen, act, cleanup } from '@testing-library/react';

const mockCommands: { name: string; args: unknown[] }[] = [];
/** Every registration ever made, so churn is measurable. */
const mockRegistrations: Record<string, Function>[] = [];
const mockRemovals: Record<string, Function>[] = [];
/** Only what is currently subscribed -- mockRemovals are honoured, as in the real app. */
const mockActiveEvents = new Set<Record<string, Function>>();

let mockStatus: Record<string, unknown> = {};

jest.mock('app/lib/controller', () => ({
    __esModule: true,
    default: {
        command: (name: string, ...args: unknown[]) => {
            mockCommands.push({ name, args });
        },
    },
    addControllerEvents: (events: Record<string, Function>) => {
        mockRegistrations.push(events);
        mockActiveEvents.add(events);
    },
    removeControllerEvents: (events: Record<string, Function>) => {
        mockRemovals.push(events);
        mockActiveEvents.delete(events);
    },
}));

jest.mock('app/hooks/useTypedSelector', () => ({
    __esModule: true,
    useTypedSelector: (selector: (s: unknown) => unknown) =>
        selector({
            controller: { state: { status: mockStatus } },
            file: { name: '', size: 0, content: '' },
        }),
}));

jest.mock('app/store', () => ({
    __esModule: true,
    default: { get: (_k: string, d: unknown) => d, set: jest.fn() },
}));

jest.mock('app/lib/fileupload', () => ({
    __esModule: true,
    uploadGcodeFileToServer: jest.fn(),
}));

jest.mock('react-router', () => ({
    __esModule: true,
    useNavigate: () => jest.fn(),
}));

jest.mock('../../WidgetConfig/WidgetConfig', () => ({
    __esModule: true,
    default: class {
        get(_key: string, defaultValue: unknown) {
            return defaultValue;
        }

        set() {}
    },
}));

// Rendered as JSON so the resulting map can be read back out of the DOM without
// reaching into component internals.
jest.mock('../components/GridVisualizer', () => ({
    __esModule: true,
    default: ({ mapData }: { mapData: { points: unknown[] } | null }) => (
        <div data-testid="map">{mapData ? JSON.stringify(mapData.points) : ''}</div>
    ),
}));

jest.mock('../components/ToolpathVisualizer', () => ({
    __esModule: true,
    default: () => <div data-testid="toolpath" />,
}));

import HeightMapTool from '../index';
import { calculateProbeTimeoutMs } from '../utils/probeRoutine';

const WCO = { x: -300, y: -200, z: -85 };

/**
 * Default config is gridSpacing 10 over 0..100 with usePointCount off, so the
 * grid is 11x11 = 121 points -- not the pointCountX/Y of 5, which is unused.
 */
const GRID_STEP = 10;
const POINTS_PER_SIDE = 11;
const TOTAL_POINTS = POINTS_PER_SIDE * POINTS_PER_SIDE;

const idleStatus = () => ({
    activeState: 'Idle',
    wco: { ...WCO },
    wpos: { x: 0, y: 0, z: 0 },
});

/**
 * calculateProbeGrid walks the grid boustrophedon -- odd rows run right to left
 * so the machine does not deadhead back across the stock every row. Mirroring
 * that here matters: a helper that assumed plain row-major would feed the wrong
 * XY for every odd row, and the correlation check would rightly reject it.
 */
const gridPoint = (index: number) => {
    const row = Math.floor(index / POINTS_PER_SIDE);
    const column = index % POINTS_PER_SIDE;
    const x = row % 2 === 0 ? column : POINTS_PER_SIDE - 1 - column;
    return { x: x * GRID_STEP, y: row * GRID_STEP };
};

/** A well-formed PRB report for the nth grid point. */
const prbFor = (index: number, surfaceZ = 0.1, success = true): string => {
    const p = gridPoint(index);
    return `[PRB:${(p.x + WCO.x).toFixed(3)},${(p.y + WCO.y).toFixed(3)},${(
        surfaceZ + WCO.z
    ).toFixed(3)}:${success ? 1 : 0}]`;
};

const emit = (line: string) => {
    act(() => {
        for (const events of Array.from(mockActiveEvents)) {
            events['serialport:read']?.(line);
        }
    });
};

/** Let the inter-point settle delay elapse. */
const settle = () => {
    act(() => {
        jest.advanceTimersByTime(200);
    });
};

const startProbing = () => {
    const button = screen.getByRole('button', { name: /run probe routine/i });
    act(() => {
        button.click();
    });
};

const commandNames = () => mockCommands.map((c) => c.name);
const allGcode = () =>
    mockCommands
        .filter((c) => c.name === 'gcode' || c.name === 'gcode:safe')
        .map((c) => String(c.args[0]))
        .join('\n');

beforeEach(() => {
    jest.useFakeTimers();
    mockCommands.length = 0;
    mockRegistrations.length = 0;
    mockRemovals.length = 0;
    mockActiveEvents.clear();
    mockStatus = idleStatus();
});

afterEach(() => {
    cleanup();
    jest.clearAllTimers();
    jest.useRealTimers();
});

describe('serial listener lifetime', () => {
    it('registers once for the whole cycle, not once per point', () => {
        render(<HeightMapTool />);
        const afterMount = mockRegistrations.length;

        startProbing();
        for (let i = 0; i < 5; i++) {
            emit(prbFor(i));
            settle();
        }

        // Re-registering between points opens a window where the very response
        // the listener exists to catch is dropped.
        expect(mockRegistrations.length).toBe(afterMount);
    });

    it('removes the listener on unmount', () => {
        const { unmount } = render(<HeightMapTool />);
        act(() => {
            unmount();
        });
        expect(mockRemovals.length).toBeGreaterThan(0);
    });
});

describe('watchdog', () => {
    it('ends a cycle where the machine never answers', () => {
        render(<HeightMapTool />);
        startProbing();
        expect(commandNames()).toContain('gcode:safe');

        act(() => {
            jest.advanceTimersByTime(
                calculateProbeTimeoutMs({
                    zClearance: 5,
                    maxProbeDepth: 10,
                    probeFeedRate: 100,
                }) + 1000,
            );
        });

        expect(screen.getByText(/no probe response for point 1 of/i)).toBeTruthy();
    });

    it('names the point that went quiet partway through', () => {
        render(<HeightMapTool />);
        startProbing();
        emit(prbFor(0));
        settle();

        act(() => {
            jest.advanceTimersByTime(
                calculateProbeTimeoutMs({
                    zClearance: 5,
                    maxProbeDepth: 10,
                    probeFeedRate: 100,
                }) + 1000,
            );
        });

        expect(screen.getByText(/point 2 of/i)).toBeTruthy();
    });

    it('does not fire while points keep arriving', () => {
        render(<HeightMapTool />);
        startProbing();

        const timeout = calculateProbeTimeoutMs({
            zClearance: 5,
            maxProbeDepth: 10,
            probeFeedRate: 100,
        });

        for (let i = 0; i < 4; i++) {
            act(() => {
                jest.advanceTimersByTime(timeout * 0.5);
            });
            emit(prbFor(i));
            settle();
        }

        expect(screen.queryByText(/no probe response/i)).toBeNull();
        // Still running, not quietly aborted.
        expect(screen.getByRole('button', { name: /stop probing/i })).toBeTruthy();
    });

    it('leaves no timer pending once the cycle completes', () => {
        render(<HeightMapTool />);
        startProbing();
        for (let i = 0; i < TOTAL_POINTS; i++) {
            emit(prbFor(i));
            settle();
        }

        // Asserting the map exists keeps this honest: timers also read zero when
        // the cycle has aborted, so without this the test passes either way.
        const points = JSON.parse(screen.getByTestId('map').textContent || '[]');
        expect(points).toHaveLength(TOTAL_POINTS);
        expect(jest.getTimerCount()).toBe(0);
    });

    it('leaves no timer pending after abort', () => {
        render(<HeightMapTool />);
        startProbing();
        emit(prbFor(0));

        const stop = screen.getByRole('button', { name: /stop probing/i });
        act(() => {
            stop.click();
        });

        expect(jest.getTimerCount()).toBe(0);
    });

    it('leaves no timer pending after unmount mid-cycle', () => {
        const { unmount } = render(<HeightMapTool />);
        startProbing();
        act(() => {
            unmount();
        });
        expect(jest.getTimerCount()).toBe(0);
    });
});

describe('stray probe responses', () => {
    it('keeps readings aligned with the grid when something else answers', () => {
        render(<HeightMapTool />);
        startProbing();

        for (let i = 0; i < TOTAL_POINTS; i++) {
            if (i === 3) {
                // Another widget, macro or pendant probing on the same
                // connection. Pushing this would shift every later reading one
                // slot against the grid and finish an entry early, producing a
                // scrambled map that nothing downstream would reject.
                emit('[PRB:-111.000,-222.000,-90.000:1]');
            }
            emit(prbFor(i, i / 100));
            settle();
        }

        const points = JSON.parse(screen.getByTestId('map').textContent || '[]');
        expect(points).toHaveLength(TOTAL_POINTS);
        points.forEach((p: { x: number; y: number; z: number }, i: number) => {
            expect(p.x).toBeCloseTo(gridPoint(i).x, 6);
            expect(p.y).toBeCloseTo(gridPoint(i).y, 6);
            expect(p.z).toBeCloseTo(i / 100, 3);
        });
    });
});

describe('alarm during a cycle', () => {
    // The mocked selector reads mockStatus at render time, so a status change
    // has to be paired with a re-render to reach the component.
    const setStatus = (
        next: Record<string, unknown>,
        view: { rerender: (ui: React.ReactElement) => void },
    ) => {
        mockStatus = next;
        act(() => {
            view.rerender(<HeightMapTool />);
        });
    };

    const alarmMidCycle = () => {
        const view = render(<HeightMapTool />);
        startProbing();
        emit(prbFor(0));
        settle();

        // The probe command itself ends in a bare G90, so only what is sent from
        // the alarm onwards can distinguish a restore from routine traffic.
        mockCommands.length = 0;
        setStatus({ ...idleStatus(), activeState: 'Alarm' }, view);
        return view;
    };

    it('stops the cycle and says so', () => {
        alarmMidCycle();
        expect(screen.getByText(/alarm/i)).toBeTruthy();
    });

    it('clears the watchdog rather than reporting a timeout on top', () => {
        alarmMidCycle();
        expect(jest.getTimerCount()).toBe(0);
    });

    it('does not send G90 while the controller is still alarmed', () => {
        // Grbl rejects g-code in the alarm state with error:9, so a restore sent
        // now is simply lost.
        alarmMidCycle();
        expect(allGcode()).not.toMatch(/^G90$/m);
    });

    it('restores G90 once the alarm clears', () => {
        // The alarm flushed the queued G90 that followed G38.2, so without this
        // the operator's next jog is interpreted incrementally.
        const view = alarmMidCycle();
        mockCommands.length = 0;

        setStatus(idleStatus(), view);

        expect(allGcode()).toMatch(/^G90$/m);
    });
});
