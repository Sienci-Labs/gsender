import { migrateValues } from '../valueMigrations';

const withProjection = (projection?: string) => ({
    widgets: { visualizer: { projection } },
    workspace: { probeProfile: { touchplateType: 'Standard Block' } },
});

const withTouchplate = (touchplateType?: string) => ({
    workspace: { probeProfile: { touchplateType } },
});

describe('migrateValues', () => {
    it.each([
        ['perspective', 'Perspective'],
        ['orthographic', 'Orthographic'],
        ['Perspective', 'Perspective'],
        ['Orthographic', 'Orthographic'],
        [undefined, undefined],
    ])('projection %s -> %s', (saved, expected) => {
        const result = migrateValues(withProjection(saved));

        expect(result.widgets.visualizer.projection).toBe(expected);
    });

    it.each([
        ['AutoZero Touchplate', 'AutoZero'],
        ['Standard Block', 'Standard Block'],
        ['AutoZero', 'AutoZero'],
        ['BitZero', 'BitZero'],
        ['Not A Real Type', 'Standard Block'],
        [undefined, 'Standard Block'],
    ])('touchplate type %s -> %s', (saved, expected) => {
        const result = migrateValues(withTouchplate(saved));

        expect(result.workspace.probeProfile.touchplateType).toBe(expected);
    });

    it('is idempotent', () => {
        const once = migrateValues({
            ...withProjection('orthographic'),
            ...withTouchplate('AutoZero Touchplate'),
        });
        const twice = migrateValues(JSON.parse(JSON.stringify(once)));

        expect(twice).toEqual(once);
    });

    it('does not throw on an empty state', () => {
        expect(() => migrateValues({})).not.toThrow();
    });
});
