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
let mockUnits = 'mm';
let mockFile: Record<string, unknown> = { name: '', size: 0, content: '' };
let mockEeprom: Record<string, unknown> = { $13: '0' };

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
            controller: {
                state: { status: mockStatus },
                settings: { settings: mockEeprom },
            },
            file: mockFile,
        }),
}));

jest.mock('app/store', () => ({
    __esModule: true,
    default: {
        get: (key: string, d: unknown) =>
            key === 'workspace.units' ? mockUnits : d,
        set: jest.fn(),
    },
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
    mockUnits = 'mm';
    mockEeprom = { $13: '0' };
    mockFile = { name: '', size: 0, content: '' };
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

    it('gives up when the mismatches are systematic, not incidental', () => {
        // The single-stray case above always follows the stray with a good
        // response, so the mismatch counter is reset before it can reach its
        // limit and the three-strikes path is never taken end to end. Something
        // answering repeatedly -- a pendant probing in a loop, or a work offset
        // that moved after the cycle started -- has to stop the run rather than
        // leave the operator waiting on the watchdog.
        render(<HeightMapTool />);
        startProbing();

        for (let i = 0; i < 3; i++) {
            emit('[PRB:-111.000,-222.000,-90.000:1]');
        }

        expect(screen.getByText(/do not match point 1 of/i)).toBeTruthy();
        expect(screen.queryByRole('button', { name: /stop probing/i })).toBeNull();
        expect(jest.getTimerCount()).toBe(0);
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

    it('sends no g-code at all while the controller is alarmed', () => {
        // Grbl rejects g-code with error:9 in the alarm state, so anything sent
        // now is simply discarded. The retract that normally ends a failed cycle
        // is the thing at risk: send it here and the operator is told the tool
        // was parked when it was not.
        //
        // Asserting on the whole command stream rather than a bare /^G90$/ --
        // the earlier form only matched a G90 alone on its line and so could not
        // see `G90 G0 Z5`, which is exactly what the guard exists to suppress.
        alarmMidCycle();
        expect(
            mockCommands.filter(
                (c) => c.name === 'gcode' || c.name === 'gcode:safe',
            ),
        ).toEqual([]);
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

describe('workspace units', () => {
    /** The probe command issued for the first point of a cycle. */
    const firstProbeCommand = (): string => {
        render(<HeightMapTool />);
        startProbing();
        const safe = mockCommands.find((c) => c.name === 'gcode:safe');
        return safe ? String(safe.args[0]) : '';
    };

    /** Clearance, probe depth and feed rate as actually commanded, in mm. */
    const commandedValues = (command: string) => ({
        clearance: parseFloat(command.match(/G90 G0 Z(-?[\d.]+)/)![1]),
        depth: parseFloat(command.match(/G38\.2 Z-([\d.]+)/)![1]),
        feed: parseFloat(command.match(/F([\d.]+)/)![1]),
    });

    /*
     * Compared as physical quantities within display precision rather than as
     * identical text. convertToImperial rounds to three decimals, so 5mm is
     * shown to the operator as 0.197in and 0.197in really is 5.0038mm -- the
     * machine is doing exactly what the screen asked for. Demanding identical
     * text would demand the input box show 0.19685039.
     */
    const DISPLAY_PRECISION_MM = 0.0254;

    it('commands the same physical move whichever units the workspace shows', () => {
        // The configuration is held in display units, so an imperial workspace
        // carries 0.19685 where a metric one carries 5. Issuing that number
        // under the hardcoded G21 asks for 0.197MM of clearance -- every
        // inter-point rapid then crosses the board two tenths of a millimetre
        // above work zero, on a board being mapped because it moves more than
        // that. With a V-bit probe that is a broken tool on the second point.
        const metric = commandedValues(firstProbeCommand());
        cleanup();
        mockCommands.length = 0;
        mockUnits = 'in';
        const imperial = commandedValues(firstProbeCommand());

        expect(imperial.clearance).toBeCloseTo(metric.clearance, 1);
        expect(Math.abs(imperial.clearance - metric.clearance)).toBeLessThan(
            DISPLAY_PRECISION_MM,
        );
        expect(Math.abs(imperial.depth - metric.depth)).toBeLessThan(
            DISPLAY_PRECISION_MM * 2,
        );
        expect(imperial.feed).toBeCloseTo(metric.feed, 2);
    });

    it('still sends millimetres under G21 when the workspace is imperial', () => {
        mockUnits = 'in';
        const { clearance, depth, feed } = commandedValues(firstProbeCommand());

        // 5mm, not the 0.197 that the operator's inches would be if the number
        // were passed through unconverted under G21.
        expect(clearance).toBeCloseTo(5, 1);
        expect(depth).toBeCloseTo(10, 1);
        expect(feed).toBeCloseTo(100, 1);
    });

    it('refuses to probe when the controller reports positions in inches', () => {
        // $13 switches [PRB:] and WCO: to inches independently of G20/G21, so
        // every reading and the work offset would be out by 25.4 with nothing
        // else looking wrong.
        mockEeprom = { $13: '1' };
        render(<HeightMapTool />);
        startProbing();

        expect(screen.getByText(/\$13/)).toBeTruthy();
        expect(mockCommands.filter((c) => c.name === 'gcode:safe')).toEqual([]);
    });

    it('refuses to probe when the controller settings have not been read', () => {
        mockEeprom = {};
        render(<HeightMapTool />);
        startProbing();

        expect(mockCommands.filter((c) => c.name === 'gcode:safe')).toEqual([]);
    });
});

describe('unit modal on every send', () => {
    /*
     * gcode:safe prepends the units modal the caller asks for and restores the
     * device's own afterwards. Anything sent through plain 'gcode' inherits
     * whatever modal the device happens to be in -- and gcode:safe itself is
     * what puts it back to G20 after an inch program. A retract of `Z5` under
     * G20 is five inches: error:15 with soft limits on, and the top of the Z
     * column without.
     */
    const sends = () =>
        mockCommands.filter(
            (c) => c.name === 'gcode' || c.name === 'gcode:safe',
        );

    it('wraps the retract that ends a completed cycle', () => {
        render(<HeightMapTool />);
        startProbing();
        for (let i = 0; i < TOTAL_POINTS; i++) {
            emit(prbFor(i));
            settle();
        }

        const retract = sends().filter((c) => /G0 Z/.test(String(c.args[0])));
        expect(retract.length).toBeGreaterThan(0);
        for (const c of retract) {
            expect(c.name).toBe('gcode:safe');
            expect(c.args[1]).toBe('G21');
        }
    });

    it('wraps the retract that ends a failed cycle', () => {
        render(<HeightMapTool />);
        startProbing();
        emit(prbFor(0, 0.1, false));

        const retract = sends().filter((c) => /G0 Z/.test(String(c.args[0])));
        expect(retract.length).toBeGreaterThan(0);
        for (const c of retract) {
            expect(c.name).toBe('gcode:safe');
            expect(c.args[1]).toBe('G21');
        }
    });

    it('wraps the deferred modal restore after an alarm', () => {
        // G90 is unit agnostic so this one is harmless today, but it is the same
        // mistake and the next thing added beside it will not be.
        const view = render(<HeightMapTool />);
        startProbing();
        emit(prbFor(0));
        settle();
        mockStatus = { ...idleStatus(), activeState: 'Alarm' };
        act(() => view.rerender(<HeightMapTool />));

        mockCommands.length = 0;
        mockStatus = idleStatus();
        act(() => view.rerender(<HeightMapTool />));

        const restore = sends();
        expect(restore.length).toBeGreaterThan(0);
        for (const c of restore) {
            expect(c.name).toBe('gcode:safe');
        }
    });

    it('issues the probe itself under G21', () => {
        // Asserted directly rather than relying on the retract filter above
        // happening to match the probe command's own leading G0 Z line.
        render(<HeightMapTool />);
        startProbing();

        const probe = mockCommands.filter((c) => /G38\.2/.test(String(c.args[0])));
        expect(probe.length).toBeGreaterThan(0);
        for (const c of probe) {
            expect(c.name).toBe('gcode:safe');
            expect(c.args[1]).toBe('G21');
        }
    });

    it('never sends through the unwrapped channel at all', () => {
        // Runs the cycle to completion so a retract is actually issued -- five
        // points out of 121 would leave nothing to catch.
        render(<HeightMapTool />);
        startProbing();
        for (let i = 0; i < TOTAL_POINTS; i++) {
            emit(prbFor(i));
            settle();
        }
        expect(sends().length).toBeGreaterThan(TOTAL_POINTS);
        expect(mockCommands.filter((c) => c.name === 'gcode')).toEqual([]);
    });
});

describe('clearing the map during a cycle', () => {
    const clearButton = () => screen.getByRole('button', { name: /clear map/i });

    it('is not offered while a cycle is running', () => {
        // Clicking it nulls the cycle without clearing timers, without aborting
        // and without retracting: the UI stays on "Stop Probing" forever, the
        // in-flight G38.2 still runs, and its response goes nowhere. Stopping a
        // machine is what the adjacent Stop Probing button is for -- a data
        // button should not do it by accident.
        render(<HeightMapTool />);
        startProbing();

        expect(clearButton()).toBeDisabled();
    });

    it('is offered once a map exists and nothing is running', () => {
        render(<HeightMapTool />);
        startProbing();
        for (let i = 0; i < TOTAL_POINTS; i++) {
            emit(prbFor(i));
            settle();
        }

        expect(clearButton()).not.toBeDisabled();
    });

    it('is not offered when there is no map and nothing is running', () => {
        render(<HeightMapTool />);
        expect(clearButton()).toBeDisabled();
    });

    it('stays unavailable when a second cycle runs over an existing map', () => {
        // Both conditions true at once: there is a map to clear AND a cycle is
        // running. The running cycle has to win, or re-probing an existing map
        // re-opens the same hole.
        render(<HeightMapTool />);
        startProbing();
        for (let i = 0; i < TOTAL_POINTS; i++) {
            emit(prbFor(i));
            settle();
        }
        expect(clearButton()).not.toBeDisabled();

        startProbing();
        expect(clearButton()).toBeDisabled();
    });
});

describe('bounds taken from a loaded file', () => {
    /*
     * GCodeVirtualizer normalises every position to millimetres -- translateX/Y/Z
     * run in2mm whenever the program is in G20 -- so fileInfo.bbox is always
     * millimetres whatever units the program or the workspace use. The widget's
     * own state is in display units, so the two have to be reconciled here.
     *
     * Unreconciled, an imperial workspace ends up with one field pair holding
     * both: an inset in inches and an extent still in millimetres, reading
     * "0.079 to 49.921". Converted to millimetres for probing that is an area
     * 2mm to 1268mm -- the probe would leave the stock, and the machine.
     */
    const BBOX_MM = {
        min: { x: 0, y: 0, z: 0, a: 0 },
        max: { x: 50, y: 40, z: 0, a: 0 },
        delta: { x: 50, y: 40, z: 0, a: 0 },
    };

    /** minX, maxX, minY, maxY as shown on screen, in display units. */
    const boundsAfterUsingFile = (): number[] => {
        render(<HeightMapTool />);
        act(() => {
            screen.getByRole('button', { name: /use file bounds/i }).click();
        });
        return Array.from(document.querySelectorAll('input'))
            .slice(0, 4)
            .map((i) => parseFloat((i as HTMLInputElement).value));
    };

    beforeEach(() => {
        mockFile = { name: 'part.nc', size: 1, content: '', bbox: BBOX_MM };
    });

    it('describes the same physical rectangle whichever units are shown', () => {
        const metric = boundsAfterUsingFile();
        cleanup();
        mockUnits = 'in';
        const imperial = boundsAfterUsingFile();

        imperial.forEach((v, i) => {
            expect(v * 25.4).toBeCloseTo(metric[i], 1);
        });
    });

    it('does not leave a millimetre extent in an inch field', () => {
        mockUnits = 'in';
        const [minX, maxX, minY, maxY] = boundsAfterUsingFile();

        // The probe area is the extent pulled in by the edge inset at both
        // ends, so it is compared as a width rather than an absolute -- the
        // inset is a legitimate part of the number and asserting it away would
        // hide the thing under test.
        //
        // 50mm is 1.969in. A maxX of 49.921 means the millimetre extent came
        // through untouched and only the inset was ever converted.
        const inset = 2 / 25.4;
        expect(maxX - minX).toBeCloseTo(50 / 25.4 - 2 * inset, 2);
        expect(maxY - minY).toBeCloseTo(40 / 25.4 - 2 * inset, 2);
        expect(maxX).toBeLessThan(50 / 25.4);
    });
});
