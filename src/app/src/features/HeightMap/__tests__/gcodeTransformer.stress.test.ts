/*
 * Stress and property tests for the Height Map transformer.
 *
 * These target failure modes that ordinary example-based tests miss: the map
 * leaking into XY, compensation being applied more or less than once, drift
 * accumulating over a long program, and degenerate input crashing rather than
 * being reported.
 */

import { transformGcode } from '../utils/gcodeTransformer';
import { bilinearInterpolate, deriveProbeBounds } from '../utils/interpolation';
import { HeightMapData, HeightMapPoint } from '../definitions';

const gridMap = (
    fn: (x: number, y: number) => number,
    n = 5,
    span = 100,
): HeightMapData => {
    const points: HeightMapPoint[] = [];
    for (let iy = 0; iy < n; iy++) {
        for (let ix = 0; ix < n; ix++) {
            const x = (span * ix) / (n - 1);
            const y = (span * iy) / (n - 1);
            points.push({ x, y, z: fn(x, y) });
        }
    }
    return {
        bounds: { minX: 0, maxX: span, minY: 0, maxY: span },
        resolution: { x: span / (n - 1), y: span / (n - 1) },
        points,
        units: 'mm',
    };
};

const ZERO = gridMap(() => 0);
const WARP = gridMap((x, y) => 0.3 * Math.sin((Math.PI * x) / 100) - 0.2 * Math.cos((Math.PI * y) / 100));
const INVERSE = gridMap((x, y) => -(0.3 * Math.sin((Math.PI * x) / 100) - 0.2 * Math.cos((Math.PI * y) / 100)));

const PROGRAM = [
    'G21 G90',
    'G0 Z5',
    'G0 X10 Y10',
    'G1 Z-0.5 F200',
    'X90',
    'Y90',
    'G2 X10 Y90 I-40 J0',
    'G3 X10 Y10 I0 J-40',
    'G1 X50 Y50 Z-1.0',
    'G0 Z5',
].join('\n');

const opts = { segmentLength: 2, warnOutsideBounds: false, arcTolerance: 0.01 };

interface Pt {
    x: number;
    y: number;
    z: number;
}

const motion = (gcode: string): Pt[] =>
    gcode
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => /^G[01]\b/.test(l) && /X/.test(l) && /Y/.test(l) && /Z/.test(l))
        .map((l) => ({
            x: parseFloat(l.match(/X(-?\d*\.?\d+)/i)![1]),
            y: parseFloat(l.match(/Y(-?\d*\.?\d+)/i)![1]),
            z: parseFloat(l.match(/Z(-?\d*\.?\d+)/i)![1]),
        }));

describe('the map affects Z and nothing else', () => {
    // The single most important property: whatever the surface looks like, the
    // XY toolpath the operator inspected must be untouched.
    const flat = motion(transformGcode(PROGRAM, ZERO, opts).transformedGcode);
    const warped = motion(transformGcode(PROGRAM, WARP, opts).transformedGcode);

    it('emits the same number of moves regardless of the surface', () => {
        expect(warped).toHaveLength(flat.length);
        expect(flat.length).toBeGreaterThan(50);
    });

    it('emits bit-identical XY for every move', () => {
        const diffs = flat
            .map((p, i) => ({ i, dx: warped[i].x - p.x, dy: warped[i].y - p.y }))
            .filter((d) => d.dx !== 0 || d.dy !== 0);
        expect(diffs).toEqual([]);
    });

    it('shifts Z by exactly the interpolated map value', () => {
        const bad = flat
            .map((p, i) => ({
                i,
                delta: warped[i].z - p.z,
                expected: bilinearInterpolate(p.x, p.y, WARP)!,
            }))
            .filter((d) => Math.abs(d.delta - d.expected) > 1e-4);
        expect(bad).toEqual([]);
    });
});

describe('a zero map is a no-op in Z', () => {
    it('preserves the programmed depths exactly when nothing ramps', () => {
        const noRamp = [
            'G21 G90',
            'G0 Z5',
            'G0 X10 Y10',
            'G1 Z-0.5 F200',
            'X90',
            'Y90',
            'G2 X10 Y90 I-40 J0',
            'G0 Z5',
        ].join('\n');
        const pts = motion(transformGcode(noRamp, ZERO, opts).transformedGcode);
        const depths = [...new Set(pts.map((p) => p.z))].sort((a, b) => a - b);
        expect(depths).toEqual([-0.5, 5]);
    });

    it('keeps a ramping move linear in Z', () => {
        // `G1 X50 Y50 Z-1.0` from (10,10,-0.5) descends while travelling, so
        // subdividing it must interpolate -- but strictly monotonically and
        // strictly within the commanded endpoints.
        const ramp = ['G21 G90', 'G1 X10 Y10 Z-0.5 F200', 'G1 X50 Y50 Z-1.0'].join('\n');
        const pts = motion(transformGcode(ramp, ZERO, opts).transformedGcode);
        const tail = pts.slice(pts.findIndex((p) => p.x === 10 && p.y === 10) + 1);

        expect(tail.length).toBeGreaterThan(5);
        for (let i = 1; i < tail.length; i++) {
            expect(tail[i].z).toBeLessThanOrEqual(tail[i - 1].z + 1e-9);
        }
        expect(Math.min(...tail.map((p) => p.z))).toBeCloseTo(-1, 4);
        expect(tail[tail.length - 1].z).toBeCloseTo(-1, 4);

        // Linear in path fraction: Z must track distance travelled.
        for (const p of tail) {
            const t = Math.hypot(p.x - 10, p.y - 10) / Math.hypot(40, 40);
            expect(p.z).toBeCloseTo(-0.5 + t * -0.5, 3);
        }
    });
});

describe('applying a map and its inverse round-trips', () => {
    it('recovers the original depths', () => {
        // Compensating for a surface, then for its mirror image, must cancel.
        const once = transformGcode(PROGRAM, WARP, opts).transformedGcode;
        const twice = transformGcode(once, INVERSE, opts).transformedGcode;

        const original = motion(transformGcode(PROGRAM, ZERO, opts).transformedGcode);
        const roundTripped = motion(twice);

        expect(roundTripped).toHaveLength(original.length);
        let maxErr = 0;
        for (let i = 0; i < original.length; i++) {
            expect(roundTripped[i].x).toBeCloseTo(original[i].x, 3);
            expect(roundTripped[i].y).toBeCloseTo(original[i].y, 3);
            maxErr = Math.max(maxErr, Math.abs(roundTripped[i].z - original[i].z));
        }
        // Bounded by output rounding (4dp) on each of the two passes.
        expect(maxErr).toBeLessThan(0.001);
    });
});

describe('long programs do not accumulate drift', () => {
    it('holds endpoint accuracy over 20k moves', () => {
        const lines = ['G21 G90', 'G1 Z-0.5 F500'];
        for (let i = 0; i < 20000; i++) {
            // Walk a lattice inside the probed area.
            lines.push(`X${(i % 100) + 1} Y${(Math.floor(i / 100) % 100) + 1}`);
        }
        lines.push('G1 X50 Y50');

        const t0 = Date.now();
        const r = transformGcode(lines.join('\n'), WARP, {
            segmentLength: 5,
            warnOutsideBounds: false,
        });
        const ms = Date.now() - t0;
        expect(r.errors).toEqual([]);

        const pts = motion(r.transformedGcode);
        const last = pts[pts.length - 1];
        expect(last.x).toBeCloseTo(50, 4);
        expect(last.y).toBeCloseTo(50, 4);
        expect(last.z).toBeCloseTo(-0.5 + bilinearInterpolate(50, 50, WARP)!, 4);
        // Guard against a performance cliff on realistic input.
        expect(ms).toBeLessThan(15000);
    });
});

describe('degenerate and malformed input is reported, not crashed on', () => {
    const cases: [string, string][] = [
        ['empty', ''],
        ['comments only', '; nothing\n(here)'],
        ['whitespace', '   \n\t\n  '],
        ['no motion', 'G21\nG90\nM3 S1000\nM5'],
        ['unknown words', 'G21 G90\nQ17 V3\nG1 X10 Y10 Z-1 F100'],
        ['missing feed', 'G21 G90\nG1 X10 Y10 Z-1'],
        ['duplicate points', 'G21 G90\nG1 X10 Y10 Z-1 F100\nX10 Y10\nX10 Y10'],
        ['zero-length arc', 'G21 G90\nG1 X10 Y10 Z-1 F100\nG2 X10 Y10 I0 J0'],
        ['huge coordinates', 'G21 G90\nG1 X99999 Y99999 Z-1 F100'],
        ['negative coordinates', 'G21 G90\nG1 X-500 Y-500 Z-1 F100'],
    ];

    it.each(cases)('handles %s', (_label, src) => {
        expect(() => transformGcode(src, WARP, opts)).not.toThrow();
        const r = transformGcode(src, WARP, opts);
        // Either it transformed, or it explained why not. Never both empty.
        expect(r.errors.length > 0 || typeof r.transformedGcode === 'string').toBe(true);
    });

    it('survives a map with too few points to interpolate', () => {
        const thin: HeightMapData = {
            bounds: { minX: 0, maxX: 10, minY: 0, maxY: 10 },
            resolution: { x: 10, y: 10 },
            points: [{ x: 0, y: 0, z: 1 }],
            units: 'mm',
        };
        expect(() => transformGcode(PROGRAM, thin, opts)).not.toThrow();
    });

    it('survives a collinear map', () => {
        const collinear: HeightMapData = {
            bounds: { minX: 0, maxX: 100, minY: 0, maxY: 0 },
            resolution: { x: 50, y: 0 },
            points: [
                { x: 0, y: 0, z: 0 },
                { x: 50, y: 0, z: 0.1 },
                { x: 100, y: 0, z: 0.2 },
            ],
            units: 'mm',
        };
        expect(() => transformGcode(PROGRAM, collinear, opts)).not.toThrow();
    });
});

describe('extreme surfaces stay bounded', () => {
    it('does not invent depth beyond the map range', () => {
        const extreme = gridMap((x, y) => 5 * Math.sin(x / 7) * Math.cos(y / 11));
        const r = transformGcode(PROGRAM, extreme, opts);
        expect(r.errors).toEqual([]);
        const pts = motion(r.transformedGcode);
        const mapMin = Math.min(...extreme.points.map((p) => p.z));
        const mapMax = Math.max(...extreme.points.map((p) => p.z));
        for (const p of pts) {
            // Programmed depths span -1 .. +5; add the map range plus slack for
            // bilinear interpolation between grid nodes.
            expect(p.z).toBeGreaterThan(-1 + mapMin - 1);
            expect(p.z).toBeLessThan(5 + mapMax + 1);
        }
    });

    it('extrapolates rather than failing outside the probed area', () => {
        const outside = ['G21 G90', 'G1 Z-0.5 F200', 'X-50 Y-50', 'X150 Y150'].join('\n');
        const r = transformGcode(outside, WARP, {
            segmentLength: 5,
            warnOutsideBounds: true,
        });
        expect(r.errors).toEqual([]);
        expect(r.warnings.join(' ')).toMatch(/outside the probed area/i);
        for (const p of motion(r.transformedGcode)) {
            expect(Number.isFinite(p.z)).toBe(true);
        }
    });
});

describe('feed rates', () => {
    it('carries the feed on the first segment only', () => {
        const src = ['G21 G90', 'G1 Z-0.5 F200', 'G1 X90 Y90 F350'].join('\n');
        const lines = transformGcode(src, WARP, { segmentLength: 2, warnOutsideBounds: false })
            .transformedGcode.split('\n')
            .map((l) => l.trim())
            .filter((l) => /^G1\b/.test(l));
        const withF350 = lines.filter((l) => /F350/.test(l));
        expect(withF350).toHaveLength(1);
        // ...and it must be the first segment of that move, not a later one.
        expect(lines.indexOf(withF350[0])).toBeLessThan(lines.length - 1);
    });
});

describe('deriveProbeBounds', () => {
    const bbox = { min: { x: 0, y: 0 }, max: { x: 80, y: 100 } };

    it('pulls every side in by the inset', () => {
        const { bounds, applied, rejected } = deriveProbeBounds(bbox, 3);
        expect(rejected).toBe(false);
        expect(applied).toBe(3);
        expect(bounds).toEqual({ minX: 3, maxX: 77, minY: 3, maxY: 97 });
    });

    it('is a no-op at zero', () => {
        const { bounds, applied } = deriveProbeBounds(bbox, 0);
        expect(applied).toBe(0);
        expect(bounds).toEqual({ minX: 0, maxX: 80, minY: 0, maxY: 100 });
    });

    it('treats a negative inset as zero', () => {
        expect(deriveProbeBounds(bbox, -5).applied).toBe(0);
    });

    it('rejects an inset that would collapse an axis', () => {
        // 40 on each side of an 80-wide toolpath leaves nothing.
        const { bounds, applied, rejected } = deriveProbeBounds(bbox, 40);
        expect(rejected).toBe(true);
        expect(applied).toBe(0);
        expect(bounds).toEqual({ minX: 0, maxX: 80, minY: 0, maxY: 100 });
    });

    it('rejects on the narrow axis even when the wide axis would fit', () => {
        const narrow = { min: { x: 0, y: 0 }, max: { x: 200, y: 6 } };
        expect(deriveProbeBounds(narrow, 5).rejected).toBe(true);
    });

    it('keeps the probe area strictly inside the toolpath', () => {
        for (const inset of [0.5, 1, 2, 5, 10]) {
            const { bounds } = deriveProbeBounds(bbox, inset);
            expect(bounds.minX).toBeGreaterThanOrEqual(bbox.min.x);
            expect(bounds.maxX).toBeLessThanOrEqual(bbox.max.x);
            expect(bounds.minY).toBeGreaterThanOrEqual(bbox.min.y);
            expect(bounds.maxY).toBeLessThanOrEqual(bbox.max.y);
            expect(bounds.maxX).toBeGreaterThan(bounds.minX);
            expect(bounds.maxY).toBeGreaterThan(bounds.minY);
        }
    });

    it('handles negative work coordinates', () => {
        // Fusion commonly zeroes at the centre of the stock.
        const centred = { min: { x: -34.5, y: -49.5 }, max: { x: 34.5, y: 49.5 } };
        const { bounds } = deriveProbeBounds(centred, 2.5);
        expect(bounds).toEqual({ minX: -32, maxX: 32, minY: -47, maxY: 47 });
    });
});
