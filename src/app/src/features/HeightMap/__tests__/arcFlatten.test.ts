/*
 * Unit tests for the arc flattening maths.
 *
 * These are pure-function tests: no interpreter, no height map. They pin the
 * behaviours that are easy to get subtly wrong and impossible to notice in a
 * visualizer -- endpoint drift, full-circle detection, sweep direction, plane
 * permutation, and the tolerance-to-segment-count relationship.
 */

import {
    Vec3,
    arcSweep,
    flattenArc,
    segmentsForTolerance,
    unswizzle,
} from '../utils/arcFlatten';

const TWO_PI = Math.PI * 2;

describe('arcSweep', () => {
    it('sweeps counter-clockwise positively', () => {
        expect(arcSweep(0, Math.PI / 2, false)).toBeCloseTo(Math.PI / 2, 10);
    });

    it('sweeps clockwise negatively', () => {
        expect(arcSweep(Math.PI / 2, 0, true)).toBeCloseTo(-Math.PI / 2, 10);
    });

    it('wraps counter-clockwise across the -pi/pi discontinuity', () => {
        // From 170deg to -170deg going CCW is +20deg, not -340deg.
        const s = arcSweep((170 * Math.PI) / 180, (-170 * Math.PI) / 180, false);
        expect(s).toBeCloseTo((20 * Math.PI) / 180, 10);
    });

    it('wraps clockwise across the -pi/pi discontinuity', () => {
        const s = arcSweep((-170 * Math.PI) / 180, (170 * Math.PI) / 180, true);
        expect(s).toBeCloseTo((-20 * Math.PI) / 180, 10);
    });

    it('treats a coincident start and end as a full circle, not a no-op', () => {
        // This is the case a naive `end - start` returns 0 for, silently
        // dropping a full-circle move.
        expect(arcSweep(0, 0, false)).toBeCloseTo(TWO_PI, 10);
        expect(arcSweep(0, 0, true)).toBeCloseTo(-TWO_PI, 10);
        expect(arcSweep(1.234, 1.234, false)).toBeCloseTo(TWO_PI, 10);
    });
});

describe('segmentsForTolerance', () => {
    it('needs more segments as tolerance tightens', () => {
        const loose = segmentsForTolerance(10, Math.PI, 0.1);
        const tight = segmentsForTolerance(10, Math.PI, 0.001);
        expect(tight).toBeGreaterThan(loose);
    });

    it('needs more segments as radius grows at fixed tolerance', () => {
        const small = segmentsForTolerance(5, Math.PI, 0.01);
        const large = segmentsForTolerance(500, Math.PI, 0.01);
        expect(large).toBeGreaterThan(small);
    });

    it('actually respects the requested sagitta', () => {
        const r = 25;
        const sweep = Math.PI / 2;
        const tol = 0.01;
        const n = segmentsForTolerance(r, sweep, tol);
        const theta = sweep / n;
        const sagitta = r * (1 - Math.cos(theta / 2));
        expect(sagitta).toBeLessThanOrEqual(tol + 1e-9);
    });

    it('degrades gracefully on degenerate input', () => {
        expect(segmentsForTolerance(0, Math.PI, 0.01)).toBe(1);
        expect(segmentsForTolerance(10, 0, 0.01)).toBe(1);
        expect(segmentsForTolerance(10, Math.PI, 100)).toBe(1);
    });
});

describe('unswizzle', () => {
    // The interpreter permutes coordinates into the active plane's frame before
    // invoking the callback; these are the exact inverses.
    it('is identity on G17', () => {
        expect(unswizzle({ x: 1, y: 2, z: 3 }, 'G17')).toEqual({ x: 1, y: 2, z: 3 });
    });

    it('inverts the G18 permutation', () => {
        // forward: [x,y,z] = [z,x,y]
        const real: Vec3 = { x: 1, y: 2, z: 3 };
        const swizzled: Vec3 = { x: real.z, y: real.x, z: real.y };
        expect(unswizzle(swizzled, 'G18')).toEqual(real);
    });

    it('inverts the G19 permutation', () => {
        // forward: [x,y,z] = [y,z,x]
        const real: Vec3 = { x: 1, y: 2, z: 3 };
        const swizzled: Vec3 = { x: real.y, y: real.z, z: real.x };
        expect(unswizzle(swizzled, 'G19')).toEqual(real);
    });
});

describe('flattenArc', () => {
    const centre: Vec3 = { x: 0, y: 0, z: 0 };

    it('lands exactly on the programmed endpoint', () => {
        // Float drift across thousands of arcs is cumulative, so the last point
        // must be snapped rather than computed.
        const start: Vec3 = { x: 10, y: 0, z: 0 };
        const end: Vec3 = { x: 0, y: 10, z: 0 };
        const pts = flattenArc(start, end, centre, 'G17', false, { tolerance: 0.001 });
        const last = pts[pts.length - 1];
        expect(last.x).toBe(0);
        expect(last.y).toBe(10);
    });

    it('keeps intermediate points on the arc', () => {
        const pts = flattenArc(
            { x: 10, y: 0, z: 0 },
            { x: 0, y: 10, z: 0 },
            centre,
            'G17',
            false,
            { tolerance: 0.001 },
        );
        for (const p of pts) {
            expect(Math.hypot(p.x, p.y)).toBeCloseTo(10, 3);
        }
    });

    it('honours sweep direction', () => {
        const start: Vec3 = { x: 10, y: 0, z: 0 };
        const end: Vec3 = { x: 0, y: 10, z: 0 };
        // CCW from 0deg to 90deg passes through 45deg (+x, +y).
        const ccw = flattenArc(start, end, centre, 'G17', false, { tolerance: 0.01 });
        expect(ccw.some((p) => p.x > 0 && p.y > 0)).toBe(true);
        // CW from 0deg to 90deg goes the long way round, through -y then -x.
        const cw = flattenArc(start, end, centre, 'G17', true, { tolerance: 0.01 });
        expect(cw.some((p) => p.y < -5)).toBe(true);
        expect(cw.some((p) => p.x < -5)).toBe(true);
        expect(cw.length).toBeGreaterThan(ccw.length);
    });

    it('expands a full circle rather than emitting a single point', () => {
        const p: Vec3 = { x: 10, y: 0, z: 0 };
        const pts = flattenArc(p, { ...p }, centre, 'G17', false, { tolerance: 0.01 });
        expect(pts.length).toBeGreaterThan(10);
        // It must actually traverse the circle.
        expect(pts.some((q) => q.x < -9)).toBe(true);
        // ...and return to the start.
        expect(pts[pts.length - 1].x).toBeCloseTo(10, 6);
        expect(pts[pts.length - 1].y).toBeCloseTo(0, 6);
    });

    it('interpolates Z through a helical arc', () => {
        const pts = flattenArc(
            { x: 10, y: 0, z: 0 },
            { x: 0, y: 10, z: -5 },
            centre,
            'G17',
            false,
            { tolerance: 0.01 },
        );
        expect(pts[pts.length - 1].z).toBeCloseTo(-5, 6);
        // Monotonic descent, no overshoot.
        for (let i = 1; i < pts.length; i++) {
            expect(pts[i].z).toBeLessThanOrEqual(pts[i - 1].z + 1e-9);
        }
        expect(Math.min(...pts.map((p) => p.z))).toBeGreaterThanOrEqual(-5 - 1e-9);
    });

    it('absorbs a mismatched endpoint radius without drifting', () => {
        // CAM output routinely rounds so the endpoint is not exactly `radius`
        // from the centre. Using the start radius alone would miss the endpoint.
        const start: Vec3 = { x: 10, y: 0, z: 0 };
        const end: Vec3 = { x: 0, y: 10.5, z: 0 }; // 0.5mm inconsistent
        const pts = flattenArc(start, end, centre, 'G17', false, { tolerance: 0.01 });
        const last = pts[pts.length - 1];
        expect(last.x).toBe(0);
        expect(last.y).toBe(10.5);
    });

    it('caps chord length at maxSegmentLength', () => {
        const pts = flattenArc(
            { x: 50, y: 0, z: 0 },
            { x: -50, y: 0, z: 0 },
            centre,
            'G17',
            false,
            { tolerance: 1, maxSegmentLength: 2 },
        );
        let prev = { x: 50, y: 0, z: 0 };
        for (const p of pts) {
            expect(Math.hypot(p.x - prev.x, p.y - prev.y)).toBeLessThanOrEqual(2.5);
            prev = p;
        }
    });

    it('respects the maxSegments ceiling', () => {
        const pts = flattenArc(
            { x: 1000, y: 0, z: 0 },
            { x: -1000, y: 0, z: 0 },
            centre,
            'G17',
            false,
            { tolerance: 1e-9, maxSegments: 50 },
        );
        expect(pts.length).toBeLessThanOrEqual(50);
    });

    it('falls back to a straight move on a zero-radius arc', () => {
        const p: Vec3 = { x: 0, y: 0, z: 0 };
        const pts = flattenArc(p, { x: 0, y: 0, z: 0 }, centre, 'G17', false);
        expect(pts).toEqual([{ x: 0, y: 0, z: 0 }]);
    });

    it('emits real machine coordinates for a G18 arc', () => {
        // Plane-local input; the helical axis is local Z, which is real Y.
        const pts = flattenArc(
            { x: 10, y: 0, z: 0 },
            { x: 0, y: 10, z: 4 },
            { x: 0, y: 0, z: 0 },
            'G18',
            false,
            { tolerance: 0.01 },
        );
        const last = pts[pts.length - 1];
        // unswizzle(G18): real = { x: local.y, y: local.z, z: local.x }
        expect(last).toEqual({ x: 10, y: 4, z: 0 });
    });
});
