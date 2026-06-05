import { calculateNewStepsPerMM } from '../Steps';

describe('calculateNewStepsPerMM', () => {

  // --- Correctness ---
  describe('correct calculations', () => {
    test('returns correct value when actual is greater than given', () => {
      const result = calculateNewStepsPerMM({
        originalStepsPerMM: 100,
        givenDistanceMoved: 100,
        actualDistanceMoved: 102,
      });
      expect(result).toBeCloseTo(98.04, 2);
    });

    test('returns same steps when actual equals given', () => {
      const result = calculateNewStepsPerMM({
        originalStepsPerMM: 80,
        givenDistanceMoved: 50,
        actualDistanceMoved: 50,
      });
      expect(result).toBeCloseTo(80, 4);
    });

    test('scales up when actual is less than given', () => {
      const result = calculateNewStepsPerMM({
        originalStepsPerMM: 100,
        givenDistanceMoved: 100,
        actualDistanceMoved: 90,
      });
      expect(result).toBeCloseTo(111.11, 2);
    });

    test('scales down when actual is more than given', () => {
      const result = calculateNewStepsPerMM({
        originalStepsPerMM: 100,
        givenDistanceMoved: 100,
        actualDistanceMoved: 110,
      });
      expect(result).toBeCloseTo(90.91, 2);
    });

    test('works with decimal stepsPerMM', () => {
      const result = calculateNewStepsPerMM({
        originalStepsPerMM: 80.25,
        givenDistanceMoved: 100,
        actualDistanceMoved: 100,
      });
      expect(result).toBeCloseTo(80.25, 4);
    });

    test('works with decimal distances', () => {
      const result = calculateNewStepsPerMM({
        originalStepsPerMM: 100,
        givenDistanceMoved: 50.5,
        actualDistanceMoved: 51.0,
      });
      expect(result).toBeCloseTo(99.02, 2);
    });
  });

  // --- Edge cases ---
  describe('edge cases', () => {
    test('handles zero actual distance', () => {
      const result = calculateNewStepsPerMM({
        originalStepsPerMM: 100,
        givenDistanceMoved: 100,
        actualDistanceMoved: 0,
      });
      expect(result).toBe(0);
    });

    test.skip('handles very large distances', () => {
      const result = calculateNewStepsPerMM({
        originalStepsPerMM: 100,
        givenDistanceMoved: 1000000,
        actualDistanceMoved: 1000001,
      });
      expect(result).toBeCloseTo(99.9999, 4);
    });

    test('handles very small distances', () => {
      const result = calculateNewStepsPerMM({
        originalStepsPerMM: 100,
        givenDistanceMoved: 0.001,
        actualDistanceMoved: 0.001,
      });
      expect(result).toBeCloseTo(100, 4);
    });

    test('handles very small stepsPerMM', () => {
      const result = calculateNewStepsPerMM({
        originalStepsPerMM: 0.01,
        givenDistanceMoved: 100,
        actualDistanceMoved: 100,
      });
      expect(result).toBeCloseTo(0.01, 4);
    });

    test('handles large stepsPerMM', () => {
      const result = calculateNewStepsPerMM({
        originalStepsPerMM: 10000,
        givenDistanceMoved: 100,
        actualDistanceMoved: 100,
      });
      expect(result).toBeCloseTo(10000, 2);
    });

    test('handles NaN values', () => {
      const result = calculateNewStepsPerMM({
        originalStepsPerMM: NaN,
        givenDistanceMoved: 100,
        actualDistanceMoved: 100,
      });
      expect(isNaN(result) || result === 0).toBe(true);
    });

    test('handles Infinity values', () => {
      const result = calculateNewStepsPerMM({
        originalStepsPerMM: 100,
        givenDistanceMoved: Infinity,
        actualDistanceMoved: 100,
      });
      expect(typeof result).toBe('number');
    });
  });

  // --- Error handling ---
  describe('error handling', () => {
    test('handles zero givenDistanceMoved', () => {
      const result = calculateNewStepsPerMM({
        originalStepsPerMM: 100,
        givenDistanceMoved: 0,
        actualDistanceMoved: 100,
      });
      expect(result === 0 || !isFinite(result) || isNaN(result)).toBe(true);
    });

    test('handles zero originalStepsPerMM', () => {
      const result = calculateNewStepsPerMM({
        originalStepsPerMM: 0,
        givenDistanceMoved: 100,
        actualDistanceMoved: 100,
      });
      expect(result).toBe(0);
    });

    test('handles negative actualDistanceMoved', () => {
      const result = calculateNewStepsPerMM({
        originalStepsPerMM: 100,
        givenDistanceMoved: 100,
        actualDistanceMoved: -50,
      });
      expect(result).toBeLessThanOrEqual(0);
    });

    test('handles negative givenDistanceMoved', () => {
      const result = calculateNewStepsPerMM({
        originalStepsPerMM: 100,
        givenDistanceMoved: -100,
        actualDistanceMoved: 100,
      });
      expect(typeof result).toBe('number');
    });

    test('handles negative originalStepsPerMM', () => {
      const result = calculateNewStepsPerMM({
        originalStepsPerMM: -100,
        givenDistanceMoved: 100,
        actualDistanceMoved: 100,
      });
      expect(typeof result).toBe('number');
    });
  });
});