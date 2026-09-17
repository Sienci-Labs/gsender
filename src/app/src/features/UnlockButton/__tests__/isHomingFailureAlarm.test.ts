import { isHomingFailureAlarm } from '../index';

describe('isHomingFailureAlarm', () => {
    test('returns true for homing failure alarm codes 6-9', () => {
        expect(isHomingFailureAlarm(6)).toBe(true);
        expect(isHomingFailureAlarm(7)).toBe(true);
        expect(isHomingFailureAlarm(8)).toBe(true);
        expect(isHomingFailureAlarm(9)).toBe(true);
    });

    test('returns false for other alarm codes', () => {
        expect(isHomingFailureAlarm(1)).toBe(false);
        expect(isHomingFailureAlarm(10)).toBe(false);
        expect(isHomingFailureAlarm(17)).toBe(false);
    });

    test('returns false for non-numeric alarm codes', () => {
        expect(isHomingFailureAlarm('Homing')).toBe(false);
    });
});
