/*
 * Regression tests for the Height Map G-code transformer.
 *
 * Experimental design: the height map is FLAT at exactly +1.0 over the whole
 * probed area. The correct compensated Z for any move is therefore
 * `originalZ + 1.0`, independent of position. Any emitted move whose Z is not
 * offset by +1.0 was silently passed through uncompensated.
 *
 * That isolates "was compensation applied at all" from "is the interpolation
 * numerically right", which is what we want when probing parser coverage.
 *
 * Defects A/B/C reproduced the failure modes of the original regex-based
 * parser; they are retained as regression guards now that parsing is delegated
 * to GCodeVirtualizer.
 */

import { transformGcode } from '../utils/gcodeTransformer';
import { HeightMapData } from '../definitions';

const FLAT_OFFSET = 1.0;

const flatMap: HeightMapData = {
    bounds: { minX: 0, maxX: 100, minY: 0, maxY: 100 },
    resolution: { x: 2, y: 2 },
    points: [
        { x: 0, y: 0, z: FLAT_OFFSET },
        { x: 100, y: 0, z: FLAT_OFFSET },
        { x: 0, y: 100, z: FLAT_OFFSET },
        { x: 100, y: 100, z: FLAT_OFFSET },
    ],
};

/** Sloped map: Z rises linearly 0 -> 2 across X, constant in Y. */
const slopedMap: HeightMapData = {
    bounds: { minX: 0, maxX: 100, minY: 0, maxY: 100 },
    resolution: { x: 2, y: 2 },
    points: [
        { x: 0, y: 0, z: 0 },
        { x: 100, y: 0, z: 2 },
        { x: 0, y: 100, z: 0 },
        { x: 100, y: 100, z: 2 },
    ],
};

const noSubdivide = { segmentLength: 1000, warnOutsideBounds: false };

interface Pt {
    x: number;
    y: number;
    z: number;
}

/** Emitted motion commands, parsed. */
const motionPoints = (gcode: string): Pt[] =>
    gcode
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => /^G[01]\b/.test(l))
        .map((l) => ({
            x: parseFloat(l.match(/X(-?\d*\.?\d+)/i)?.[1] ?? 'NaN'),
            y: parseFloat(l.match(/Y(-?\d*\.?\d+)/i)?.[1] ?? 'NaN'),
            z: parseFloat(l.match(/Z(-?\d*\.?\d+)/i)?.[1] ?? 'NaN'),
        }));

const run = (src: string, map = flatMap, opts = noSubdivide) =>
    transformGcode(src, map, opts);

describe('CONTROL: harness is valid', () => {
    it('compensates a canonical non-modal G1 move', () => {
        const pts = motionPoints(run(['G90', 'G1 X10 Y10 Z-0.1 F100'].join('\n')).transformedGcode);
        const move = pts.find((p) => p.x === 10);
        expect(move).toBeDefined();
        expect(move!.z).toBeCloseTo(-0.1 + FLAT_OFFSET, 4);
    });

    it('samples the map rather than applying a constant', () => {
        // On the sloped map, Z offset at X=25 is 0.5 and at X=75 is 1.5.
        const pts = motionPoints(
            run(['G90', 'G1 Z0 F100', 'G1 X25 Y50', 'G1 X75 Y50'].join('\n'), slopedMap)
                .transformedGcode,
        );
        expect(pts.find((p) => p.x === 25)!.z).toBeCloseTo(0.5, 3);
        expect(pts.find((p) => p.x === 75)!.z).toBeCloseTo(1.5, 3);
    });
});

describe('DEFECT A: modal motion (bare X/Y continuation lines)', () => {
    // The motion word is sticky in G-code. Most CAM posts rely on this.
    const src = ['G90', 'G1 Z-0.1 F100', 'X10 Y10', 'X20 Y20'].join('\n');

    it('compensates bare modal moves', () => {
        const pts = motionPoints(run(src).transformedGcode);
        const modal = pts.filter((p) => p.x === 10 || p.x === 20);
        expect(modal).toHaveLength(2);
        for (const p of modal) {
            expect(p.z).toBeCloseTo(-0.1 + FLAT_OFFSET, 4);
        }
    });
});

describe('DEFECT B: position tracking must survive every command', () => {
    const src = [
        'G90',
        'G1 X10 Y10 Z-0.1 F100',
        'G2 X30 Y30 I10 J0',
        'G1 X40 Y40',
    ].join('\n');

    it('compensates the move following an arc', () => {
        const pts = motionPoints(run(src).transformedGcode);
        const after = pts.find((p) => p.x === 40);
        expect(after).toBeDefined();
        expect(after!.z).toBeCloseTo(-0.1 + FLAT_OFFSET, 4);
    });

    it('emits a continuous path with no positional discontinuity', () => {
        // The decisive invariant. If the transformer loses track of the tool
        // across any command, the next emitted absolute move teleports -- which
        // on the machine is a full-depth cutting move through finished
        // material. Every consecutive pair must stay within the segment length.
        const segmentLength = 5;
        const { transformedGcode } = transformGcode(src, flatMap, {
            segmentLength,
            warnOutsideBounds: false,
            arcTolerance: 0.05,
        });
        const pts = motionPoints(transformedGcode);
        expect(pts.length).toBeGreaterThan(3);

        const jumps: { from: Pt; to: Pt; dist: number }[] = [];
        for (let i = 1; i < pts.length; i++) {
            const dist = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
            if (dist > segmentLength * 1.5) {
                jumps.push({ from: pts[i - 1], to: pts[i], dist });
            }
        }
        expect(jumps).toEqual([]);
    });
});

describe('DEFECT C: line-numbered blocks', () => {
    it('compensates a move prefixed with an N word', () => {
        const pts = motionPoints(
            run(['G90', 'N10 G1 X10 Y10 Z-0.1 F100'].join('\n')).transformedGcode,
        );
        const move = pts.find((p) => p.x === 10);
        expect(move).toBeDefined();
        expect(move!.z).toBeCloseTo(-0.1 + FLAT_OFFSET, 4);
    });
});

describe('arc compensation', () => {
    it('flattens arcs into compensated segments', () => {
        const src = ['G90', 'G1 X10 Y0 Z-0.1 F100', 'G2 X0 Y10 I-10 J0'].join('\n');
        const { transformedGcode } = transformGcode(src, flatMap, {
            segmentLength: 100,
            warnOutsideBounds: false,
            arcTolerance: 0.01,
        });
        const pts = motionPoints(transformedGcode);

        // No raw arc words may survive -- an uncompensated G2 would cut at the
        // programmed depth while everything around it is offset.
        expect(transformedGcode).not.toMatch(/^\s*G[23]\b/m);

        // Every emitted point carries the offset.
        for (const p of pts) {
            expect(p.z).toBeCloseTo(-0.1 + FLAT_OFFSET, 4);
        }

        // Intermediate points must lie on the arc (radius 10 about the origin).
        const arcPts = pts.filter((p) => !(p.x === 10 && p.y === 0));
        expect(arcPts.length).toBeGreaterThan(3);
        for (const p of arcPts) {
            expect(Math.hypot(p.x, p.y)).toBeCloseTo(10, 1);
        }
    });

    it('lands exactly on the programmed arc endpoint', () => {
        const src = ['G90', 'G1 X10 Y0 Z0 F100', 'G3 X0 Y10 I-10 J0'].join('\n');
        const pts = motionPoints(
            transformGcode(src, flatMap, {
                segmentLength: 100,
                warnOutsideBounds: false,
                arcTolerance: 0.01,
            }).transformedGcode,
        );
        const last = pts[pts.length - 1];
        expect(last.x).toBeCloseTo(0, 4);
        expect(last.y).toBeCloseTo(10, 4);
    });

    it('honours the arc tolerance (tighter tolerance => more segments)', () => {
        const src = ['G90', 'G1 X10 Y0 Z0 F100', 'G2 X-10 Y0 I-10 J0'].join('\n');
        const coarse = motionPoints(
            transformGcode(src, flatMap, {
                segmentLength: 1000,
                warnOutsideBounds: false,
                arcTolerance: 0.5,
            }).transformedGcode,
        ).length;
        const fine = motionPoints(
            transformGcode(src, flatMap, {
                segmentLength: 1000,
                warnOutsideBounds: false,
                arcTolerance: 0.001,
            }).transformedGcode,
        ).length;
        expect(fine).toBeGreaterThan(coarse);
    });
});

describe('incremental (G91) programs', () => {
    it('resolves incremental moves to compensated absolute moves', () => {
        const src = ['G90', 'G1 X10 Y10 Z-0.1 F100', 'G91', 'X10', 'X10'].join('\n');
        const pts = motionPoints(run(src).transformedGcode);
        // Absolute destinations are 10 -> 20 -> 30.
        expect(pts.map((p) => p.x)).toEqual(expect.arrayContaining([10, 20, 30]));
        for (const p of pts) {
            expect(p.z).toBeCloseTo(-0.1 + FLAT_OFFSET, 4);
        }
    });

    it('does not leak G91 into the output', () => {
        const src = ['G90', 'G1 X10 Y10 Z-0.1 F100', 'G91', 'X10'].join('\n');
        const { transformedGcode } = run(src);
        expect(transformedGcode).not.toMatch(/\bG91(?![\d.])/);
    });
});

describe('position barriers (G28/G30/G53)', () => {
    // Every Fusion post brackets the program with `G28 G91 Z0`, so these must
    // be handled rather than refused.
    const src = [
        'G90',
        'G28 G91 Z0',
        'G90',
        'G0 X10 Y10',
        'Z5',
        'G1 Z-0.1 F100',
        'X20 Y20',
    ].join('\n');

    it('accepts a program bracketed by G28', () => {
        const result = run(src);
        expect(result.errors).toEqual([]);
    });

    it('passes the barrier through with its own distance modal intact', () => {
        // `G28 Z0` in absolute mode would plunge to work zero before homing.
        const { transformedGcode } = run(src);
        expect(transformedGcode).toMatch(/^G28 G91 Z0$/m);
        // ...and immediately restores our absolute/metric context.
        const lines = transformedGcode.split('\n').map((l) => l.trim());
        const idx = lines.findIndex((l) => l === 'G28 G91 Z0');
        expect(lines[idx + 1]).toBe('G21 G90');
    });

    it('does not compensate moves while the position is unknown', () => {
        const { transformedGcode } = run(src);
        const lines = transformedGcode.split('\n').map((l) => l.trim());
        // The re-establishing moves carry only the axes they commanded, and no
        // Z offset is invented for axes the source line never mentioned.
        expect(lines).toContain('G0 X10.0000 Y10.0000');
        expect(lines).toContain('G0 Z5.0000');
    });

    it('resumes compensating once every axis is re-established', () => {
        const pts = motionPoints(run(src).transformedGcode);
        const after = pts.find((p) => p.x === 20 && p.y === 20);
        expect(after).toBeDefined();
        expect(after!.z).toBeCloseTo(-0.1 + FLAT_OFFSET, 4);
    });

    it('refuses an incremental move made while the position is unknown', () => {
        const bad = ['G90', 'G28 G91 Z0', 'G91', 'X5 Y5', 'G90'].join('\n');
        const result = run(bad);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.transformedGcode).toBe('');
    });
});

describe('refusals: commands that cannot be re-emitted safely', () => {
    const cases: [string, string][] = [
        ['G92', ['G90', 'G92 X0 Y0', 'G1 X10 Y10 Z-0.1'].join('\n')],
        ['canned cycle', ['G90', 'G81 X10 Y10 Z-5 R2 F100'].join('\n')],
        ['G90.1', ['G90', 'G90.1', 'G2 X10 Y10 I5 J5'].join('\n')],
    ];

    it.each(cases)('refuses %s rather than mis-transforming', (_label, src) => {
        const result = transformGcode(src, flatMap, noSubdivide);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.transformedGcode).toBe('');
    });

    it('accepts an ordinary program', () => {
        const result = run(['G90', 'G21', 'G1 X10 Y10 Z-0.1 F100', 'M5'].join('\n'));
        expect(result.errors).toEqual([]);
        expect(result.transformedGcode.length).toBeGreaterThan(0);
    });
});

describe('passthrough fidelity', () => {
    it('preserves non-motion commands', () => {
        const { transformedGcode } = run(
            ['G90', 'M3 S12000', 'G1 X10 Y10 Z-0.1 F100', 'M5', 'M30'].join('\n'),
        );
        expect(transformedGcode).toMatch(/^M3 S12000$/m);
        expect(transformedGcode).toMatch(/^M5$/m);
        expect(transformedGcode).toMatch(/^M30$/m);
    });

    it('preserves comments', () => {
        const { transformedGcode } = run(
            ['G90', '; setup block', 'G1 X10 Y10 Z-0.1 F100'].join('\n'),
        );
        expect(transformedGcode).toMatch(/; setup block/);
    });

    it('forces absolute metric output', () => {
        const { transformedGcode } = run(['G20', 'G90', 'G1 X1 Y1 Z0 F10'].join('\n'));
        expect(transformedGcode).toMatch(/^G21$/m);
        expect(transformedGcode).toMatch(/^G90$/m);
        // The inch modal must not survive alongside millimetre output.
        expect(transformedGcode).not.toMatch(/\bG20(?![\d.])/);
    });
});
