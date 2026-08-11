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
        //
        // `G0 X10 Y10` genuinely cannot be compensated: it commands no Z, and
        // the offset it would need depends on an XY that is only being
        // established by this very line.
        expect(lines).toContain('G0 X10.0000 Y10.0000');
        expect(lines.some((l) => /^G0 X10\.0000 Y10\.0000$/.test(l))).toBe(true);
    });

    it('compensates the line that completes the axis set', () => {
        // `Z5` is the third axis, so by the time it is applied the position is
        // fully determined and the offset at (10,10) is knowable. It is
        // compensated for the same reason every other clearance retract is --
        // see gcodeTransformer.integration.test.ts, which reconstructs a nominal
        // of exactly 5 from the trusted retracts.
        //
        // This matters because the completing line is often the plunge itself.
        const { transformedGcode } = run(src);
        const lines = transformedGcode.split('\n').map((l) => l.trim());
        expect(lines).toContain(`G0 Z${(5 + FLAT_OFFSET).toFixed(4)}`);
        expect(lines).not.toContain('G0 Z5.0000');
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

describe('H2: tool length offset and displaced non-motion words', () => {
    /*
     * Two separate faults met on the same line of code.
     *
     * The `trailing` expression strips every G-word so that the motion words it
     * replaces do not survive alongside its own output. It was written for
     * G0/G1/G2/G3 and the modals, but it matched G43 too -- leaving a bare `H3`
     * on its own line, which grblHAL rejects mid-job.
     *
     * And the untrusted branch, taken after every barrier, never computed
     * `trailing` at all, so M/S/T/H words on a motion line were deleted with no
     * warning.
     */

    describe('G43 is refused rather than half-applied', () => {
        it('refuses a program that activates a tool length offset', () => {
            const result = transformGcode(
                ['G90', 'G43 Z15 H3', 'G1 X10 Y10 Z-0.1 F100'].join('\n'),
                flatMap,
                noSubdivide,
            );
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors[0]).toMatch(/G43/);
            expect(result.transformedGcode).toBe('');
        });

        it('refuses the dynamic form too', () => {
            const result = transformGcode(
                ['G90', 'G43.1 Z15', 'G1 X10 Y10 Z-0.1 F100'].join('\n'),
                flatMap,
                noSubdivide,
            );
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors[0]).toMatch(/G43/);
        });

        it('never emits an orphaned H word', () => {
            // The specific mangling: G43 stripped, H3 left standing alone.
            const result = transformGcode(
                ['G90', 'G43 Z15 H3', 'G1 X10 Y10 Z-0.1 F100'].join('\n'),
                flatMap,
                noSubdivide,
            );
            expect(result.transformedGcode).not.toMatch(/^H\d/m);
        });

        it('still accepts G49, which only cancels an offset', () => {
            // Standard in Fusion preambles (G17 G90 G49 G40). Refusing it would
            // reject nearly every real program for no gain: with no G43 ever
            // active, Z means the same thing throughout.
            const result = transformGcode(
                ['G17 G90 G49 G40', 'G1 X10 Y10 Z-0.1 F100'].join('\n'),
                flatMap,
                noSubdivide,
            );
            expect(result.errors).toEqual([]);
        });
    });

    describe('non-motion words survive on a motion line', () => {
        const afterBarrier = (motionLine: string) =>
            transformGcode(
                ['G90', 'G28 G91 Z0', 'G90', motionLine, 'G1 X0 Y10 Z-0.1'].join('\n'),
                flatMap,
                noSubdivide,
            );

        it('keeps a coolant word while the position is untrusted', () => {
            // Reviewer's reproduction: G0 X10 Y10 M8 -> G0 X10.0000 Y10.0000,
            // coolant silently dropped and warnings empty.
            const result = afterBarrier('G0 X10 Y10 Z5 M8');
            expect(result.transformedGcode).toMatch(/\bM8\b/);
        });

        it('keeps spindle and tool words while the position is untrusted', () => {
            const result = afterBarrier('G0 X10 Y10 Z5 S12000 T2');
            expect(result.transformedGcode).toMatch(/\bS12000\b/);
            expect(result.transformedGcode).toMatch(/\bT2\b/);
        });

        it('warns about them, as it does for a trusted line', () => {
            const result = afterBarrier('G0 X10 Y10 Z5 M8');
            expect(result.warnings.join(' ')).toMatch(/combined motion with other commands/);
        });

        it('keeps a G-word it does not itself re-emit, on a motion line', () => {
            // G64 P0.01 (path blending with tolerance) rides on a motion block in
            // real posts. It is neither motion nor a modal this transformer
            // asserts, so stripping it changes how the machine moves -- and
            // stripping only the G leaves a bare `P0.01`, which is the same
            // mangling as the orphaned H.
            const result = run(['G90', 'G1 X10 Y10 Z-0.1 F100 G64 P0.01'].join('\n'));
            expect(result.transformedGcode).toMatch(/\bG64\b/);
            expect(result.transformedGcode).not.toMatch(/^P0\.01$/m);
        });

        it('does not leave its own motion words behind as trailing text', () => {
            const result = run(['G90', 'G1 X10 Y10 Z-0.1 F100 M8'].join('\n'));
            const lines = result.transformedGcode.split('\n').map((l) => l.trim());
            // M8 survives on its own line, without a duplicated G1.
            expect(lines).toContain('M8');
        });
    });
});

describe('H3: the line that re-establishes position must itself be compensated', () => {
    /*
     * After a barrier the tool position is unknown, so moves are re-emitted
     * uncompensated until the program has commanded all three axes again. Trust
     * was granted at the END of the line that completed the set -- so that line,
     * the first plunge of the new tool, went out uncompensated.
     *
     * By the time that line has been applied, motion.to is fully determined for
     * all three axes: the axes it commands are absolute, and the ones it omits
     * were commanded earlier in the same re-establishment. So it can be
     * compensated, and must be: it is usually the plunge to depth.
     *
     * 1001.nc escapes this only because Fusion emits the safe-Z retract first,
     * which is a property of that post and not of this code.
     */

    const toolChange = (lines: string[]) =>
        transformGcode(
            ['G90', 'G28 G91 Z0', 'G90', 'T2 M6', ...lines].join('\n'),
            flatMap,
            noSubdivide,
        );

    it('compensates the plunge that completes the axis set', () => {
        // X and Y arrive first, Z last -- the ordering a post produces when it
        // positions before retracting.
        const result = toolChange(['G0 X20 Y10', 'G1 Z-0.15 F100', 'G1 X0 Y10']);
        const zs = result.transformedGcode
            .split('\n')
            .filter((l) => /^G1\b/.test(l.trim()) && /Z/.test(l))
            .map((l) => parseFloat(l.match(/Z(-?\d*\.?\d+)/i)![1]));

        expect(zs.length).toBeGreaterThan(0);
        // Flat map of +1.0, so a commanded -0.15 must come out at +0.85.
        expect(zs[0]).toBeCloseTo(-0.15 + FLAT_OFFSET, 3);
    });

    it('still compensates when Z arrives before XY', () => {
        // The safe ordering Fusion actually emits. Already correct, kept so the
        // fix cannot regress it.
        const result = toolChange(['G0 Z15', 'G0 X20 Y10', 'G1 Z-0.15 F100']);
        const zs = result.transformedGcode
            .split('\n')
            .filter((l) => /^G1\b/.test(l.trim()) && /Z/.test(l))
            .map((l) => parseFloat(l.match(/Z(-?\d*\.?\d+)/i)![1]));

        expect(zs[zs.length - 1]).toBeCloseTo(-0.15 + FLAT_OFFSET, 3);
    });

    it('leaves the genuinely unknowable moves uncompensated', () => {
        // The moves BEFORE the set is complete still cannot be compensated --
        // the offset depends on XY, and XY is not known yet.
        const result = toolChange(['G0 X20 Y10', 'G1 Z-0.15 F100']);
        const first = result.transformedGcode
            .split('\n')
            .map((l) => l.trim())
            .find((l) => /^G0\b/.test(l) && /X20/.test(l));
        expect(first).toBeDefined();
        expect(first).not.toMatch(/Z/);
    });

    it('reports how many moves went out uncompensated', () => {
        const result = toolChange(['G0 X20 Y10', 'G1 Z-0.15 F100', 'G1 X0 Y10']);
        expect(result.warnings.join(' ')).toMatch(/uncompensated/i);
    });

    it('says nothing when a barrier is immediately followed by a full move', () => {
        // Nothing was left uncompensated, so there is nothing to report.
        const result = transformGcode(
            ['G90', 'G28 G91 Z0', 'G90', 'G0 X20 Y10 Z15', 'G1 Z-0.15 F100'].join('\n'),
            flatMap,
            noSubdivide,
        );
        expect(result.warnings.join(' ')).not.toMatch(/uncompensated/i);
    });

    it('compensates a single line that commands all three axes at once', () => {
        const result = transformGcode(
            ['G90', 'G28 G91 Z0', 'G90', 'G1 X20 Y10 Z-0.15 F100'].join('\n'),
            flatMap,
            noSubdivide,
        );
        const z = result.transformedGcode
            .split('\n')
            .map((l) => l.trim())
            .filter((l) => /^G1\b/.test(l) && /Z/.test(l))
            .map((l) => parseFloat(l.match(/Z(-?\d*\.?\d+)/i)![1]));
        expect(z[0]).toBeCloseTo(-0.15 + FLAT_OFFSET, 3);
    });
});

describe('H4: the out-of-bounds warning must describe what actually happens', () => {
    /*
     * edgeInset defaults to 2mm so probe points stay off the edge of the stock,
     * which means the toolpath is outside the probed area on every normal job
     * and this warning fires every time. A warning that fires every time and
     * says nothing specific is a warning that gets tuned out -- so it has to
     * quantify: how far out, and how much offset was actually applied there.
     */
    const smallMap: HeightMapData = {
        bounds: { minX: 0, maxX: 20, minY: 0, maxY: 20 },
        resolution: { x: 20, y: 20 },
        points: [
            { x: 0, y: 0, z: 0 },
            { x: 20, y: 0, z: 0.4 },
            { x: 0, y: 20, z: 0 },
            { x: 20, y: 20, z: 0.4 },
        ],
    };

    const outside = () =>
        transformGcode(
            ['G90', 'G1 X-10 Y10 Z-0.1 F100', 'G1 X40 Y10'].join('\n'),
            smallMap,
            { segmentLength: 1000, warnOutsideBounds: true },
        );

    it('still warns', () => {
        expect(outside().warnings.join(' ')).toMatch(/outside the probed area/i);
    });

    it('says how far outside the toolpath went', () => {
        const warning = outside().warnings.join(' ');
        // The program runs to X40 on a map ending at X20: 20mm out.
        expect(warning).toMatch(/20(\.0)?\s*mm/);
    });

    it('says how much offset was actually applied out there', () => {
        const warning = outside().warnings.join(' ');
        expect(warning).toMatch(/0\.4/);
    });

    it('does not claim to extrapolate', () => {
        // It holds the edge value; saying "extrapolated" describes the old
        // unbounded behaviour and would be a lie about the new one.
        expect(outside().warnings.join(' ')).not.toMatch(/extrapolat/i);
    });

    it('says nothing when the toolpath stays inside', () => {
        const result = transformGcode(
            ['G90', 'G1 X5 Y5 Z-0.1 F100', 'G1 X15 Y15'].join('\n'),
            smallMap,
            { segmentLength: 1000, warnOutsideBounds: true },
        );
        expect(result.warnings.join(' ')).not.toMatch(/outside the probed area/i);
    });
});
