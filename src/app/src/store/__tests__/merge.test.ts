import defaultState from '../defaultState';
import { merge } from '../index';

describe('store merge() — dynamic empty-object keys', () => {
    it('keeps defaultState.plugins as an empty object (required for merge() to preserve saved plugin data)', () => {
        expect(defaultState.plugins).toEqual({});
    });

    it('preserves saved plugin storage that has no counterpart in defaultState', () => {
        const base = JSON.parse(JSON.stringify(defaultState));
        const saved = {
            plugins: {
                'com.sienci.storage-test': { data: { foo: 123 } },
            },
        };

        const result = merge(base, saved);

        expect(result.plugins).toEqual({
            'com.sienci.storage-test': { data: { foo: 123 } },
        });
    });

    it('falls back to the empty default when nothing was ever saved', () => {
        const base = JSON.parse(JSON.stringify(defaultState));

        const result = merge(base, {});

        expect(result.plugins).toEqual({});
    });
});
