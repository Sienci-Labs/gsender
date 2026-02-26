import { calculateNewStepsPerMM } from '../src/app/src/features/MovementTuning/Steps';

test('calculateNewStepsPerMM returns correct value', () => {
  const result = calculateNewStepsPerMM({
    originalStepsPerMM: 100,
    givenDistanceMoved: 100,
    actualDistanceMoved: 102,
  });
  expect(result).toBeCloseTo(98.04, 2);
});

test('calculateNewStepsPerMM handles zero actual distance', () => {
  const result = calculateNewStepsPerMM({
    originalStepsPerMM: 100,
    givenDistanceMoved: 100,
    actualDistanceMoved: 0,
  });
  expect(result).toBe(0);
});
