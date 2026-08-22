/*
 * End-to-end integration test for the Height Map transformer.
 *
 * Runs a deliberately hostile program -- one that exercises every G-code
 * construct the transformer has to survive -- against a warped surface, then
 * checks three whole-program invariants:
 *
 *   1. No raw arc survives. An uncompensated G2/G3 would cut at the programmed
 *      depth while everything around it is offset.
 *   2. The emitted path is continuous. A positional discontinuity means the
 *      transformer lost track of the tool, and the machine would execute a
 *      full-depth cutting move back through finished material.
 *   3. Subtracting the height map from every emitted Z recovers a depth the
 *      source program actually commanded. This is the strongest available
 *      statement that compensation was applied exactly once, everywhere, and
 *      invented nothing.
 */

import { transformGcode } from '../utils/gcodeTransformer';
import { bilinearInterpolate } from '../utils/interpolation';
import { HeightMapData, HeightMapPoint } from '../definitions';

/** Saddle-shaped surface, +-0.3mm over an 80x80 area -- a taped-down blank. */
const warpedMap = (): HeightMapData => {
    const points: HeightMapPoint[] = [];
    for (let iy = 0; iy < 5; iy++) {
        for (let ix = 0; ix < 5; ix++) {
            const x = ix * 20;
            const y = iy * 20;
            points.push({
                x,
                y,
                z:
                    Math.round(
                        (0.3 * Math.sin((Math.PI * x) / 80) -
                            0.2 * Math.cos((Math.PI * y) / 80)) *
                            1e4,
                    ) / 1e4,
            });
        }
    }
    return {
        bounds: { minX: 0, maxX: 80, minY: 0, maxY: 80 },
        resolution: { x: 20, y: 20 },
        points,
        units: 'mm',
    };
};

const TORTURE = [
    '(height map torture test)',
    'G21 G90',
    'G28 G91 Z0',
    'G90',
    'G0 Z5',
    'M3 S12000',
    'G0 X10 Y10',
    'G1 Z-0.1 F120',
    '(--- modal motion: bare continuation lines ---)',
    'X70',
    'Y70',
    'X10',
    'Y10',
    '(--- line-numbered blocks ---)',
    'N100 G1 X20 Y20',
    'N110 X60',
    '(--- arcs: IJK form, both directions ---)',
    'G2 X60 Y60 I0 J20',
    'G3 X20 Y60 I-20 J0',
    '(--- arc: R form ---)',
    'G1 X20 Y20',
    'G2 X60 Y20 R20',
    '(--- helical arc: Z ramps through the arc ---)',
    'G1 X20 Y40 Z-0.1',
    'G2 X60 Y40 Z-0.2 I20 J0',
    '(--- incremental block ---)',
    'G91',
    'X5',
    'Y5',
    'G90',
    '(--- full circle ---)',
    'G1 X40 Y40',
    'G2 X40 Y40 I10 J0',
    'G0 Z5',
    'G28 G91 Z0',
    'M5',
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

describe('torture program against a warped surface', () => {
    const map = warpedMap();
    const segmentLength = 1;
    const result = transformGcode(TORTURE, map, {
        segmentLength,
        warnOutsideBounds: true,
        arcTolerance: 0.01,
    });
    const pts = parseMotion(result.transformedGcode);

    it('is accepted', () => {
        expect(result.errors).toEqual([]);
        expect(pts.length).toBeGreaterThan(100);
    });

    it('leaves no raw arc in the output', () => {
        expect(result.transformedGcode).not.toMatch(/^\s*G[23]\b/m);
    });

    it('emits a continuous path', () => {
        const jumps: string[] = [];
        for (let i = 1; i < pts.length; i++) {
            const d = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
            if (d > segmentLength * 1.5) {
                jumps.push(
                    `(${pts[i - 1].x},${pts[i - 1].y}) -> (${pts[i].x},${pts[i].y}) = ${d.toFixed(2)}mm`,
                );
            }
        }
        expect(jumps).toEqual([]);
    });

    it('recovers only depths the program commanded', () => {
        // The program cuts at -0.1, ramps -0.1 -> -0.2 through a helical arc,
        // and retracts to +5.
        const ok = (n: number): boolean =>
            Math.abs(n - 5) < 0.0005 || (n <= -0.0995 && n >= -0.2005);

        const bad = pts
            .map((p) => ({ p, nominal: p.z - bilinearInterpolate(p.x, p.y, map)! }))
            .filter(({ nominal }) => !ok(nominal))
            .map(({ p, nominal }) => `(${p.x},${p.y}) z=${p.z} -> nominal ${nominal.toFixed(4)}`);

        expect(bad).toEqual([]);
    });

    it('actually varies the compensation', () => {
        const cutZ = pts.filter((p) => !p.rapid).map((p) => p.z);
        expect(Math.max(...cutZ) - Math.min(...cutZ)).toBeGreaterThan(0.3);
    });

    it('preserves spindle and program-control commands', () => {
        for (const cmd of ['M3 S12000', 'M5', 'M30']) {
            expect(result.transformedGcode).toMatch(
                new RegExp(`^${cmd.replace(/\s/g, '\\s')}$`, 'm'),
            );
        }
    });

    it('preserves the G28 barriers with their distance modal intact', () => {
        const lines = result.transformedGcode.split('\n').map((l) => l.trim());
        const barriers = lines.filter((l) => l === 'G28 G91 Z0');
        expect(barriers).toHaveLength(2);
        for (const idx of lines.reduce<number[]>(
            (acc, l, i) => (l === 'G28 G91 Z0' ? [...acc, i] : acc),
            [],
        )) {
            expect(lines[idx + 1]).toBe('G21 G90');
        }
    });
});
