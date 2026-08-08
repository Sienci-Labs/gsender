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

import {
    createHeightMapFromProbeResults,
    probeConfigToMillimetres,
} from '../utils/probeRoutine';
import { calculateProbeGrid } from '../utils/interpolation';
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

describe('workspace units', () => {
    /*
     * The acceptance criterion for the imperial fault: the machine must do the
     * same physical thing whichever units the workspace happens to be showing.
     *
     * The widget stores its configuration in display units, so an imperial
     * workspace holds 0.19685 where a metric one holds 5. Everything downstream
     * is millimetres -- the probe command goes out under G21, and [PRB:]/WCO:
     * report millimetres whenever $13 is 0 -- so the whole chain is run here in
     * both modes and the emitted depths compared.
     */

    const PHYSICAL = {
        zClearance: 5,
        maxProbeDepth: 10,
        probeFeedRate: 100,
        segmentLength: 1,
        gridSpacing: 20,
        maxXY: 60,
    };

    const stateFor = (isMetric: boolean): HeightMapConfig => {
        const s = isMetric ? 1 : 1 / 25.4;
        return {
            ...DEFAULT_HEIGHT_MAP_CONFIG,
            minX: 0,
            maxX: PHYSICAL.maxXY * s,
            minY: 0,
            maxY: PHYSICAL.maxXY * s,
            gridSpacing: PHYSICAL.gridSpacing * s,
            usePointCount: false,
            zClearance: PHYSICAL.zClearance * s,
            maxProbeDepth: PHYSICAL.maxProbeDepth * s,
            probeFeedRate: PHYSICAL.probeFeedRate * s,
            segmentLength: PHYSICAL.segmentLength * s,
        };
    };

    /** Probe the same physical surface and compensate the same program. */
    const runChain = (isMetric: boolean) => {
        const mm = probeConfigToMillimetres(stateFor(isMetric), isMetric);
        const points = calculateProbeGrid(
            mm.minX,
            mm.maxX,
            mm.minY,
            mm.maxY,
            mm.gridSpacing,
            false,
            0,
            0,
        );
        const h = surfaceAt(-0.4);
        const map = createHeightMapFromProbeResults(
            points,
            points.map((p) => h(p.x, p.y) + TYPICAL_WCO_Z),
            mm,
            'mm',
            TYPICAL_WCO_Z,
        );
        const result = transformGcode(programAtDepth(CUT_DEPTH), map, {
            segmentLength: mm.segmentLength,
            warnOutsideBounds: true,
        });
        return { map, result, cuts: parseMotion(result.transformedGcode).filter((p) => !p.rapid) };
    };

    const metric = runChain(true);
    const imperial = runChain(false);

    it('probes the same grid in both modes', () => {
        expect(imperial.map.points).toHaveLength(metric.map.points.length);
        imperial.map.points.forEach((p, i) => {
            expect(p.x).toBeCloseTo(metric.map.points[i].x, 6);
            expect(p.y).toBeCloseTo(metric.map.points[i].y, 6);
            expect(p.z).toBeCloseTo(metric.map.points[i].z, 6);
        });
    });

    it('stamps the map in millimetres regardless of the workspace', () => {
        // The Z values come from [PRB:] in millimetres. Stamping the map 'in'
        // makes normalizeMapToMm multiply them by 25.4 on the way into the
        // transformer, turning a 0.05mm deviation into 1.27mm of commanded Z.
        expect(metric.map.units).toBe('mm');
        expect(imperial.map.units).toBe('mm');
    });

    it('drives the same physical path in both modes', () => {
        // Compared as geometry, not as samples. The imperial segment length
        // round-trips to 0.9999999999999999 rather than 1, so the transformer
        // lays down one extra subdivision on a long move -- floating-point dust
        // in the fixture, and in real use an operator typing 0.039in genuinely
        // asks for 0.9906mm and a different subdivision. Neither changes where
        // the tool goes, which is the thing that must not differ.
        const envelope = (cuts: typeof metric.cuts) => ({
            minX: Math.min(...cuts.map((p) => p.x)),
            maxX: Math.max(...cuts.map((p) => p.x)),
            minY: Math.min(...cuts.map((p) => p.y)),
            maxY: Math.max(...cuts.map((p) => p.y)),
            minZ: Math.min(...cuts.map((p) => p.z)),
            maxZ: Math.max(...cuts.map((p) => p.z)),
        });

        const a = envelope(metric.cuts);
        const b = envelope(imperial.cuts);
        (Object.keys(a) as (keyof typeof a)[]).forEach((k) => {
            expect(b[k]).toBeCloseTo(a[k], 3);
        });

        // And the endpoints coincide, so it is the same path and not merely the
        // same bounding box.
        expect(imperial.cuts[0].x).toBeCloseTo(metric.cuts[0].x, 3);
        expect(imperial.cuts[0].z).toBeCloseTo(metric.cuts[0].z, 3);
        const lastI = imperial.cuts[imperial.cuts.length - 1];
        const lastM = metric.cuts[metric.cuts.length - 1];
        expect(lastI.x).toBeCloseTo(lastM.x, 3);
        expect(lastI.z).toBeCloseTo(lastM.z, 3);
    });

    it('cuts the commanded depth below the local surface in both modes', () => {
        const h = surfaceAt(-0.4);
        for (const [label, run] of [
            ['metric', metric],
            ['imperial', imperial],
        ] as const) {
            expect(run.cuts.length).toBeGreaterThan(10);
            const wrong = run.cuts
                .map((p) => ({ p, depth: h(p.x, p.y) - p.z }))
                .filter(({ depth }) => Math.abs(depth - CUT_DEPTH) > TOLERANCE)
                .map(({ p, depth }) => `${label} (${p.x},${p.y}) cuts ${depth.toFixed(4)}`);
            expect(wrong.slice(0, 5)).toEqual([]);
        }
    });
});

describe('a height map that declares itself imperial', () => {
    /*
     * The probe cycle now always stamps 'mm', so nothing this feature produces
     * exercises the transformer's inch handling any more. It is still reachable:
     * a .gshmap saved by an older build, or written by hand, can arrive stamped
     * 'in', and loadMap feeds it straight to the transformer.
     *
     * Left uncovered, disabling normalizeMapToMm entirely changes nothing that
     * any test can see -- which is exactly the state this suite was in.
     */
    const INCH = 1 / 25.4;

    /** The same physical surface, described in inches. */
    const inchMap = (): HeightMapData => {
        const h = surfaceAt(-0.4);
        const points = probeGrid().map((p) => ({
            x: p.x * INCH,
            y: p.y * INCH,
            z: h(p.x, p.y) * INCH,
        }));
        return {
            bounds: {
                minX: 0,
                maxX: 60 * INCH,
                minY: 0,
                maxY: 60 * INCH,
            },
            resolution: { x: 20 * INCH, y: 20 * INCH },
            points,
            units: 'in',
        };
    };

    it('is scaled to millimetres before compensation is applied', () => {
        const h = surfaceAt(-0.4);
        const result = transformGcode(programAtDepth(CUT_DEPTH), inchMap(), {
            // Also in inches, as the map's own units imply.
            segmentLength: 5 * INCH,
            warnOutsideBounds: true,
        });
        const cuts = parseMotion(result.transformedGcode).filter((p) => !p.rapid);

        expect(result.errors).toEqual([]);
        expect(cuts.length).toBeGreaterThan(10);

        const wrong = cuts
            .map((p) => ({ p, depth: h(p.x, p.y) - p.z }))
            .filter(({ depth }) => Math.abs(depth - CUT_DEPTH) > TOLERANCE)
            .map(({ p, depth }) => `(${p.x},${p.y}) cuts ${depth.toFixed(4)}`);
        expect(wrong.slice(0, 5)).toEqual([]);
    });

    it('produces the same cut as the identical map stamped in millimetres', () => {
        const opts = { warnOutsideBounds: true };
        const asInches = parseMotion(
            transformGcode(programAtDepth(CUT_DEPTH), inchMap(), {
                ...opts,
                segmentLength: 5 * INCH,
            }).transformedGcode,
        ).filter((p) => !p.rapid);

        const asMm = parseMotion(
            transformGcode(programAtDepth(CUT_DEPTH), mapStoredByProbeCycle(-0.4, 0), {
                ...opts,
                segmentLength: 5,
            }).transformedGcode,
        ).filter((p) => !p.rapid);

        // Compared as geometry: 5in-worth of segment length round-trips to
        // 4.999... so the two runs are sampled a few points apart, which does
        // not change where the tool goes.
        const zRange = (pts: typeof asMm) => [
            Math.min(...pts.map((p) => p.z)),
            Math.max(...pts.map((p) => p.z)),
        ];

        expect(zRange(asInches)[0]).toBeCloseTo(zRange(asMm)[0], 3);
        expect(zRange(asInches)[1]).toBeCloseTo(zRange(asMm)[1], 3);
        expect(asInches[0].z).toBeCloseTo(asMm[0].z, 3);
        expect(asInches[asInches.length - 1].z).toBeCloseTo(asMm[asMm.length - 1].z, 3);
    });
});
