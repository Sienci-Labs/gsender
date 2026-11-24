import { getFirstToolChange } from '../ATCFunctions';

describe('getFirstToolChange', () => {
    it('returns no tool change when there is no M6', () => {
        expect(getFirstToolChange({ 1: { T: 2 } }, ['T2'])).toEqual({
            hasToolChange: false,
            tool: null,
        });
    });

    it('handles empty/undefined events', () => {
        expect(getFirstToolChange({}, [])).toEqual({
            hasToolChange: false,
            tool: null,
        });
        expect(getFirstToolChange(undefined as any, [])).toEqual({
            hasToolChange: false,
            tool: null,
        });
    });

    it('reads T and M6 on the same line', () => {
        expect(
            getFirstToolChange({ 5: { T: 3, M: 6 }, 90: { T: 1, M: 6 } }, [
                'T3',
                'T1',
            ]),
        ).toEqual({ hasToolChange: true, tool: 3 });
    });

    it('reads T from an earlier line than M6', () => {
        expect(
            getFirstToolChange({ 4: { T: 2 }, 5: { M: 6 } }, ['T2']),
        ).toEqual({ hasToolChange: true, tool: 2 });
    });

    it('sorts keys numerically', () => {
        expect(
            getFirstToolChange({ 100: { T: 9, M: 6 }, 20: { T: 4, M: 6 } }, []),
        ).toEqual({ hasToolChange: true, tool: 4 });
    });

    it('falls back to toolSet[0] when no T precedes M6', () => {
        expect(getFirstToolChange({ 3: { M: 6 } }, ['T7', 'T8'])).toEqual({
            hasToolChange: true,
            tool: 7,
        });
    });
});
