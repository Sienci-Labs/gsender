const mockRestoreState = jest.fn();
const mockStoreGet = jest.fn();

jest.mock('app/api', () => ({
    __esModule: true,
    default: { events: { clearAll: jest.fn() } },
}));

jest.mock('app/lib/toaster', () => ({
    toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock('app/store', () => ({
    __esModule: true,
    default: {
        get: (...args: unknown[]) => mockStoreGet(...args),
        restoreState: (...args: unknown[]) => mockRestoreState(...args),
    },
    // simplified stand-in for the real merge: saved values win over defaults
    merge: (base: any, saved: any) => {
        const out = { ...base };
        Object.entries(saved || {}).forEach(([k, v]) => {
            out[k] =
                v && typeof v === 'object' && !Array.isArray(v)
                    ? { ...(base?.[k] || {}), ...(v as object) }
                    : v;
        });
        return out;
    },
}));

import { storeUpdate } from '../storeUpdate';

describe('storeUpdate', () => {
    beforeEach(() => {
        mockRestoreState.mockClear();
        mockStoreGet.mockReset();
    });

    it.each([
        ['orthographic', 'Orthographic'],
        ['perspective', 'Perspective'],
        ['Orthographic', 'Orthographic'],
    ])('migrates imported projection %s to %s', async (saved, expected) => {
        const file = JSON.stringify({
            settings: {
                workspace: {},
                widgets: { visualizer: { projection: saved } },
                commandKeys: {},
            },
            events: [],
        });

        await storeUpdate(file);

        expect(mockRestoreState).toHaveBeenCalledTimes(1);
        const restored = mockRestoreState.mock.calls[0][0];
        expect(restored.widgets.visualizer.projection).toBe(expected);
    });
});
