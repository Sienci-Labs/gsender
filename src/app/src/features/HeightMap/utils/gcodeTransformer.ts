/*
 * G-code Transformation Engine for Height Map
 *
 * Applies a probed surface map to a program by resolving every motion command
 * to absolute machine coordinates, subdividing it finely enough that the map
 * can be sampled along the path, and re-emitting it with per-point Z offsets.
 *
 * Parsing is delegated to `GCodeVirtualizer` -- the same interpreter that backs
 * gSender's visualizer -- rather than pattern-matching raw text. That is a
 * correctness requirement, not a convenience: the interpreter resolves modal
 * motion (bare `X10 Y10` continuation lines), incremental mode, unit modals,
 * arc R-to-centre conversion, plane selection and line numbers. A regex parser
 * silently mis-handles all of these, and -- worst of all -- loses track of the
 * tool position across any command it does not recognise, which makes every
 * subsequent move segment from a stale origin.
 *
 * Output contract
 * ---------------
 *   - all motion is re-emitted as absolute (`G90`) millimetre (`G21`) moves;
 *   - non-motion lines pass through verbatim, minus distance/unit modal words
 *     that would contradict the above;
 *   - programs using commands whose semantics we cannot faithfully preserve are
 *     REFUSED with an explanation rather than silently mis-transformed.
 */

import GCodeVirtualizer from 'app/lib/GCodeVirtualizer';
import { HeightMapData } from '../definitions';
import { getZOffset, isWithinBounds } from './interpolation';
import { ArcPlane, Vec3, flattenArc } from './arcFlatten';

export interface TransformOptions {
    /** Max distance between sampled points, in height-map units. */
    segmentLength: number;
    warnOutsideBounds: boolean;
    /** Max chord deviation when flattening arcs, in height-map units. */
    arcTolerance?: number;
}

export interface TransformResult {
    transformedGcode: string;
    warnings: string[];
    /** Non-empty means the program was refused and `transformedGcode` is ''. */
    errors: string[];
}

/** Minimal structural view of the virtualizer's modal state. */
interface ModalLike {
    motion: string;
    plane: string;
    units: string;
    distance: string;
}

interface LinearMotion {
    kind: 'line';
    rapid: boolean;
    incremental: boolean;
    from: Vec3;
    to: Vec3;
}

interface ArcMotion {
    kind: 'arc';
    rapid: false;
    incremental: boolean;
    plane: ArcPlane;
    clockwise: boolean;
    from: Vec3;
    to: Vec3;
    centre: Vec3;
}

type Motion = LinearMotion | ArcMotion;

const MM_PER_INCH = 25.4;
const DEFAULT_ARC_TOLERANCE_MM = 0.005;
const COORD_DECIMALS = 4;

const isImperial = (units?: string): boolean =>
    typeof units === 'string' && /^(in|inch|imperial)$/i.test(units.trim());

/** Split a line into its executable portion and any trailing comment. */
const splitComment = (line: string): { code: string; comment: string } => {
    const idx = line.search(/[;(]/);
    if (idx < 0) {
        return { code: line, comment: '' };
    }
    return { code: line.slice(0, idx), comment: line.slice(idx) };
};

/*
 * Commands we refuse rather than mis-handle.
 *
 * G90.1 - absolute arc centre mode. The interpreter hardcodes G91.1.
 * G92 / G10 - coordinate system mutation. The interpreter folds these into the
 *         positions it reports; passing the original command through as well
 *         would apply the shift a second time.
 * G73/G76/G81-G89 - canned cycles. Motion is implied by the controller and is
 *         never reported to us, so it would escape compensation entirely.
 */
const UNSUPPORTED_PATTERNS: { pattern: RegExp; label: string }[] = [
    { pattern: /\bG90\.1\b/i, label: 'G90.1 (absolute arc centre mode)' },
    { pattern: /\bG92(?!\.[^1])/i, label: 'G92 (coordinate system offset)' },
    { pattern: /\bG10\b/i, label: 'G10 (coordinate system data)' },
    { pattern: /\bG7[36]\b/i, label: 'canned cycle (G73/G76)' },
    { pattern: /\bG8[1-9]\b/i, label: 'canned cycle (G81-G89)' },
];

/*
 * Position barriers.
 *
 * G28/G30 (return to home via an intermediate point) and G53 (one-shot motion
 * in machine coordinates) all move the tool somewhere the interpreter does not
 * model, so afterwards its idea of the tool position is stale. Every Fusion
 * post emits `G28 G91 Z0` in the preamble and again in the postamble, so
 * refusing these would reject essentially every real program.
 *
 * Instead the barrier line is passed through verbatim -- keeping its own
 * distance-mode modal, which is load-bearing (`G28 G91 Z0` retracts Z from
 * where it is; `G28 Z0` would first plunge to work zero) -- and the position is
 * marked untrusted until the program re-establishes all three axes.
 */
const BARRIER_PATTERN = /\bG(?:28|30|53)\b/i;

const AXIS_WORD_PATTERN = /\b([XYZ])\s*-?[\d.]/gi;

/** Which axis words a source line actually commands. */
const commandedAxes = (code: string): Set<string> => {
    const found = new Set<string>();
    let m: RegExpExecArray | null;
    AXIS_WORD_PATTERN.lastIndex = 0;
    while ((m = AXIS_WORD_PATTERN.exec(code)) !== null) {
        found.add(m[1].toUpperCase());
    }
    return found;
};

/** Strip distance/unit modals that would contradict our forced G90/G21. */
const stripConflictingModals = (code: string): string =>
    code
        .replace(/\bG(?:90|91|20|21)(?![\d.])/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();

/** True when a line carries no executable content once modals are removed. */
const isBlankCode = (code: string): boolean =>
    code.replace(/\bN\d+\b/gi, '').trim().length === 0;

const fmt = (n: number): string => {
    const s = n.toFixed(COORD_DECIMALS);
    // Avoid emitting "-0.0000"
    return s === `-${(0).toFixed(COORD_DECIMALS)}` ? (0).toFixed(COORD_DECIMALS) : s;
};

/** Convert a height map to millimetres so it can be sampled in machine space. */
const normalizeMapToMm = (mapData: HeightMapData): HeightMapData => {
    if (!isImperial(mapData.units)) {
        return mapData;
    }
    return {
        ...mapData,
        units: 'mm',
        bounds: {
            minX: mapData.bounds.minX * MM_PER_INCH,
            maxX: mapData.bounds.maxX * MM_PER_INCH,
            minY: mapData.bounds.minY * MM_PER_INCH,
            maxY: mapData.bounds.maxY * MM_PER_INCH,
        },
        resolution: {
            x: mapData.resolution.x * MM_PER_INCH,
            y: mapData.resolution.y * MM_PER_INCH,
        },
        points: mapData.points.map((p) => ({
            x: p.x * MM_PER_INCH,
            y: p.y * MM_PER_INCH,
            z: p.z * MM_PER_INCH,
        })),
    };
};

const scanUnsupported = (gcode: string): string[] => {
    const found = new Map<string, number>();
    const lines = gcode.split('\n');

    for (let i = 0; i < lines.length; i++) {
        const { code } = splitComment(lines[i]);
        if (!code.trim()) {
            continue;
        }
        for (const { pattern, label } of UNSUPPORTED_PATTERNS) {
            if (pattern.test(code) && !found.has(label)) {
                found.set(label, i + 1);
            }
        }
    }

    return [...found.entries()].map(
        ([label, line]) =>
            `Unsupported command ${label} at line ${line}. ` +
            `Height map compensation was not applied, because this command cannot be ` +
            `re-emitted safely. Remove it or post-process the file without it.`,
    );
};

/**
 * Run the interpreter over the program, capturing the motion produced by each
 * source line. Returns one entry per line, in order.
 */
const collectMotionPerLine = (
    lines: string[],
): {
    perLine: Motion[][];
    sawRotary: boolean;
} => {
    let pending: Motion[] = [];
    let sawRotary = false;

    const vm = new GCodeVirtualizer({
        addLine: (modal: ModalLike, v1: Vec3, v2: Vec3) => {
            pending.push({
                kind: 'line',
                rapid: modal.motion === 'G0',
                incremental: modal.distance === 'G91',
                from: { x: v1.x, y: v1.y, z: v1.z },
                to: { x: v2.x, y: v2.y, z: v2.z },
            });
        },
        addArcCurve: (modal: ModalLike, v1: Vec3, v2: Vec3, v0: Vec3) => {
            // `modal` is a live mutable reference inside the interpreter --
            // read what we need now rather than retaining it.
            const plane = (modal.plane || 'G17') as ArcPlane;
            pending.push({
                kind: 'arc',
                rapid: false,
                incremental: modal.distance === 'G91',
                plane,
                clockwise: modal.motion === 'G2',
                from: { x: v1.x, y: v1.y, z: v1.z },
                to: { x: v2.x, y: v2.y, z: v2.z },
                centre: { x: v0.x, y: v0.y, z: v0.z },
            });
        },
        addCurve: () => {
            // Rotary/A-axis helical motion. Surface compensation is not
            // meaningful on a rotary program.
            sawRotary = true;
        },
    });

    const perLine: Motion[][] = [];
    for (const line of lines) {
        pending = [];
        vm.virtualize(line);
        perLine.push(pending);
    }

    return { perLine, sawRotary };
};

/** Densify a straight move so the height map can be sampled along it. */
const subdivideLine = (from: Vec3, to: Vec3, maxSegmentLength: number): Vec3[] => {
    const dist = Math.hypot(to.x - from.x, to.y - from.y);

    if (!Number.isFinite(maxSegmentLength) || maxSegmentLength <= 0 || dist <= maxSegmentLength) {
        return [to];
    }

    const n = Math.ceil(dist / maxSegmentLength);
    const points: Vec3[] = [];
    for (let i = 1; i <= n; i++) {
        if (i === n) {
            points.push(to);
            break;
        }
        const t = i / n;
        points.push({
            x: from.x + (to.x - from.x) * t,
            y: from.y + (to.y - from.y) * t,
            z: from.z + (to.z - from.z) * t,
        });
    }
    return points;
};

export const transformGcode = (
    gcode: string,
    mapData: HeightMapData,
    options: TransformOptions = { segmentLength: 1, warnOutsideBounds: true },
): TransformResult => {
    const warnings: string[] = [];

    const errors = scanUnsupported(gcode);
    if (errors.length > 0) {
        return { transformedGcode: '', warnings, errors };
    }

    const map = normalizeMapToMm(mapData);
    const unitScale = isImperial(mapData.units) ? MM_PER_INCH : 1;
    const segmentLengthMm = Math.max(options.segmentLength * unitScale, 1e-4);
    const arcToleranceMm =
        options.arcTolerance !== undefined
            ? options.arcTolerance * unitScale
            : DEFAULT_ARC_TOLERANCE_MM;

    const lines = gcode.split('\n');

    let perLine: Motion[][];
    let sawRotary: boolean;
    try {
        ({ perLine, sawRotary } = collectMotionPerLine(lines));
    } catch (err) {
        return {
            transformedGcode: '',
            warnings,
            errors: [
                `Could not parse the G-code program: ${
                    err instanceof Error ? err.message : String(err)
                }`,
            ],
        };
    }

    if (sawRotary) {
        return {
            transformedGcode: '',
            warnings,
            errors: [
                'This program contains rotary (A-axis) motion. Height map ' +
                    'compensation applies to a flat surface and cannot be used here.',
            ],
        };
    }

    const out: string[] = [
        '; Height Map Applied by gSender',
        `; Map bounds: X[${map.bounds.minX}, ${map.bounds.maxX}] Y[${map.bounds.minY}, ${map.bounds.maxY}]`,
        `; Grid points: ${map.points.length}`,
        '; Motion below is absolute (G90) and metric (G21).',
        'G21',
        'G90',
        '',
    ];

    let outsideBoundsWarned = false;
    const displacedWords: number[] = [];

    // Position trust. Starts true (the interpreter begins at a known origin) and
    // is revoked by any barrier until the program re-establishes every axis.
    let trusted = true;
    const reestablished = new Set<string>();

    const emitPoint = (rapid: boolean, p: Vec3, feed: string | null): void => {
        if (options.warnOutsideBounds && !outsideBoundsWarned && !isWithinBounds(p.x, p.y, map)) {
            warnings.push(
                'G-code extends outside the probed area. Z offsets there are ' +
                    'extrapolated from the nearest edge points.',
            );
            outsideBoundsWarned = true;
        }
        const z = p.z + getZOffset(p.x, p.y, map);
        out.push(
            `${rapid ? 'G0' : 'G1'} X${fmt(p.x)} Y${fmt(p.y)} Z${fmt(z)}${feed ? ` ${feed}` : ''}`,
        );
    };

    /**
     * Re-emit a move without compensation, restricted to the axes the source
     * line actually commanded. Used while the tool position is untrusted: the
     * commanded axes are absolute and therefore reliable, while the axes the
     * line omits would carry the interpreter's stale values.
     */
    const emitUncompensated = (
        rapid: boolean,
        to: Vec3,
        axes: Set<string>,
        feed: string | null,
    ): void => {
        const parts: string[] = [rapid ? 'G0' : 'G1'];
        if (axes.has('X')) parts.push(`X${fmt(to.x)}`);
        if (axes.has('Y')) parts.push(`Y${fmt(to.y)}`);
        if (axes.has('Z')) parts.push(`Z${fmt(to.z)}`);
        if (parts.length === 1) {
            return;
        }
        if (feed) parts.push(feed);
        out.push(parts.join(' '));
    };

    for (let i = 0; i < lines.length; i++) {
        const raw = lines[i];
        const motions = perLine[i];
        const { code: rawCode } = splitComment(raw);

        // --- position barrier -------------------------------------------------
        // Passed through with its own modals intact, then our absolute/metric
        // context is restored. Any motion the interpreter attributed to this
        // line is discarded: it is computed against a position we cannot trust.
        if (BARRIER_PATTERN.test(rawCode)) {
            out.push(raw.trim());
            out.push('G21 G90');
            trusted = false;
            reestablished.clear();
            continue;
        }

        if (motions.length === 0) {
            const { code, comment } = splitComment(raw);
            const stripped = stripConflictingModals(code);
            if (isBlankCode(stripped) && comment) {
                out.push(comment.trim());
            } else if (!isBlankCode(stripped)) {
                out.push(comment ? `${stripped} ${comment.trim()}` : stripped);
            } else if (!code.trim() && !comment) {
                out.push('');
            }
            continue;
        }

        const { code, comment } = splitComment(raw);
        const axes = commandedAxes(code);

        if (!trusted) {
            // An incremental move against an unknown position is unresolvable.
            if (motions.some((m) => m.incremental)) {
                return {
                    transformedGcode: '',
                    warnings,
                    errors: [
                        `Line ${i + 1} makes an incremental move while the tool ` +
                            'position is unknown (following a G28/G30/G53). The ' +
                            'resulting position cannot be determined, so no height ' +
                            'map was applied.',
                    ],
                };
            }

            for (const axis of axes) {
                reestablished.add(axis);
            }

            const feedMatch = code.match(/\bF(-?\d*\.?\d+)\b/i);
            if (comment) out.push(comment.trim());
            for (const motion of motions) {
                emitUncompensated(
                    motion.rapid,
                    motion.to,
                    axes,
                    feedMatch ? `F${feedMatch[1]}` : null,
                );
            }

            if (reestablished.has('X') && reestablished.has('Y') && reestablished.has('Z')) {
                trusted = true;
            }
            continue;
        }

        // Feed word rides on the first emitted segment only.
        const feedMatch = code.match(/\bF(-?\d*\.?\d+)\b/i);
        let feed: string | null = feedMatch ? `F${feedMatch[1]}` : null;

        // Words that are neither motion nor coordinates still have to reach the
        // controller. Emitting them after the move preserves the common
        // end-of-block cases (M5/M9/M30); flag it so the operator can check.
        const trailing = code
            .replace(/\bG\d+(?:\.\d+)?/gi, ' ')
            .replace(/\b[XYZIJKRF](?:-?\d*\.?\d+)/gi, ' ')
            .replace(/\bN\d+\b/gi, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        if (trailing) {
            displacedWords.push(i + 1);
        }

        if (comment) {
            out.push(comment.trim());
        }

        for (const motion of motions) {
            const points =
                motion.kind === 'arc'
                    ? flattenArc(motion.from, motion.to, motion.centre, motion.plane, motion.clockwise, {
                          tolerance: arcToleranceMm,
                          maxSegmentLength: segmentLengthMm,
                      })
                    : subdivideLine(motion.from, motion.to, segmentLengthMm);

            for (const p of points) {
                emitPoint(motion.rapid, p, feed);
                feed = null;
            }
        }

        if (trailing) {
            out.push(trailing);
        }
    }

    if (displacedWords.length > 0) {
        const shown = displacedWords.slice(0, 5).join(', ');
        const more = displacedWords.length > 5 ? ` (+${displacedWords.length - 5} more)` : '';
        warnings.push(
            `Lines ${shown}${more} combined motion with other commands. Those ` +
                'commands are now emitted after the move; verify ordering if they ' +
                'control the spindle or coolant.',
        );
    }

    return { transformedGcode: out.join('\n'), warnings, errors: [] };
};

/**
 * Compare the program's travelled extents against the probed area.
 * Uses the interpreter so modal, incremental and arc moves are all accounted
 * for -- a text scan for X/Y words misses continuation lines and arc bulge.
 */
export const validateGcodeBounds = (
    gcode: string,
    mapData: HeightMapData,
): {
    valid: boolean;
    gcodeMinX: number;
    gcodeMaxX: number;
    gcodeMinY: number;
    gcodeMaxY: number;
} => {
    const map = normalizeMapToMm(mapData);
    const lines = gcode.split('\n');

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    const consider = (p: Vec3): void => {
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
    };

    try {
        const { perLine } = collectMotionPerLine(lines);
        for (const motions of perLine) {
            for (const motion of motions) {
                consider(motion.from);
                consider(motion.to);
                if (motion.kind === 'arc') {
                    for (const p of flattenArc(
                        motion.from,
                        motion.to,
                        motion.centre,
                        motion.plane,
                        motion.clockwise,
                        { tolerance: DEFAULT_ARC_TOLERANCE_MM },
                    )) {
                        consider(p);
                    }
                }
            }
        }
    } catch {
        // Fall through to the empty-extent result below.
    }

    const empty = minX === Infinity;
    const valid =
        !empty &&
        minX >= map.bounds.minX &&
        maxX <= map.bounds.maxX &&
        minY >= map.bounds.minY &&
        maxY <= map.bounds.maxY;

    return {
        valid,
        gcodeMinX: empty ? 0 : minX,
        gcodeMaxX: empty ? 0 : maxX,
        gcodeMinY: empty ? 0 : minY,
        gcodeMaxY: empty ? 0 : maxY,
    };
};
