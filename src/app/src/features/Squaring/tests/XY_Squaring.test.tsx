/* This unit test tests the funcitons for 
1.Checking if a machine is geometrically square
2.Computing expected measurements
3.Adjusting  machine calibration (EEPROM step values) for accuracy */

import { jest } from '@jest/globals';
import {
    calculateAngle,
    calculateHypotenuse,
    determineEEPROMAdjustment,
} from 'app/features/Squaring/utils';

jest.mock('app/store/redux', () => {
    const getState = jest.fn(() => ({
        controller: {
            settings: {
                settings: {
                    $100: '100',
                    $101: '100',
                },
            },
        },
    }));
    return {
        __esModule: true,
        default: { getState },
    };
});

jest.mock('app/store', () => ({
    __esModule: true,
    default: {
        get: jest.fn((_key: string, defaultVal: string) => defaultVal),
    },
}));

const reduxStore = require('app/store/redux').default;

const mockGetState = reduxStore.getState as jest.Mock;

// ─────────────────────────────────────────────
// Calculate the hypotenuse using the Pythagorean theorem
// formula: Math.sqrt(a² + b²)
// ─────────────────────────────────────────────
describe('calculateHypotenuse', () => {
    it('calculates hypotenuse for a 3-4-5 triangle', () => { // happy path
        const result = calculateHypotenuse({ a: 3, b: 4, c: 0 });
        expect(result).toBeCloseTo(5, 5);
    });

    it('calculates hypotenuse for equal sides', () => { // edge case
        const result = calculateHypotenuse({ a: 1, b: 1, c: 0 });
        expect(result).toBeCloseTo(Math.sqrt(2), 5);
    });

    it('calculates hypotenuse for larger values', () => { // edge case
        const result = calculateHypotenuse({ a: 300, b: 300, c: 0 });
        expect(result).toBeCloseTo(Math.sqrt(300 * 300 + 300 * 300), 2);
    });

    it('calculates hypotenuse for negative values', () => { // failure path
        const result = calculateHypotenuse({ a: -3, b: -2, c: -6 });
        expect(result).toBeCloseTo(Math.sqrt((-3) * (-3) + (-2) * (-2)), 2);
    });

    it('calculates hypotenuse for decimal values', () => { // failure path
        const result = calculateHypotenuse({ a: 3.2, b: 5.5, c: 6.6 });
        expect(result).toBeCloseTo(Math.sqrt(3.2 * 3.2 + 5.5 * 5.5), 2);
    });
    it.skip('returns NaN when null values are passed', () => { // failure path
    const result = calculateHypotenuse({ a: null as any, b: null as any, c: null as any });
    expect(isNaN(result)).toBe(true);
});

    it('returns 0 when both sides are 0', () => { // failure path
        const result = calculateHypotenuse({ a: 0, b: 0, c: 0 });
        expect(result).toBe(0);
    });

    it('ignores the c value in calculation', () => { // regression safety net
        const result1 = calculateHypotenuse({ a: 3, b: 4, c: 0 });
        const result2 = calculateHypotenuse({ a: 3, b: 4, c: 999 });
        expect(result1).toBe(result2);
    });
});

// ───────────────────────────────────────────
// Calculate angle - how far the machine deviates from a perfect 90° angle
// formula: Law of Cosines - cosC = (a² + b² - c²) / (2ab)
// ─────────────────────────────────────────────
describe('calculateAngle', () => {
    it('returns 0 for a perfect right triangle (3-4-5)', () => { // happy path
        const result = calculateAngle({ a: 3, b: 4, c: 5 });
        expect(result).toBeCloseTo(0, 1);
    });

    it('returns positive angle when diagonal is shorter than expected', () => { // happy path
        const result = calculateAngle({ a: 300, b: 300, c: 400 });
        expect(result).toBeGreaterThan(0);
    });
    it('returns NaN when null values are passed', () => { // failure path
    const result = calculateAngle({ a: null as any, b: null as any, c: null as any });
    expect(isNaN(result)).toBe(true);
});

    it('returns negative angle when diagonal is longer than expected', () => { // happy path
        const result = calculateAngle({ a: 300, b: 300, c: 450 });
        expect(result).toBeLessThan(0);
    });

    it('returns near 0 for a nearly perfect square', () => { // edge case
        const a = 300;
        const b = 300;
        const c = Math.sqrt(a * a + b * b);
        const result = calculateAngle({ a, b, c });
        expect(Math.abs(result)).toBeCloseTo(0, 5);
    });

    it('returns near 0 for very small decimal values', () => { // edge case
        const a = 0.3;
        const b = 0.4;
        const c = Math.sqrt(a * a + b * b);
        const result = calculateAngle({ a, b, c });
        expect(Math.abs(result)).toBeCloseTo(0, 5);
    });

    it('returns near 0 for decimal values', () => { // edge case
        const a = 5.5;
        const b = 6.6;
        const c = Math.sqrt(a * a + b * b);
        const result = calculateAngle({ a, b, c });
        expect(Math.abs(result)).toBeCloseTo(0, 5);
    });

    it('returns a number for any valid triangle', () => { // edge case
        const result = calculateAngle({ a: 100, b: 150, c: 180 });
        expect(typeof result).toBe('number');
        expect(isNaN(result)).toBe(false);
    });

    it.skip('returns NaN for invalid triangle with negative sides', () => { // failure path
        const result = calculateAngle({ a: -300, b: -400, c: 500 });
        expect(isNaN(result)).toBe(true);
    });
});

// ─────────────────────────────────────────────
// determineEEPROMAdjustment
// formula: currentStep * (movedDistance / actualDistance)
// figures out whether $100/$101 step/mm settings need correction
// ─────────────────────────────────────────────
describe('determineEEPROMAdjustment', () => {
    beforeEach(() => {
        mockGetState.mockReturnValue({
            controller: {
                settings: {
                    settings: {
                        $100: '100',
                        $101: '100',
                    },
                },
            },
        });
    });

    it('returns no adjustment needed when jog values are 0', () => { // edge case
        const result = determineEEPROMAdjustment(
            { a: 300, b: 300, c: 424 },
            { x: 0, y: 0, z: 0 },
        );
        expect(result.x.needsAdjustment).toBe(false);
        expect(result.y.needsAdjustment).toBe(false);
    });

    it('returns no adjustment needed when triangle values are 0', () => { // edge case
        const result = determineEEPROMAdjustment(
            { a: 0, b: 0, c: 0 },
            { x: 300, y: 300, z: 0 },
        );
        expect(result.x.needsAdjustment).toBe(false);
        expect(result.y.needsAdjustment).toBe(false);
    });

    it('returns current step values when null triangle and jog values are passed', () => { // failure path
    const result = determineEEPROMAdjustment(
        { a: null as any, b: null as any, c: null as any },
        { x: null as any, y: null as any, z: null as any },
    );
    expect(result.x.needsAdjustment).toBe(false);
    expect(result.y.needsAdjustment).toBe(false);
});

    it('returns current step value when no valid data', () => { // edge case
        const result = determineEEPROMAdjustment(
            { a: 0, b: 0, c: 0 },
            { x: 0, y: 0, z: 0 },
        );
        expect(result.x.amount).toBe(100);
        expect(result.y.amount).toBe(100);
    });

    it('returns needsAdjustment true when moved distance differs from actual', () => { // happy path
        const result = determineEEPROMAdjustment(
            { a: 290, b: 300, c: 424 },
            { x: 300, y: 300, z: 0 },
        );
        expect(result.x.needsAdjustment).toBe(true);
    });

    it('returns needsAdjustment false when moved equals actual distance', () => { // happy path
        const result = determineEEPROMAdjustment(
            { a: 300, b: 300, c: 424 },
            { x: 300, y: 300, z: 0 },
        );
        expect(result.x.needsAdjustment).toBe(false);
        expect(result.y.needsAdjustment).toBe(false);
    });

    it('calculates correct adjusted step value', () => { // happy path
        // currentStep=100, moved=300, actual=290
        // expected = 100 * (300/290) ≈ 103.448
        const result = determineEEPROMAdjustment(
            { a: 290, b: 300, c: 424 },
            { x: 300, y: 300, z: 0 },
        );
        expect(result.x.amount).toBeCloseTo(100 * (300 / 290), 3);
    });

    it('handles different x and y step values from EEPROM', () => { // regression path
        mockGetState.mockReturnValue({
            controller: {
                settings: {
                    settings: {
                        $100: '80',
                        $101: '160',
                    },
                },
            },
        });

        const result = determineEEPROMAdjustment(
            { a: 290, b: 290, c: 424 },
            { x: 300, y: 300, z: 0 },
        );
        expect(result.x.amount).toBeCloseTo(80 * (300 / 290), 3);
        expect(result.y.amount).toBeCloseTo(160 * (300 / 290), 3);
    });

    it('only adjusts x when only x data is valid', () => { // edge case
        const result = determineEEPROMAdjustment(
            { a: 290, b: 0, c: 424 },
            { x: 300, y: 0, z: 0 },
        );
        expect(result.x.needsAdjustment).toBe(true);
        expect(result.y.needsAdjustment).toBe(false);
    });

    it('only adjusts y when only y data is valid', () => { // edge case
        const result = determineEEPROMAdjustment(
            { a: 0, b: 290, c: 424 },
            { x: 0, y: 300, z: 0 },
        );
        expect(result.x.needsAdjustment).toBe(false);
        expect(result.y.needsAdjustment).toBe(true);
    });
});

// ─────────────────────────────────────────────
// Integration: calculateAngle + calculateHypotenuse
// ─────────────────────────────────────────────
describe('calculateAngle + calculateHypotenuse integration', () => {
    it('machine is square when measured diagonal equals calculated hypotenuse', () => { // happy path
        const a = 300;
        const b = 300;
        const c = Math.sqrt(a * a + b * b);
        const angle = calculateAngle({ a, b, c });
        const hypotenuse = calculateHypotenuse({ a, b, c });
        const diff = Math.abs(hypotenuse - c);
        expect(Math.abs(angle)).toBeLessThan(0.1);
        expect(diff).toBeCloseTo(0, 5);
    });

    it('machine is not square when diagonal is off', () => { // failure path
        const a = 300;
        const b = 300;
        const c = 450; // longer than perfect hypotenuse (~424)
        const angle = calculateAngle({ a, b, c });
        expect(Math.abs(angle)).toBeGreaterThan(0.1);
    });
});
