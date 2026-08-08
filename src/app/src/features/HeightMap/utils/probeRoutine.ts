/*
 * Probing Routine Generator for Height Map
 * Generates G-code commands for the probing sequence
 */

import { HeightMapConfig, HeightMapData, HeightMapPoint } from '../definitions';

/**
 * Generate commands for probing a single point
 * Used for step-by-step probing where we wait for each probe result
 */
export const generateSingleProbeCommand = (
    x: number,
    y: number,
    zClearance: number,
    probeFeedRate: number,
    maxProbeDepth: number,
): string => {
    // Return a single command string that will be executed
    // Order: 1) Raise to safe Z, 2) Move to XY position, 3) Probe down
    //
    // The positioning moves carry their own G90 because zClearance and the
    // grid coordinates are positions in the work coordinate system, not
    // distances to travel.
    //
    // The probe itself is switched to G91 so maxProbeDepth means "distance to
    // travel down before alarming", which is what the UI promises and what
    // gSender's own probing does (see lib/Probing.ts). Left in G90 this would
    // seek the absolute coordinate Z-maxProbeDepth, making the real stroke
    // zClearance + maxProbeDepth.
    //
    // G90 is restored explicitly: the controller's 'gcode:safe' handler wraps
    // only the units modal (G20/G21), so nothing downstream would undo a
    // lingering G91 before the next point's positioning moves.
    return [
        `G90 G0 Z${zClearance}`,
        `G90 G0 X${x.toFixed(3)} Y${y.toFixed(3)}`,
        'G91',
        `G38.2 Z-${maxProbeDepth} F${probeFeedRate}`,
        'G90',
    ].join('\n');
};

/**
 * Convert a probe reading into the work coordinate system.
 *
 * grbl and grblHAL both report [PRB:...] in MACHINE coordinates -- report.c
 * states "Report in terms of machine position" -- and gSender forwards the line
 * untouched, so the number the serial handler sees is not a work coordinate.
 * grbl defines the relationship as WPos = MPos - WCO (see GrblRunner).
 *
 * This matters because the transformer adds the map value straight onto the
 * commanded Z. Skipping this conversion offsets every cut by the whole work
 * offset, which on a Z-max-homed machine is tens of millimetres of plunge.
 */
export const probeZToWorkZ = (prbZ: number, wcoZ: number): number => prbZ - wcoZ;

/**
 * Create a height map data structure from probe results
 *
 * `zValues` are raw PRB readings in machine coordinates and `wcoZ` is the work
 * coordinate offset they were taken against. Both are required so the datum
 * conversion cannot be forgotten at the one place it has to happen.
 */
export const createHeightMapFromProbeResults = (
    probePoints: { x: number; y: number }[],
    zValues: number[],
    config: HeightMapConfig,
    units: string,
    wcoZ: number,
): HeightMapData => {
    if (probePoints.length !== zValues.length) {
        throw new Error('Probe points and Z values arrays must have the same length');
    }

    if (!Number.isFinite(wcoZ)) {
        throw new Error('Work coordinate offset is required to build a height map');
    }

    const points: HeightMapPoint[] = probePoints.map((point, index) => ({
        x: point.x,
        y: point.y,
        z: probeZToWorkZ(zValues[index], wcoZ),
    }));

    // Calculate actual resolution from the points
    const uniqueX = [...new Set(probePoints.map((p) => p.x))].sort((a, b) => a - b);
    const uniqueY = [...new Set(probePoints.map((p) => p.y))].sort((a, b) => a - b);

    const resX = uniqueX.length > 1 ? uniqueX[1] - uniqueX[0] : config.gridSpacing;
    const resY = uniqueY.length > 1 ? uniqueY[1] - uniqueY[0] : config.gridSpacing;

    return {
        bounds: {
            minX: config.minX,
            maxX: config.maxX,
            minY: config.minY,
            maxY: config.maxY,
        },
        resolution: {
            x: resX,
            y: resY,
        },
        points,
        createdAt: new Date().toISOString(),
        units,
    };
};

/**
 * Headroom on the computed probe duration.
 *
 * The computed figure is an ideal: constant velocity, no acceleration ramps, no
 * controller buffering, no USB latency, and a rapid rate we cannot see from
 * here. Four times covers all of that. The asymmetry matters -- a timeout that
 * is too short aborts a valid slow probe partway through a grid, which is a
 * hazard in itself, while one that is too long only delays reporting a machine
 * that was never going to answer.
 */
export const DEFAULT_PROBE_TIMEOUT_MULTIPLIER = 4;

/** Floor, so a fast shallow probe still gets a survivable window. */
export const MIN_PROBE_TIMEOUT_MS = 10000;

/**
 * Allowance for the two positioning rapids before the probe move.
 *
 * G0 rate is not known to this widget -- it lives in $110-$112 and differs per
 * machine and firmware -- so this is a deliberate allowance rather than a
 * calculation, and the multiplier above is what actually absorbs the error.
 */
export const PROBE_RAPID_ALLOWANCE_MS = 5000;

export interface ProbeTimeoutInputs {
    zClearance: number;
    maxProbeDepth: number;
    probeFeedRate: number;
    settleDelayMs?: number;
    rapidAllowanceMs?: number;
    multiplier?: number;
}

/**
 * How long to wait for one point's [PRB:...] before declaring the cycle stuck.
 *
 * The probe starts at zClearance and travels at most maxProbeDepth at
 * probeFeedRate, so the plunge is maxProbeDepth / probeFeedRate minutes. Depth
 * and feed rate are always in the same unit system, so the ratio is unit
 * agnostic and no conversion is needed here.
 */
export const calculateProbeTimeoutMs = ({
    maxProbeDepth,
    probeFeedRate,
    settleDelayMs = 100,
    rapidAllowanceMs = PROBE_RAPID_ALLOWANCE_MS,
    multiplier = DEFAULT_PROBE_TIMEOUT_MULTIPLIER,
}: ProbeTimeoutInputs): number => {
    const usable =
        Number.isFinite(maxProbeDepth) &&
        Number.isFinite(probeFeedRate) &&
        probeFeedRate > 0 &&
        maxProbeDepth > 0;

    // A bad feed rate is caught by the UI minimums, but falling back to the
    // floor keeps a nonsense config from producing NaN or Infinity here and
    // disarming the watchdog entirely.
    const plungeMs = usable ? (maxProbeDepth / probeFeedRate) * 60000 : 0;
    const expectedMs = plungeMs + rapidAllowanceMs + settleDelayMs;

    return Math.max(MIN_PROBE_TIMEOUT_MS, Math.ceil(expectedMs * multiplier));
};

/** Exact, unlike the display helpers in app/lib/units which round to 2-3 dp. */
const MM_PER_INCH = 25.4;

/**
 * Configuration fields that are a length, or a length per minute.
 *
 * probeFeedRate is included deliberately. The widget's own display conversion
 * omits it, so an imperial workspace showed millimetres per minute under an
 * in/min label and then sent that number to the controller unchanged.
 */
const LENGTH_FIELDS = [
    'minX',
    'maxX',
    'minY',
    'maxY',
    'gridSpacing',
    'edgeInset',
    'zClearance',
    'maxProbeDepth',
    'segmentLength',
    'probeFeedRate',
] as const;

/**
 * Convert a workspace-units configuration into millimetres.
 *
 * The widget holds its configuration in whatever units the workspace displays,
 * but everything past this point is millimetres and has to be:
 *
 *   - the probe command is issued under G21;
 *   - [PRB:] and WCO: are reported in millimetres whenever $13 is 0, which is
 *     independent of G20/G21 -- those govern program input, not reports;
 *   - the map is handed to the transformer, which scales by 25.4 if the map
 *     claims inches, so a map carrying millimetre probe readings must say so.
 *
 * Converting in one place is what keeps the command, validateProbeTravel, the
 * XY correlation check and the map stamp from disagreeing with each other.
 * Persisted state is already millimetre-canonical, so this extends an existing
 * convention rather than inventing one.
 */
export const probeConfigToMillimetres = <T extends HeightMapConfig>(
    config: T,
    isMetric: boolean,
): T => {
    if (isMetric) {
        return config;
    }

    const scaled = { ...config };
    for (const field of LENGTH_FIELDS) {
        const value = scaled[field];
        if (typeof value === 'number' && Number.isFinite(value)) {
            (scaled as Record<string, unknown>)[field] = value * MM_PER_INCH;
        }
    }
    return scaled;
};

/**
 * Confirm the controller reports positions in millimetres.
 *
 * $13 switches status and parameter reports to inches on its own, without
 * touching G20/G21. Every number this feature consumes from the controller --
 * the probe Z, the work offset, the probe XY used for correlation -- comes from
 * a report, so $13=1 scales the entire datum by 25.4 while the g-code side
 * still looks correct. Supporting it properly is a larger job; refusing is the
 * honest interim.
 *
 * An unread setting is refused too. Guessing costs a 25.4x datum error, and the
 * remedy -- reconnect so the EEPROM is read -- is cheap.
 */
export const validateReportUnits = (
    eeprom: Record<string, unknown> | null | undefined,
): { valid: boolean; error?: string } => {
    const raw = eeprom?.$13;

    if (raw === undefined || raw === null || raw === '') {
        return {
            valid: false,
            error:
                'Cannot confirm the controller reports positions in millimetres ' +
                '($13 has not been read). Reconnect to the machine and try again.',
        };
    }

    if (Number(raw) !== 0) {
        return {
            valid: false,
            error:
                'The controller is set to report positions in inches ($13=1), ' +
                'which the height map does not support. Set $13=0 and re-home ' +
                'before probing.',
        };
    }

    return { valid: true };
};

/**
 * Pull the Z work coordinate offset out of the raw controller status.
 *
 * Read from `controller.state.status`, NOT from the `mpos`/`wpos` on the redux
 * controller slice: those have been through mapPosToFeedbackUnits for display
 * and can be unit-converted, whereas status and the PRB report share the
 * controller's own units and so cancel cleanly.
 *
 * The value can arrive as a string -- the runners write positions back through
 * toFixed() -- so it is coerced rather than type-checked. A missing or
 * unusable offset is reported as a failure instead of falling back to zero,
 * because zero is indistinguishable from a real answer and produces a
 * full-depth plunge on any machine where work zero is not machine zero.
 */
export const resolveWorkOffsetZ = (
    status: { wco?: { z?: unknown } } | null | undefined,
): { ok: true; wcoZ: number } | { ok: false; error: string } => {
    const raw = status?.wco?.z;

    if (raw === null || raw === undefined || raw === '') {
        return {
            ok: false,
            error:
                'No work coordinate offset reported by the controller. Connect and ' +
                'let the machine report its position before probing.',
        };
    }

    const wcoZ = Number(raw);
    if (!Number.isFinite(wcoZ)) {
        return {
            ok: false,
            error: `Work coordinate offset from the controller is not a number (got "${String(raw)}").`,
        };
    }

    return { ok: true, wcoZ };
};

/**
 * Check the probe can physically reach the surface.
 *
 * Each point starts at zClearance above work zero and travels maxProbeDepth
 * down, so the deepest it can reach is zClearance - maxProbeDepth. Unless that
 * is below work zero the probe cannot touch a surface sitting near it, and
 * every point in the grid will alarm. Catching it up front beats discovering it
 * partway through a cycle.
 */
export const validateProbeTravel = (
    zClearance: number,
    maxProbeDepth: number,
    units: string,
): { valid: boolean; error?: string } => {
    if (maxProbeDepth > zClearance) {
        return { valid: true };
    }

    return {
        valid: false,
        error:
            `Max probe depth (${maxProbeDepth}${units}) must be greater than the Z ` +
            `clearance (${zClearance}${units}). The probe starts at the clearance ` +
            'height, so it would stop before reaching the surface and alarm.',
    };
};

/**
 * Spot a height map saved before maps were referenced to work Z zero.
 *
 * Older builds shifted every map so its lowest point sat exactly at zero, which
 * destroyed the original datum -- it cannot be recovered from the file, so this
 * warns rather than migrating. The signature is a minimum of exactly zero with
 * something above it; a map that straddles zero, sits wholly to one side, or is
 * uniformly flat was never re-datumed that way.
 */
export const describeLegacyNormalizedMap = (
    mapData: HeightMapData,
): string | null => {
    if (!mapData?.points || mapData.points.length === 0) {
        return null;
    }

    const zValues = mapData.points.map((p) => p.z);
    const minZ = Math.min(...zValues);
    const maxZ = Math.max(...zValues);

    if (minZ !== 0 || maxZ <= 0) {
        return null;
    }

    return (
        'This map\'s lowest point is exactly 0, which is how height maps were ' +
        'saved before they were referenced to work Z zero. If it came from an ' +
        'older build its depths will be off by the original lowest probed ' +
        'height -- re-probe to be certain.'
    );
};

/**
 * Validate height map data
 */
export const validateHeightMap = (
    mapData: HeightMapData | null,
): { valid: boolean; error?: string } => {
    if (!mapData) {
        return { valid: false, error: 'No height map data' };
    }

    if (!mapData.points || mapData.points.length === 0) {
        return { valid: false, error: 'Height map has no probe points' };
    }

    if (!mapData.bounds) {
        return { valid: false, error: 'Height map has no bounds defined' };
    }

    // Check for at least 4 points (minimum for bilinear interpolation)
    if (mapData.points.length < 4) {
        return { valid: false, error: 'Height map needs at least 4 probe points' };
    }

    // Check for valid grid structure
    const uniqueX = [...new Set(mapData.points.map((p) => p.x))];
    const uniqueY = [...new Set(mapData.points.map((p) => p.y))];

    if (uniqueX.length < 2 || uniqueY.length < 2) {
        return { valid: false, error: 'Height map needs at least 2x2 grid' };
    }

    return { valid: true };
};
