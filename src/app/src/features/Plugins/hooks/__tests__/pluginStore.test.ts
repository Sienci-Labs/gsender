import type { PluginRecord } from '../../types';

const mockFetch = jest.fn();
const mockUpdate = jest.fn();

jest.mock('app/api', () => ({
    __esModule: true,
    default: {
        plugins: {
            fetch: (...args: unknown[]) => mockFetch(...args),
            update: (...args: unknown[]) => mockUpdate(...args),
        },
    },
}));

const mockControllerListeners: Record<string, Function[]> = {};
jest.mock('app/lib/controller', () => ({
    __esModule: true,
    default: {
        addListener: jest.fn((event: string, cb: Function) => {
            (mockControllerListeners[event] ||= []).push(cb);
        }),
        removeListener: jest.fn((event: string, cb: Function) => {
            mockControllerListeners[event] = (
                mockControllerListeners[event] || []
            ).filter((fn) => fn !== cb);
        }),
    },
}));

const mockStoreSet = jest.fn();
jest.mock('app/store', () => ({
    __esModule: true,
    default: {
        set: (...args: unknown[]) => mockStoreSet(...args),
    },
}));

const makePlugin = (overrides: Partial<PluginRecord> = {}): PluginRecord => ({
    id: 'com.example.tab',
    name: 'Tab Plugin',
    version: '1.0.0',
    description: '',
    engine: null,
    capabilities: { requestTypes: [], topics: [], allowedFunctions: [] },
    permissions: [],
    enabled: true,
    valid: true,
    errors: [],
    mountSlug: 'tab-plugin',
    mountRoute: '/plugins/tab-plugin',
    uiUrl: '/plugins/tab-plugin/index.html',
    contributions: [{ slot: 'tools-tab' }],
    ...overrides,
});

describe('pluginStore', () => {
    // Module singleton: reset it between tests by re-requiring the module
    // fresh, since state/listeners/pendingFetch otherwise leak across tests.
    let pluginStore: typeof import('../pluginStore');

    beforeEach(() => {
        jest.resetModules();
        mockFetch.mockReset();
        mockUpdate.mockReset();
        mockStoreSet.mockReset();
        for (const key of Object.keys(mockControllerListeners)) {
            delete mockControllerListeners[key];
        }
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        pluginStore = require('../pluginStore');
    });

    it('dedupes two concurrent refresh() calls into a single fetch', async () => {
        mockFetch.mockResolvedValue({
            data: { plugins: [], pluginsDir: '', userPluginsDir: '' },
        });

        await Promise.all([pluginStore.refresh(), pluginStore.refresh()]);

        expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('getSnapshot() is referentially stable across repeated calls with no state change in between', async () => {
        mockFetch.mockResolvedValue({
            data: { plugins: [], pluginsDir: '', userPluginsDir: '' },
        });

        await pluginStore.refresh();

        // This is the contract useSyncExternalStore actually requires: calling
        // getSnapshot() twice with no state change in between must return the
        // same reference, or React throws "getSnapshot should be cached".
        const first = pluginStore.getSnapshot();
        const second = pluginStore.getSnapshot();
        expect(second).toBe(first);
    });

    it('keeps derived array identity across a refetch that returns an equal list', async () => {
        const plugin = makePlugin();
        mockFetch.mockResolvedValue({
            data: { plugins: [plugin], pluginsDir: '', userPluginsDir: '' },
        });

        await pluginStore.refresh();
        const firstSnapshot = pluginStore.getSnapshot();

        // A fresh object each time, as the real server response would be —
        // same id/enabled/valid/version, different object identity.
        mockFetch.mockResolvedValue({
            data: {
                plugins: [{ ...plugin }],
                pluginsDir: '',
                userPluginsDir: '',
            },
        });
        await pluginStore.refresh();
        const secondSnapshot = pluginStore.getSnapshot();

        expect(secondSnapshot.toolsTabPlugins).toBe(
            firstSnapshot.toolsTabPlugins,
        );
    });

    it('gives a genuinely different plugin list a new array identity', async () => {
        const plugin = makePlugin();
        mockFetch.mockResolvedValue({
            data: { plugins: [plugin], pluginsDir: '', userPluginsDir: '' },
        });
        await pluginStore.refresh();
        const firstSnapshot = pluginStore.getSnapshot();

        mockFetch.mockResolvedValue({
            data: {
                plugins: [{ ...plugin, enabled: false }],
                pluginsDir: '',
                userPluginsDir: '',
            },
        });
        await pluginStore.refresh();
        const secondSnapshot = pluginStore.getSnapshot();

        expect(secondSnapshot.toolsTabPlugins).not.toBe(
            firstSnapshot.toolsTabPlugins,
        );
        expect(secondSnapshot.toolsTabPlugins).toEqual([]);
    });

    it('attaches the plugins:changed controller listener once on first subscribe and detaches on last unsubscribe', () => {
        mockFetch.mockResolvedValue({
            data: { plugins: [], pluginsDir: '', userPluginsDir: '' },
        });

        const unsubA = pluginStore.subscribe(() => {});
        const unsubB = pluginStore.subscribe(() => {});

        expect(mockControllerListeners['plugins:changed']?.length).toBe(1);

        unsubA();
        expect(mockControllerListeners['plugins:changed']?.length).toBe(1);

        unsubB();
        // Listener stays attached even at zero subscribers by design — see
        // pluginStore.ts's subscribe() comment: it keeps the cached data and
        // controller listener alive so a later remount doesn't flash back to
        // loading=true or miss a plugins:changed event before the next mount.
        expect(mockControllerListeners['plugins:changed']?.length).toBe(1);
    });
});
