/*
 * The probe cycle state machine.
 *
 * This is the decision logic that used to live inside handleSerialRead, where
 * it could not be tested and where three faults hid:
 *
 *   1. Any [PRB:...] on the wire was accepted, from any source sharing the
 *      connection -- the Probe widget, a macro, a pendant.
 *   2. Readings were PUSHED, so one stray shifted every later reading one slot
 *      against the grid. The cycle then hit the point count an entry early, the
 *      two arrays matched in length, nothing threw, and the operator got a
 *      silently scrambled surface.
 *   3. Nothing noticed when a response never came.
 *
 * The machine here is pure: responses in, actions out, no controller, no React,
 * no timers. The component is left holding only the parts that genuinely need
 * the outside world.
 */

import {
    beginProbeCycle,
    handleProbeResponse,
    handleProbeTimeout,
    parseProbeResponse,
    MAX_CONSECUTIVE_MISMATCHES,
} from '../utils/probeCycle';

const POINTS = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 0, y: 10 },
    { x: 10, y: 10 },
];

/** Z-max homed router: work zero sits well down the column from machine zero. */
const WCO = { x: -300, y: -200, z: -85 };

const config = {
    points: POINTS,
    wco: WCO,
    xyTolerance: 0.1,
};

/** A PRB line as the controller would emit it for a given grid point. */
const prbFor = (
    index: number,
    surfaceZ: number,
    success: boolean = true,
): string => {
    const p = POINTS[index];
    return `[PRB:${(p.x + WCO.x).toFixed(3)},${(p.y + WCO.y).toFixed(3)},${(
        surfaceZ + WCO.z
    ).toFixed(3)}:${success ? 1 : 0}]`;
};

describe('parseProbeResponse', () => {
    it('reads position and result from a PRB line', () => {
        expect(parseProbeResponse('[PRB:-300.000,-200.000,-85.250:1]')).toEqual({
            x: -300,
            y: -200,
            z: -85.25,
            success: true,
        });
    });

    it('reads the failure flag', () => {
        const parsed = parseProbeResponse('[PRB:-300.000,-200.000,-95.000:0]');
        expect(parsed?.success).toBe(false);
    });

    it('ignores lines that are not PRB reports', () => {
        for (const line of ['ok', '<Idle|MPos:0,0,0>', 'error:9', '[GC:G0 G54]', '']) {
            expect(parseProbeResponse(line)).toBeNull();
        }
    });
});

describe('beginProbeCycle', () => {
    it('asks for the first point and marks it outstanding', () => {
        const { state, action } = beginProbeCycle(config);
        expect(action).toEqual({ type: 'probe', index: 0, point: POINTS[0] });
        expect(state.awaitingIndex).toBe(0);
        expect(state.status).toBe('probing');
    });

    it('refuses an empty grid rather than idling forever', () => {
        const { action } = beginProbeCycle({ ...config, points: [] });
        expect(action.type).toBe('fail');
    });
});

describe('handleProbeResponse', () => {
    it('walks the grid one point at a time', () => {
        let { state } = beginProbeCycle(config);

        for (let i = 0; i < POINTS.length - 1; i++) {
            const step = handleProbeResponse(state, parseProbeResponse(prbFor(i, 0.1))!);
            expect(step.action).toEqual({
                type: 'probe',
                index: i + 1,
                point: POINTS[i + 1],
            });
            state = step.state;
        }

        const last = handleProbeResponse(
            state,
            parseProbeResponse(prbFor(POINTS.length - 1, 0.1))!,
        );
        expect(last.action.type).toBe('complete');
        expect(last.state.status).toBe('complete');
    });

    it('returns readings in grid order, in machine coordinates', () => {
        // Conversion to work coordinates happens later, in one place; the cycle
        // stores exactly what the controller reported.
        const surface = [0.1, -0.2, 0.35, 0];
        let { state } = beginProbeCycle(config);
        let action;
        for (let i = 0; i < POINTS.length; i++) {
            ({ state, action } = handleProbeResponse(
                state,
                parseProbeResponse(prbFor(i, surface[i]))!,
            ));
        }
        expect(action).toEqual({
            type: 'complete',
            zValues: surface.map((z) => Number((z + WCO.z).toFixed(3))),
        });
    });

    it('stores by index, so a slot can never shift against the grid', () => {
        let { state } = beginProbeCycle(config);
        ({ state } = handleProbeResponse(state, parseProbeResponse(prbFor(0, 0.1))!));
        expect(state.zValues[0]).toBeCloseTo(0.1 + WCO.z, 3);
        expect(state.zValues[1]).toBeNull();
        expect(state.zValues).toHaveLength(POINTS.length);
    });

    it('ignores a stray PRB from another source without corrupting the grid', () => {
        // The exact scenario that produced a scrambled map: something else on
        // the connection answers while we are waiting for point 1.
        let { state } = beginProbeCycle(config);
        ({ state } = handleProbeResponse(state, parseProbeResponse(prbFor(0, 0.1))!));

        const stray = handleProbeResponse(
            state,
            parseProbeResponse('[PRB:-123.456,-77.000,-40.000:1]')!,
        );
        expect(stray.action.type).toBe('ignore');
        expect(stray.state.awaitingIndex).toBe(1);
        expect(stray.state.zValues[1]).toBeNull();

        // The real answer for point 1 still lands in slot 1.
        const real = handleProbeResponse(stray.state, parseProbeResponse(prbFor(1, -0.2))!);
        expect(real.state.zValues[1]).toBeCloseTo(-0.2 + WCO.z, 3);
        expect(real.action).toEqual({ type: 'probe', index: 2, point: POINTS[2] });
    });

    it('ignores a PRB when nothing is outstanding', () => {
        // After completion the machine may still emit; none of it is ours.
        let { state } = beginProbeCycle(config);
        for (let i = 0; i < POINTS.length; i++) {
            ({ state } = handleProbeResponse(state, parseProbeResponse(prbFor(i, 0))!));
        }
        const late = handleProbeResponse(state, parseProbeResponse(prbFor(0, 0))!);
        expect(late.action.type).toBe('ignore');
        expect(late.state.zValues).toEqual(state.zValues);
    });

    it('gives up after repeated mismatches rather than waiting for the watchdog', () => {
        // One stray is noise. A run of them means something systematic -- wrong
        // datum, wrong axes, another process probing in a loop -- and naming it
        // beats a generic timeout several seconds later.
        let { state } = beginProbeCycle(config);
        let action;
        for (let i = 0; i < MAX_CONSECUTIVE_MISMATCHES; i++) {
            ({ state, action } = handleProbeResponse(
                state,
                parseProbeResponse('[PRB:1.000,2.000,3.000:1]')!,
            ));
        }
        expect(action!.type).toBe('fail');
        expect(state.status).toBe('error');
        expect(state.error).toMatch(/expected/i);
    });

    it('forgives an isolated stray between good points', () => {
        let { state } = beginProbeCycle(config);
        for (let i = 0; i < POINTS.length - 1; i++) {
            ({ state } = handleProbeResponse(
                state,
                parseProbeResponse('[PRB:9.000,9.000,9.000:1]')!,
            ));
            ({ state } = handleProbeResponse(state, parseProbeResponse(prbFor(i, 0.1))!));
        }
        expect(state.status).toBe('probing');
        expect(state.awaitingIndex).toBe(POINTS.length - 1);
    });

    it('accepts positions within tolerance', () => {
        // Real machines report the position they reached, not the one commanded.
        let { state } = beginProbeCycle(config);
        const near = `[PRB:${(POINTS[0].x + WCO.x + 0.04).toFixed(3)},${(
            POINTS[0].y + WCO.y - 0.04
        ).toFixed(3)},-85.000:1]`;
        const step = handleProbeResponse(state, parseProbeResponse(near)!);
        expect(step.action.type).toBe('probe');
    });

    it('rejects a position further out than the tolerance', () => {
        const { state } = beginProbeCycle(config);
        const off = `[PRB:${(POINTS[0].x + WCO.x + 0.5).toFixed(3)},${(
            POINTS[0].y + WCO.y
        ).toFixed(3)},-85.000:1]`;
        expect(handleProbeResponse(state, parseProbeResponse(off)!).action.type).toBe(
            'ignore',
        );
    });

    it('cannot confuse two adjacent grid points', () => {
        // The property that makes the tolerance safe: it is far below the
        // smallest grid spacing the UI allows.
        const { state } = beginProbeCycle(config);
        const neighbour = parseProbeResponse(prbFor(1, 0.1))!;
        expect(handleProbeResponse(state, neighbour).action.type).toBe('ignore');
    });

    it('stops on a failed probe and says which point', () => {
        let { state } = beginProbeCycle(config);
        ({ state } = handleProbeResponse(state, parseProbeResponse(prbFor(0, 0.1))!));
        const failed = handleProbeResponse(state, parseProbeResponse(prbFor(1, -9, false))!);

        expect(failed.action.type).toBe('fail');
        expect(failed.state.status).toBe('error');
        expect(failed.state.error).toContain('2 of 4');
    });

    it('does not accept a failed probe as a reading', () => {
        const { state } = beginProbeCycle(config);
        const failed = handleProbeResponse(state, parseProbeResponse(prbFor(0, -9, false))!);
        expect(failed.state.zValues[0]).toBeNull();
    });
});

describe('handleProbeTimeout', () => {
    it('fails naming the point that went quiet', () => {
        const { state } = beginProbeCycle(config);
        const timedOut = handleProbeTimeout(state);

        expect(timedOut.action.type).toBe('fail');
        expect(timedOut.state.status).toBe('error');
        expect(timedOut.state.error).toContain('1 of 4');
    });

    it('names the right point partway through', () => {
        let { state } = beginProbeCycle(config);
        ({ state } = handleProbeResponse(state, parseProbeResponse(prbFor(0, 0.1))!));
        expect(handleProbeTimeout(state).state.error).toContain('2 of 4');
    });

    it('suggests what to check', () => {
        const { state } = beginProbeCycle(config);
        expect(handleProbeTimeout(state).state.error).toMatch(/probe|connect|stock/i);
    });

    it('does nothing once the cycle is already finished', () => {
        // A watchdog that fires as the last response lands must not clobber a
        // good result.
        let { state } = beginProbeCycle(config);
        for (let i = 0; i < POINTS.length; i++) {
            ({ state } = handleProbeResponse(state, parseProbeResponse(prbFor(i, 0))!));
        }
        const late = handleProbeTimeout(state);
        expect(late.action.type).toBe('ignore');
        expect(late.state.status).toBe('complete');
    });
});
