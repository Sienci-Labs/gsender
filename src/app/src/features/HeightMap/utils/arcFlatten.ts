/*
 * Arc flattening for the Height Map transformer.
 *
 * Converts a G2/G3 arc into a polyline dense enough that a height map can be
 * sampled along it. Pure maths -- no THREE.js, no DOM, no worker globals -- so
 * it is unit-testable and usable from any context.
 *
 * Coordinate contract
 * -------------------
 * `GCodeVirtualizer` hands its `addArcCurve` callback coordinates that have
 * ALREADY been permuted into the active plane's frame (see the G2 handler in
 * `app/src/lib/GCodeVirtualizer.ts`). In that frame the arc always lies in
 * local XY and the local Z is the helical axis. `unswizzle()` maps a local
 * point back to real machine XYZ.
 *
 * Differences from the visualizer's inline tessellation
 * (`app/src/workers/Visualize.worker.ts`), which is tuned for GPU vertex budget
 * rather than machining accuracy:
 *   - segment count comes from a sagitta (chord-deviation) bound instead of a
 *     hardcoded [4, 25] clamp;
 *   - the radius is interpolated from start to end, so CAM files whose endpoint
 *     radius disagrees with the start radius still terminate exactly on the
 *     programmed endpoint instead of drifting;
 *   - the final point is snapped to the exact programmed endpoint.
 */

export interface Vec3 {
    x: number;
    y: number;
    z: number;
}

export type ArcPlane = 'G17' | 'G18' | 'G19';

export interface FlattenArcOptions {
    /** Max allowed deviation between the chord and the true arc, in mm. */
    tolerance?: number;
    /** Max chord length, in mm. Usually the height-map segment length. */
    maxSegmentLength?: number;
    /** Hard ceiling on emitted points, to bound pathological input. */
    maxSegments?: number;
}

const DEFAULT_TOLERANCE = 0.005; // mm
const DEFAULT_MAX_SEGMENTS = 20000;
const FULL_CIRCLE_EPSILON = 1e-6;

/**
 * Map a point from the plane-local frame the virtualizer emits back to real
 * machine XYZ. Inverse of the permutation in the G2/G3 handlers.
 */
export const unswizzle = (p: Vec3, plane: ArcPlane): Vec3 => {
    if (plane === 'G18') {
        // forward was [x,y,z] = [z,x,y]
        return { x: p.y, y: p.z, z: p.x };
    }
    if (plane === 'G19') {
        // forward was [x,y,z] = [y,z,x]
        return { x: p.z, y: p.x, z: p.y };
    }
    return { x: p.x, y: p.y, z: p.z };
};

/**
 * Signed sweep angle from `startAngle` to `endAngle`, respecting direction.
 * A start/end pair that coincides means a full circle, not a zero-length arc.
 */
export const arcSweep = (
    startAngle: number,
    endAngle: number,
    isClockwise: boolean,
): number => {
    const TWO_PI = Math.PI * 2;
    let delta = endAngle - startAngle;

    if (isClockwise) {
        while (delta > 0) {
            delta -= TWO_PI;
        }
        while (delta <= -TWO_PI) {
            delta += TWO_PI;
        }
        if (Math.abs(delta) < FULL_CIRCLE_EPSILON) {
            delta = -TWO_PI;
        }
    } else {
        while (delta < 0) {
            delta += TWO_PI;
        }
        while (delta >= TWO_PI) {
            delta -= TWO_PI;
        }
        if (Math.abs(delta) < FULL_CIRCLE_EPSILON) {
            delta = TWO_PI;
        }
    }

    return delta;
};

/**
 * Number of chords needed so the sagitta stays within `tolerance`.
 *
 *   sagitta = r * (1 - cos(theta / 2))  =>  theta = 2 * acos(1 - tol / r)
 */
export const segmentsForTolerance = (
    radius: number,
    sweep: number,
    tolerance: number,
): number => {
    const absSweep = Math.abs(sweep);
    if (radius <= 0 || absSweep === 0) {
        return 1;
    }
    // Tolerance at or beyond the radius imposes no meaningful constraint.
    if (tolerance >= radius) {
        return 1;
    }
    const maxTheta = 2 * Math.acos(1 - tolerance / radius);
    if (!Number.isFinite(maxTheta) || maxTheta <= 0) {
        return 1;
    }
    return Math.max(1, Math.ceil(absSweep / maxTheta));
};

/**
 * Flatten an arc into a polyline.
 *
 * @param v1 start point, plane-local frame, mm
 * @param v2 end point, plane-local frame, mm
 * @param v0 centre point, plane-local frame, mm
 * @param plane active plane modal
 * @param isClockwise true for G2
 * @returns real-XYZ points EXCLUDING the start and INCLUDING the exact endpoint
 */
export const flattenArc = (
    v1: Vec3,
    v2: Vec3,
    v0: Vec3,
    plane: ArcPlane,
    isClockwise: boolean,
    options: FlattenArcOptions = {},
): Vec3[] => {
    const {
        tolerance = DEFAULT_TOLERANCE,
        maxSegmentLength = Infinity,
        maxSegments = DEFAULT_MAX_SEGMENTS,
    } = options;

    const exactEnd = unswizzle(v2, plane);

    const r1 = Math.hypot(v1.x - v0.x, v1.y - v0.y);
    const r2 = Math.hypot(v2.x - v0.x, v2.y - v0.y);

    // Degenerate arc (zero radius): fall back to a straight move.
    if (r1 < FULL_CIRCLE_EPSILON && r2 < FULL_CIRCLE_EPSILON) {
        return [exactEnd];
    }

    const startAngle = Math.atan2(v1.y - v0.y, v1.x - v0.x);
    const endAngle = Math.atan2(v2.y - v0.y, v2.x - v0.x);
    const sweep = arcSweep(startAngle, endAngle, isClockwise);

    const meanRadius = (r1 + r2) / 2;
    const arcLength = Math.abs(sweep) * meanRadius;

    let n = segmentsForTolerance(meanRadius, sweep, tolerance);
    if (Number.isFinite(maxSegmentLength) && maxSegmentLength > 0) {
        n = Math.max(n, Math.ceil(arcLength / maxSegmentLength));
    }
    n = Math.max(1, Math.min(n, maxSegments));

    const points: Vec3[] = [];
    for (let i = 1; i <= n; i++) {
        const t = i / n;

        if (i === n) {
            // Snap to the programmed endpoint; never accumulate float drift.
            points.push(exactEnd);
            break;
        }

        const angle = startAngle + sweep * t;
        // Interpolating the radius absorbs CAM endpoint-radius rounding.
        const radius = r1 + (r2 - r1) * t;

        const local: Vec3 = {
            x: v0.x + radius * Math.cos(angle),
            y: v0.y + radius * Math.sin(angle),
            z: v1.z + (v2.z - v1.z) * t, // helical axis, linear in t
        };
        points.push(unswizzle(local, plane));
    }

    return points;
};
