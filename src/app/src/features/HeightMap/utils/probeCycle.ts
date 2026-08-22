/*
 * Probe cycle state machine for the Height Map tool.
 *
 * Pure by design: responses in, actions out. No controller, no React, no
 * timers. The component that drives this owns the machine and the clock; this
 * owns the decisions, which is where the faults were.
 *
 * The [PRB:...] report is shared. Anything else on the connection -- the Probe
 * widget, a macro, a pendant -- emits the same line, and the cycle has no way
 * to tell whose it is except by looking at where the machine says it was. So
 * every response is checked against the point actually outstanding, and
 * readings are written to a fixed slot rather than appended.
 */

export interface ProbePoint {
    x: number;
    y: number;
}

export interface ProbeResponse {
    /** Machine coordinates, as reported. */
    x: number;
    y: number;
    z: number;
    success: boolean;
}

export interface ProbeCycleConfig {
    points: ProbePoint[];
    /** Work coordinate offset captured when the cycle started. */
    wco: { x: number; y: number; z: number };
    /** Max XY deviation, in the same units as the grid, before a response is disowned. */
    xyTolerance: number;
}

export interface ProbeCycleState extends ProbeCycleConfig {
    /** One slot per grid point; null until that point answers. Machine coordinates. */
    zValues: (number | null)[];
    /** Index of the point we are waiting on, or null when nothing is outstanding. */
    awaitingIndex: number | null;
    consecutiveMismatches: number;
    status: 'probing' | 'complete' | 'error';
    error?: string;
}

export type ProbeCycleAction =
    | { type: 'probe'; index: number; point: ProbePoint }
    | { type: 'complete'; zValues: number[] }
    | { type: 'fail'; message: string }
    | { type: 'ignore'; reason: string };

export interface ProbeCycleStep {
    state: ProbeCycleState;
    action: ProbeCycleAction;
}

/**
 * How many responses in a row may fail to match before the cycle gives up.
 *
 * One mismatch is an unrelated probe elsewhere on the connection and is
 * harmless to skip. A run of them means something systematic -- the datum moved,
 * the axes are not what we think, something is probing in a loop -- and saying
 * so immediately beats letting the watchdog report a generic timeout later.
 */
export const MAX_CONSECUTIVE_MISMATCHES = 3;

/*
 * grblHAL reports every configured axis, so the coordinate list is not always
 * three long -- a machine with a fourth motor emits `[PRB:x,y,z,a:1]`. Anchoring
 * the result flag directly after Z meant no response matched on those machines:
 * every point timed out and the cycle died on point one with the tool left at
 * the trigger position. gSender's own parameter parser accepts x,y,z,a,b,c, so
 * trailing axes are consumed and ignored here rather than assumed absent.
 */
const PRB_PATTERN = /\[PRB:(-?[\d.]+),(-?[\d.]+),(-?[\d.]+)(?:,-?[\d.]+)*:([01])\]/;

/**
 * Pull a probe report out of a serial line, or null if it is not one.
 */
export const parseProbeResponse = (line: string): ProbeResponse | null => {
    const match = typeof line === 'string' ? line.match(PRB_PATTERN) : null;
    if (!match) {
        return null;
    }

    const [x, y, z] = [match[1], match[2], match[3]].map(Number);
    if (![x, y, z].every(Number.isFinite)) {
        return null;
    }

    return { x, y, z, success: match[4] === '1' };
};

/** Human-facing point number, for messages the operator has to act on. */
const pointLabel = (state: ProbeCycleState, index: number): string =>
    `${index + 1} of ${state.points.length}`;

const failed = (state: ProbeCycleState, message: string): ProbeCycleStep => ({
    state: { ...state, status: 'error', error: message, awaitingIndex: null },
    action: { type: 'fail', message },
});

const ignored = (state: ProbeCycleState, reason: string): ProbeCycleStep => ({
    state,
    action: { type: 'ignore', reason },
});

export const beginProbeCycle = (config: ProbeCycleConfig): ProbeCycleStep => {
    const state: ProbeCycleState = {
        ...config,
        zValues: config.points.map(() => null),
        awaitingIndex: null,
        consecutiveMismatches: 0,
        status: 'probing',
    };

    if (config.points.length === 0) {
        return failed(state, 'No probe points to run.');
    }

    return {
        state: { ...state, awaitingIndex: 0 },
        action: { type: 'probe', index: 0, point: config.points[0] },
    };
};

/**
 * Does this report come from the point we are waiting on?
 *
 * The grid is in work coordinates and the report is in machine coordinates, so
 * the expected position is the point plus the captured work offset. The probe
 * only moves in Z, so the XY it reports is the position it was commanded to and
 * should match closely; the tolerance exists for step quantisation and the
 * three-decimal rounding in the command, not for real travel.
 */
export const matchesExpectedPoint = (
    response: ProbeResponse,
    expected: ProbePoint,
    wco: { x: number; y: number },
    xyTolerance: number,
): boolean =>
    Math.abs(response.x - (expected.x + wco.x)) <= xyTolerance &&
    Math.abs(response.y - (expected.y + wco.y)) <= xyTolerance;

export const handleProbeResponse = (
    state: ProbeCycleState,
    response: ProbeResponse,
): ProbeCycleStep => {
    if (state.status !== 'probing' || state.awaitingIndex === null) {
        return ignored(state, 'No probe outstanding');
    }

    const index = state.awaitingIndex;
    const expected = state.points[index];

    if (!matchesExpectedPoint(response, expected, state.wco, state.xyTolerance)) {
        const consecutiveMismatches = state.consecutiveMismatches + 1;
        const where =
            `expected X${(expected.x + state.wco.x).toFixed(3)} ` +
            `Y${(expected.y + state.wco.y).toFixed(3)}, ` +
            `got X${response.x.toFixed(3)} Y${response.y.toFixed(3)}`;

        if (consecutiveMismatches >= MAX_CONSECUTIVE_MISMATCHES) {
            return failed(
                { ...state, consecutiveMismatches },
                `Probe responses do not match point ${pointLabel(state, index)} ` +
                    `(${where}). Something else may be probing on this connection, ` +
                    'or the work offset changed after probing started.',
            );
        }

        return ignored(
            { ...state, consecutiveMismatches },
            `Response did not match point ${pointLabel(state, index)} (${where})`,
        );
    }

    if (!response.success) {
        return failed(
            state,
            `Probe did not make contact at point ${pointLabel(state, index)}. ` +
                'Check the probe is connected and the stock is within reach.',
        );
    }

    const zValues = [...state.zValues];
    zValues[index] = response.z;

    const nextIndex = index + 1;
    const advanced: ProbeCycleState = {
        ...state,
        zValues,
        consecutiveMismatches: 0,
    };

    if (nextIndex < state.points.length) {
        return {
            state: { ...advanced, awaitingIndex: nextIndex },
            action: { type: 'probe', index: nextIndex, point: state.points[nextIndex] },
        };
    }

    const missing = zValues.findIndex((z) => z === null);
    if (missing !== -1) {
        // Belt and braces: index-addressed writes make this unreachable, but a
        // short map is the failure that used to pass silently.
        return failed(
            { ...advanced, zValues },
            `No reading recorded for point ${pointLabel(state, missing)}.`,
        );
    }

    return {
        state: { ...advanced, awaitingIndex: null, status: 'complete' },
        action: { type: 'complete', zValues: zValues as number[] },
    };
};

export const handleProbeTimeout = (state: ProbeCycleState): ProbeCycleStep => {
    if (state.status !== 'probing' || state.awaitingIndex === null) {
        // The watchdog can fire just as the last response lands. Never clobber a
        // finished cycle.
        return ignored(state, 'Cycle already finished');
    }

    return failed(
        state,
        `No probe response for point ${pointLabel(state, state.awaitingIndex)}. ` +
            'Check the probe is connected and clipped on, that the stock is under ' +
            'the bit, and that the machine did not alarm.',
    );
};
