import {
    computeSoftLimitViolations,
    getAxisMachineEnvelope,
} from '../softLimitCheck';

const box = (min: [number, number, number], max: [number, number, number]) => ({
    min: { x: min[0], y: min[1], z: min[2] },
    max: { x: max[0], y: max[1], z: max[2] },
});

const base = {
    maxTravel: { x: 800, y: 800, z: 100 },
    homingDirMask: 0,
    forceSetOrigin: false,
};

describe('getAxisMachineEnvelope', () => {
    it('is [-max, 0] without forced origin regardless of direction', () => {
        expect(getAxisMachineEnvelope(800, false, false)).toEqual({
            min: -800,
            max: 0,
        });
        expect(getAxisMachineEnvelope(800, true, false)).toEqual({
            min: -800,
            max: 0,
        });
    });

    it('is [0, max] with forced origin and negative homing', () => {
        expect(getAxisMachineEnvelope(800, true, true)).toEqual({
            min: 0,
            max: 800,
        });
    });

    it('ignores the sign of max travel', () => {
        expect(getAxisMachineEnvelope(-800, false, false)).toEqual({
            min: -800,
            max: 0,
        });
    });
});

describe('computeSoftLimitViolations', () => {
    it('returns nothing when the file fits', () => {
        // Zero in the middle of an 800x800 bed, Z zero 50mm below home.
        const result = computeSoftLimitViolations({
            ...base,
            bbox: box([0, 0, -20], [100, 100, 5]),
            wco: { x: -400, y: -400, z: -50 },
        });
        expect(result).toEqual([]);
    });

    it('flags X+ and Y+ when zeroed at the back-right home corner', () => {
        // Zero at machine home (0,0): everything positive is outside.
        const result = computeSoftLimitViolations({
            ...base,
            bbox: box([0, 0, -5], [100, 50, 0]),
            wco: { x: 0, y: 0, z: -50 },
        });
        expect(result).toEqual([
            { axis: 'X', direction: '+', overBy: 100 },
            { axis: 'Y', direction: '+', overBy: 50 },
        ]);
    });

    it('flags X- with forced origin and negative-homing X', () => {
        const result = computeSoftLimitViolations({
            ...base,
            homingDirMask: 1,
            forceSetOrigin: true,
            bbox: box([-10, -100, -5], [50, 0, 0]),
            wco: { x: 0, y: -400, z: -50 },
        });
        expect(result).toEqual([{ axis: 'X', direction: '-', overBy: 10 }]);
    });

    it('flags Z- when zero is set too close to the bottom of travel', () => {
        const result = computeSoftLimitViolations({
            ...base,
            bbox: box([0, 0, -30], [10, 10, 5]),
            wco: { x: -400, y: -400, z: -80 },
        });
        expect(result).toEqual([{ axis: 'Z', direction: '-', overBy: 10 }]);
    });

    it('flags Z+ when the file retracts above home', () => {
        const result = computeSoftLimitViolations({
            ...base,
            bbox: box([0, 0, -5], [10, 10, 15]),
            wco: { x: -400, y: -400, z: -10 },
        });
        expect(result).toEqual([{ axis: 'Z', direction: '+', overBy: 5 }]);
    });

    it('ignores overruns within tolerance', () => {
        const result = computeSoftLimitViolations({
            ...base,
            bbox: box([0, 0, -5], [400.005, 10, 0]),
            wco: { x: -400, y: -400, z: -50 },
        });
        expect(result).toEqual([]);
    });

    it('skips axes with no travel configured', () => {
        const result = computeSoftLimitViolations({
            ...base,
            maxTravel: { x: 0, y: 800, z: 100 },
            bbox: box([0, 0, -5], [5000, 10, 0]),
            wco: { x: 0, y: -400, z: -50 },
        });
        expect(result).toEqual([]);
    });
});
