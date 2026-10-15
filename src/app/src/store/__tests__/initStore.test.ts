const mockFetch = jest.fn();
const mockReplace = jest.fn();
const listeners: Record<string, Function[]> = {};

jest.mock('app/api', () => ({
    __esModule: true,
    default: {
        preferences: {
            fetch: (...args: unknown[]) => mockFetch(...args),
            replace: (...args: unknown[]) => mockReplace(...args),
        },
    },
}));

jest.mock('app/lib/controller', () => ({
    __esModule: true,
    default: {
        addListener: (event: string, fn: Function) => {
            listeners[event] = [...(listeners[event] || []), fn];
        },
    },
}));

jest.mock('sonner', () => ({ toast: { error: jest.fn() } }));
jest.mock('is-electron', () => () => false);

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

const loadStore = () => {
    let mod: typeof import('../index');
    jest.isolateModules(() => {
        mod = require('../index');
    });
    return mod!;
};

const emit = (event: string, ...args: unknown[]) =>
    (listeners[event] || []).forEach((fn) => fn(...args));

describe('initStore', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        mockFetch.mockReset();
        mockReplace.mockReset().mockResolvedValue({});
        for (const key of Object.keys(listeners)) delete listeners[key];
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('applies the fetched state over defaults and writes it back', async () => {
        mockFetch.mockResolvedValue({
            data: { version: '1.7.0', state: { workspace: { units: 'in' } } },
        });
        const { initStore, default: store } = loadStore();

        await initStore();

        expect(store.get('workspace.units')).toBe('in');
        expect(mockReplace).toHaveBeenCalledTimes(1);
        expect(mockReplace.mock.calls[0][0].state.workspace.units).toBe('in');
        expect(mockReplace.mock.calls[0][0].originId).toEqual(
            expect.any(String),
        );
    });

    it('is idempotent', async () => {
        mockFetch.mockResolvedValue({ data: { version: '1.7.0', state: {} } });
        const { initStore } = loadStore();

        const first = initStore();
        const second = initStore();
        await first;

        expect(second).toBe(first);
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('keeps defaults and never persists when the fetch fails', async () => {
        mockFetch.mockRejectedValue(new Error('offline'));
        const { initStore, default: store } = loadStore();

        const done = initStore();
        await jest.advanceTimersByTimeAsync(5000);
        await done;

        expect(mockFetch).toHaveBeenCalledTimes(4); // initial + 3 retries
        store.set('workspace.units', 'in');
        await jest.advanceTimersByTimeAsync(500);
        expect(mockReplace).not.toHaveBeenCalled();
    });

    it('persists local changes, debounced', async () => {
        mockFetch.mockResolvedValue({ data: { version: '1.7.0', state: {} } });
        const { initStore, default: store } = loadStore();
        await initStore();
        mockReplace.mockClear();

        store.set('workspace.units', 'in');
        store.set('workspace.units', 'mm');
        await jest.advanceTimersByTimeAsync(150);

        expect(mockReplace).toHaveBeenCalledTimes(1);
        expect(mockReplace.mock.calls[0][0].state.workspace.units).toBe('mm');
    });

    it('applies a remote preferences:changed without echoing it back', async () => {
        mockFetch.mockResolvedValue({ data: { version: '1.7.0', state: {} } });
        const { initStore, default: store } = loadStore();
        await initStore();
        mockReplace.mockClear();

        emit('preferences:changed', {
            version: '1.7.0',
            state: { workspace: { units: 'in' } },
            originId: 'someone-else',
        });
        await jest.advanceTimersByTimeAsync(500);

        expect(store.get('workspace.units')).toBe('in');
        expect(mockReplace).not.toHaveBeenCalled();
    });

    it('ignores its own preferences:changed echo', async () => {
        mockFetch.mockResolvedValue({ data: { version: '1.7.0', state: {} } });
        const { initStore, default: store } = loadStore();
        await initStore();
        const ownId = mockReplace.mock.calls[0][0].originId;

        emit('preferences:changed', {
            version: '1.7.0',
            state: { workspace: { units: 'in' } },
            originId: ownId,
        });

        expect(store.get('workspace.units')).not.toBe('in');
    });

    it('refetches and applies after a reconnect, but not on the first connect', async () => {
        mockFetch.mockResolvedValue({ data: { version: '1.7.0', state: {} } });
        const { initStore, default: store } = loadStore();
        await initStore();

        emit('connect');
        expect(mockFetch).toHaveBeenCalledTimes(1);

        emit('disconnect');
        mockFetch.mockResolvedValue({
            data: { version: '1.7.0', state: { workspace: { units: 'in' } } },
        });
        emit('connect');
        await jest.advanceTimersByTimeAsync(10);

        expect(mockFetch).toHaveBeenCalledTimes(2);
        expect(store.get('workspace.units')).toBe('in');
    });

    it('does not persist between a disconnect and the resync, then resumes', async () => {
        mockFetch.mockResolvedValue({ data: { version: '1.7.0', state: {} } });
        const { initStore, default: store } = loadStore();
        await initStore();
        const currentVersion = mockReplace.mock.calls[0][0].version;
        mockReplace.mockClear();

        emit('disconnect');
        store.set('workspace.units', 'in');
        await jest.advanceTimersByTimeAsync(500);
        expect(mockReplace).not.toHaveBeenCalled();

        // a change racing the refetch still isn't written
        let resolveFetch: (v: unknown) => void = () => {};
        mockFetch.mockReturnValue(
            new Promise((resolve) => {
                resolveFetch = resolve;
            }),
        );
        emit('connect');
        store.set('workspace.units', 'mm');
        await jest.advanceTimersByTimeAsync(500);
        expect(mockReplace).not.toHaveBeenCalled();

        const synced = JSON.parse(JSON.stringify(store.state));
        synced.workspace.units = 'in';
        resolveFetch({ data: { version: currentVersion, state: synced } });
        await jest.advanceTimersByTimeAsync(10);
        expect(store.get('workspace.units')).toBe('in');
        expect(mockReplace).not.toHaveBeenCalled();

        store.set('workspace.units', 'mm');
        await jest.advanceTimersByTimeAsync(150);
        expect(mockReplace).toHaveBeenCalledTimes(1);
    });

    it('saves newly merged defaults once after a reconnect resync', async () => {
        mockFetch.mockResolvedValue({ data: { version: '1.7.0', state: {} } });
        const { initStore, default: store } = loadStore();
        await initStore();
        const fullState = JSON.parse(JSON.stringify(store.state));
        mockReplace.mockClear();

        // server copy is missing a key that defaults provide
        const stale = JSON.parse(JSON.stringify(fullState));
        delete stale.workspace.units;
        mockFetch.mockResolvedValue({
            data: { version: '1.7.0', state: stale },
        });
        emit('disconnect');
        emit('connect');
        await jest.advanceTimersByTimeAsync(500);

        expect(mockReplace).toHaveBeenCalledTimes(1);
        expect(mockReplace.mock.calls[0][0].state.workspace.units).toBe(
            fullState.workspace.units,
        );
    });

    it('does not write after a reconnect resync when nothing new was merged', async () => {
        mockFetch.mockResolvedValue({ data: { version: '1.7.0', state: {} } });
        const { initStore, default: store } = loadStore();
        await initStore();
        const currentVersion = mockReplace.mock.calls[0][0].version;
        const fullState = JSON.parse(JSON.stringify(store.state));
        mockReplace.mockClear();

        mockFetch.mockResolvedValue({
            data: { version: currentVersion, state: fullState },
        });
        emit('disconnect');
        emit('connect');
        await jest.advanceTimersByTimeAsync(500);

        expect(mockReplace).not.toHaveBeenCalled();
    });
});
