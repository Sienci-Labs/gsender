/*
 * What the height map is allowed to say about ground it never measured.
 *
 * The probe grid covers the area it covers. Outside it there is no data, and
 * the question is what to do about the toolpath that goes there -- which is not
 * an edge case: edgeInset defaults to 2mm precisely so probe points stay off
 * the edge of the stock, so on a normal job the toolpath is outside the map by
 * design, all the way round.
 *
 * The original answer was to let the bilinear weights run past [0,1], which
 * projects the last cell's gradient outward without limit. On a 0.02mm/mm tilt
 * that reaches 1.40mm at 50mm outside and 4.40mm at 200mm -- offsets far larger
 * than anything the map itself measured, applied to Z, with a warning that
 * described something else entirely.
 */

import { bilinearInterpolate, getZOffset } from '../utils/interpolation';
import { HeightMapData } from '../definitions';

/** Tilted plane: Z rises 0.02mm per mm of X, flat in Y. Range 0 -> 2 over 100mm. */
const tilted: HeightMapData = {
    bounds: { minX: 0, maxX: 100, minY: 0, maxY: 100 },
    resolution: { x: 100, y: 100 },
    points: [
        { x: 0, y: 0, z: 0 },
        { x: 100, y: 0, z: 2 },
        { x: 0, y: 100, z: 0 },
        { x: 100, y: 100, z: 2 },
    ],
};

const zRange = (map: HeightMapData) => {
    const zs = map.points.map((p) => p.z);
    return { min: Math.min(...zs), max: Math.max(...zs) };
};

describe('inside the probed area', () => {
    it('interpolates exactly at the corners', () => {
        expect(bilinearInterpolate(0, 0, tilted)).toBeCloseTo(0, 9);
        expect(bilinearInterpolate(100, 0, tilted)).toBeCloseTo(2, 9);
    });

    it('interpolates linearly between them', () => {
        expect(bilinearInterpolate(50, 50, tilted)).toBeCloseTo(1, 9);
        expect(bilinearInterpolate(25, 0, tilted)).toBeCloseTo(0.5, 9);
    });
});

describe('outside the probed area', () => {
    // The distances a real job actually reaches: edgeInset default is 2mm, and
    // a toolpath can legitimately run well past a small probed patch.
    it.each([
        ['just outside, the default inset', 2],
        ['a short way out', 5],
        ['well out', 50],
        ['absurdly far out', 200],
    ])('holds the nearest edge value %s (%pmm)', (_label, distance) => {
        // Past the high-X edge the answer must stay the edge value, not keep
        // climbing with the gradient.
        expect(bilinearInterpolate(100 + distance, 50, tilted)).toBeCloseTo(2, 6);
        // ...and the same on the low side.
        expect(bilinearInterpolate(-distance, 50, tilted)).toBeCloseTo(0, 6);
    });

    it('never returns an offset outside the map own measured range', () => {
        const { min, max } = zRange(tilted);
        for (const x of [-500, -50, -2, 0, 50, 100, 102, 150, 600]) {
            for (const y of [-500, -2, 50, 102, 600]) {
                const z = bilinearInterpolate(x, y, tilted)!;
                expect(z).toBeGreaterThanOrEqual(min - 1e-9);
                expect(z).toBeLessThanOrEqual(max + 1e-9);
            }
        }
    });

    it('is continuous across the boundary', () => {
        // No step at the edge: approaching from inside and leaving from outside
        // must agree, or the toolpath gets a discontinuity exactly where the
        // inset puts most of its cutting.
        const inside = bilinearInterpolate(99.999, 50, tilted)!;
        const edge = bilinearInterpolate(100, 50, tilted)!;
        const outside = bilinearInterpolate(100.001, 50, tilted)!;
        expect(edge - inside).toBeLessThan(1e-3);
        expect(outside - edge).toBeLessThan(1e-6);
    });

    it('holds the corner value diagonally outside', () => {
        expect(bilinearInterpolate(200, 200, tilted)).toBeCloseTo(2, 6);
        expect(bilinearInterpolate(-200, -200, tilted)).toBeCloseTo(0, 6);
    });

    it('applies the same rule through getZOffset', () => {
        expect(getZOffset(500, 50, tilted)).toBeCloseTo(2, 6);
    });
});
