/*
 * The datum the height map is referenced to.
 *
 * This is the single arithmetic decision the whole feature rests on, so it is
 * asserted end to end -- probe results in, cut depth out -- rather than by
 * inspecting intermediate values.
 *
 * The algebra:
 *
 *   Work Z=0 is the datum the operator set, and the surface at (x,y) sits at
 *   h(x,y) in work coordinates. A CAM program written for a flat surface
 *   commands Z=-d to cut depth d.
 *
 *   To cut depth d below the LOCAL surface the tool must sit at h(x,y) - d.
 *   The transformer emits Z = commandedZ + offset(x,y) = -d + offset(x,y).
 *   Therefore offset(x,y) must equal h(x,y).
 *
 *   Re-datuming the map to its own lowest point gives offset = h - hmin, so the
 *   tool sits at h - hmin - d and the real depth becomes d + hmin: a constant
 *   error at every point, in every job, invisible on screen.
 *
 * A user on the upstream PR hit exactly this and worked around it by re-probing
 * at the lowest point and zeroing Z there, which forces hmin = 0.
 *
 * The catch that makes offset(x,y) != "the number the probe reported": grbl and
 * grblHAL both report [PRB:...] in MACHINE coordinates -- report.c says so in
 * as many words ("Report in terms of machine position") -- and gSender forwards
 * the line untouched. So a probe sample is h(x,y) + WCO_z, and the map is only
 * referenced to work zero once WCO is subtracted back off.
 *
 * These tests therefore feed probe samples in machine coordinates, the way the
 * serial handler really receives them.
 */

import { createHeightMapFromProbeResults } from '../utils/probeRoutine';
import { transformGcode } from '../utils/gcodeTransformer';
import { bilinearInterpolate } from '../utils/interpolation';
import {
    HeightMapConfig,
    HeightMapData,
    DEFAULT_HEIGHT_MAP_CONFIG,
} from '../definitions';

const GRID = [0, 20, 40, 60];

const config: HeightMapConfig = {
    ...DEFAULT_HEIGHT_MAP_CONFIG,
    minX: 0,
    maxX: 60,
    minY: 0,
    maxY: 60,
    gridSpacing: 20,
    usePointCount: false,
};

/**
 * Synthetic surface. Bilinear in x and y -- including the xy twist -- so
 * bilinear interpolation reproduces it exactly between grid points and the
 * assertions can be made against the true surface rather than against the
 * transformer's own view of it.
 *
 * `base` is the height at the origin, which is also the surface minimum for
 * non-negative coefficients, so it sets hmin directly.
 */
const surfaceAt = (base: number) => (x: number, y: number): number =>
    base + 0.012 * x + 0.008 * y + 0.0001 * x * y;

const probeGrid = (): { x: number; y: number }[] => {
    const points: { x: number; y: number }[] = [];
    for (const y of GRID) {
        for (const x of GRID) {
            points.push({ x, y });
        }
    }
    return points;
};

/**
 * A Z-max-homed router with work zero set on stock partway down the column:
 * machine Z is strongly negative everywhere the tool actually cuts. This is the
 * ordinary case, not a corner case, which is what makes an unconverted probe
 * sample so dangerous.
 */
const TYPICAL_WCO_Z = -85;

/**
 * The map the probe cycle hands to the transformer -- built the same way
 * completeProbing builds it, so this asserts the shipped pipeline rather than a
 * hand-written map that could quietly disagree with it.
 *
 * Probe samples are synthesised in machine coordinates (mpos = wpos + WCO) to
 * match what the PRB report actually carries.
 */
const mapStoredByProbeCycle = (base: number, wcoZ: number): HeightMapData => {
    const points = probeGrid();
    const h = surfaceAt(base);
    const probeSamples = points.map((p) => h(p.x, p.y) + wcoZ);
    return createHeightMapFromProbeResults(
        points,
        probeSamples,
        config,
        'mm',
        wcoZ,
    );
};

/** A pocket pass at a single known depth, entirely inside the probed area. */
const programAtDepth = (d: number): string =>
    [
        '(flat-surface CAM output)',
        'G21 G90',
        'G0 Z5',
        'G0 X5 Y5',
        `G1 Z-${d} F100`,
        'X55',
        'Y55',
        'X5',
        'Y5',
        'G0 Z5',
        'M30',
    ].join('\n');

interface Pt {
    rapid: boolean;
    x: number;
    y: number;
    z: number;
}

const parseMotion = (gcode: string): Pt[] =>
    gcode
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => /^G[01]\b/.test(l) && /X/.test(l) && /Y/.test(l) && /Z/.test(l))
        .map((l) => ({
            rapid: l.startsWith('G0'),
            x: parseFloat(l.match(/X(-?\d*\.?\d+)/i)![1]),
            y: parseFloat(l.match(/Y(-?\d*\.?\d+)/i)![1]),
            z: parseFloat(l.match(/Z(-?\d*\.?\d+)/i)![1]),
        }));

const CUT_DEPTH = 0.15;
const TOLERANCE = 1e-3;

describe.each([
    ['straddling zero', -0.4],
    ['entirely below zero', -3],
    ['entirely above zero', 0.5],
])('probed surface %s (hmin = %p)', (_label, base) => {
    const map = mapStoredByProbeCycle(base, TYPICAL_WCO_Z);
    const h = surfaceAt(base);
    const result = transformGcode(programAtDepth(CUT_DEPTH), map, {
        segmentLength: 5,
        warnOutsideBounds: true,
    });
    const cuts = parseMotion(result.transformedGcode).filter((p) => !p.rapid);

    it('is transformed without error', () => {
        expect(result.errors).toEqual([]);
        expect(cuts.length).toBeGreaterThan(10);
    });

    it('is reproduced exactly by interpolation, so a depth failure is real', () => {
        // Guards the test itself. Built from the probed grid with no datum
        // shift, so this isolates interpolation fidelity from the datum
        // question -- if the synthetic surface were not bilinear-exact, the
        // depth assertion below would be measuring interpolation error instead.
        const points = probeGrid();
        const raw = createHeightMapFromProbeResults(
            points,
            points.map((p) => h(p.x, p.y)),
            config,
            'mm',
            0,
        );
        const mismatch = cuts
            .map((p) => Math.abs(bilinearInterpolate(p.x, p.y, raw)! - h(p.x, p.y)))
            .filter((e) => e > TOLERANCE);
        expect(mismatch).toEqual([]);
    });

    it('cuts the commanded depth below the local surface at every point', () => {
        // The acceptance criterion for the whole feature.
        const wrong = cuts
            .map((p) => ({ p, depth: h(p.x, p.y) - p.z }))
            .filter(({ depth }) => Math.abs(depth - CUT_DEPTH) > TOLERANCE)
            .map(
                ({ p, depth }) =>
                    `(${p.x},${p.y}) z=${p.z} cuts ${depth.toFixed(4)} deep, wanted ${CUT_DEPTH}`,
            );

        expect(wrong.slice(0, 5)).toEqual([]);
    });

    it('never lifts the tool clear of the surface on a cutting move', () => {
        // A negative depth means the "cut" is happening in mid-air.
        const airborne = cuts.filter((p) => h(p.x, p.y) - p.z <= 0);
        expect(airborne).toEqual([]);
    });
});

describe('work coordinate offset', () => {
    // The surface is the same in work coordinates every time; only where the
    // machine thinks it is changes. Cut depth must not notice.
    const base = -0.4;
    const h = surfaceAt(base);

    it.each([
        ['Z-max homed router, work zero on stock', -85],
        ['work zero coincident with machine zero', 0],
        ['work zero below machine zero', 12.5],
        ['fractional offset', -37.219],
    ])('is cancelled out: %s (WCO_z = %p)', (_label, wcoZ) => {
        const map = mapStoredByProbeCycle(base, wcoZ);
        const result = transformGcode(programAtDepth(CUT_DEPTH), map, {
            segmentLength: 5,
            warnOutsideBounds: true,
        });
        const cuts = parseMotion(result.transformedGcode).filter((p) => !p.rapid);

        expect(cuts.length).toBeGreaterThan(10);
        const wrong = cuts
            .map((p) => ({ p, depth: h(p.x, p.y) - p.z }))
            .filter(({ depth }) => Math.abs(depth - CUT_DEPTH) > TOLERANCE)
            .map(
                ({ p, depth }) =>
                    `(${p.x},${p.y}) z=${p.z} cuts ${depth.toFixed(4)} deep, wanted ${CUT_DEPTH}`,
            );
        expect(wrong.slice(0, 5)).toEqual([]);
    });

    it('produces identical maps for the same surface at any machine height', () => {
        // WCO is a property of where the operator zeroed, not of the workpiece.
        const atDepth = mapStoredByProbeCycle(base, -85).points.map((p) => p.z);
        const atZero = mapStoredByProbeCycle(base, 0).points.map((p) => p.z);
        for (let i = 0; i < atZero.length; i++) {
            expect(atDepth[i]).toBeCloseTo(atZero[i], 6);
        }
    });
});

describe('compensation offsets', () => {
    it('are the probed heights in work coordinates, so a flat surface at Z=0 is a no-op', () => {
        const points = probeGrid();
        const map = createHeightMapFromProbeResults(
            points,
            points.map(() => 0),
            config,
            'mm',
            0,
        );
        const result = transformGcode(programAtDepth(CUT_DEPTH), map, {
            segmentLength: 5,
            warnOutsideBounds: true,
        });
        const cuts = parseMotion(result.transformedGcode).filter((p) => !p.rapid);

        expect(cuts.length).toBeGreaterThan(10);
        for (const p of cuts) {
            expect(p.z).toBeCloseTo(-CUT_DEPTH, 3);
        }
    });

    it('shift the whole program when the surface is offset from Z=0', () => {
        // A surface uniformly 0.2 above work zero must move every cut up by 0.2,
        // not be flattened away as "no variation".
        const points = probeGrid();
        const map = createHeightMapFromProbeResults(
            points,
            points.map(() => 0.2),
            config,
            'mm',
            0,
        );
        const result = transformGcode(programAtDepth(CUT_DEPTH), map, {
            segmentLength: 5,
            warnOutsideBounds: true,
        });
        const cuts = parseMotion(result.transformedGcode).filter((p) => !p.rapid);

        expect(cuts.length).toBeGreaterThan(10);
        for (const p of cuts) {
            expect(p.z).toBeCloseTo(0.2 - CUT_DEPTH, 3);
        }
    });
});
