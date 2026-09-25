import api from 'app/api';
import controller from 'app/lib/controller';
import store from 'app/store';
import type { PluginRecord, PluginsResponse } from '../types';

// a single module-level source of truth for the plugin list, shared by every
// usePlugins() caller
//
// this store caches the plugin data as long as possible so the useEffects/useMemos 
// dependent on it dont have to be re-run unnecessarily

export type PluginStoreState = {
    plugins: PluginRecord[];
    pluginsDir: string;
    loading: boolean;
    error: string | null;
    activePlugins: PluginRecord[];
    toolsPagePlugins: PluginRecord[];
    toolsTabPlugins: PluginRecord[];
    visualizerOverlayPlugins: PluginRecord[];
};

const initialState: PluginStoreState = {
    plugins: [],
    pluginsDir: '',
    loading: true,
    error: null,
    activePlugins: [],
    toolsPagePlugins: [],
    toolsTabPlugins: [],
    visualizerOverlayPlugins: [],
};

let state: PluginStoreState = initialState;
const listeners = new Set<() => void>();
let pendingFetch: Promise<void> | null = null;
let controllerListenerAttached = false;

const emit = () => {
    for (const listener of listeners) {
        listener();
    }
};

// compare plugin id + enabled + valid, as this will detect whether a
// plugin was added/removed, or its enabled/valid state flipped
const sameList = (a: PluginRecord[], b: PluginRecord[]): boolean => {
    if (a === b) return true;
    if (a.length !== b.length) return false;
    return a.every((plugin, index) => {
        const other = b[index];
        return (
            other &&
            plugin.id === other.id &&
            plugin.enabled === other.enabled &&
            plugin.valid === other.valid &&
            plugin.version === other.version
        );
    });
};

const deriveList = (
    previous: PluginRecord[],
    next: PluginRecord[],
): PluginRecord[] => (sameList(previous, next) ? previous : next);

const hasToolsPageContribution = (p: PluginRecord) =>
    p.contributions.some((c) => c.slot === 'tools-page');
const hasToolsTabContribution = (p: PluginRecord) =>
    p.contributions.some((c) => c.slot === 'tools-tab');
const hasVisualizerOverlayContribution = (p: PluginRecord) =>
    p.contributions.some((c) => c.slot === 'visualizer-overlay');

const buildState = (
    previous: PluginStoreState,
    partial: Partial<
        Pick<PluginStoreState, 'plugins' | 'pluginsDir' | 'loading' | 'error'>
    >,
): PluginStoreState => {
    const plugins =
        partial.plugins !== undefined
            ? deriveList(previous.plugins, partial.plugins)
            : previous.plugins;

    const activePlugins =
        plugins === previous.plugins
            ? previous.activePlugins
            : deriveList(
                  previous.activePlugins,
                  plugins.filter((p) => p.valid && p.enabled),
              );

    const toolsPagePlugins =
        activePlugins === previous.activePlugins
            ? previous.toolsPagePlugins
            : deriveList(
                  previous.toolsPagePlugins,
                  activePlugins.filter(hasToolsPageContribution),
              );

    const toolsTabPlugins =
        activePlugins === previous.activePlugins
            ? previous.toolsTabPlugins
            : deriveList(
                  previous.toolsTabPlugins,
                  activePlugins.filter(hasToolsTabContribution),
              );

    const visualizerOverlayPlugins =
        activePlugins === previous.activePlugins
            ? previous.visualizerOverlayPlugins
            : deriveList(
                  previous.visualizerOverlayPlugins,
                  activePlugins.filter(hasVisualizerOverlayContribution),
              );

    const nextState: PluginStoreState = {
        plugins,
        pluginsDir:
            partial.pluginsDir !== undefined
                ? partial.pluginsDir
                : previous.pluginsDir,
        loading:
            partial.loading !== undefined ? partial.loading : previous.loading,
        error: partial.error !== undefined ? partial.error : previous.error,
        activePlugins,
        toolsPagePlugins,
        toolsTabPlugins,
        visualizerOverlayPlugins,
    };

    // if nothing actually changed, keep the previous object reference
    const unchanged =
        nextState.plugins === previous.plugins &&
        nextState.pluginsDir === previous.pluginsDir &&
        nextState.loading === previous.loading &&
        nextState.error === previous.error;

    return unchanged ? previous : nextState;
};

const setState = (
    partial: Partial<
        Pick<PluginStoreState, 'plugins' | 'pluginsDir' | 'loading' | 'error'>
    >,
) => {
    const next = buildState(state, partial);
    if (next !== state) {
        state = next;
        emit();
    }
};

const doFetch = async (): Promise<void> => {
    setState({ loading: true, error: null });

    try {
        const { data } = await api.plugins.fetch();
        const response = data as PluginsResponse;
        const resolvedPluginsDir =
            response.userPluginsDir || response.pluginsDir || '';

        store.set('workspace.userPluginsDir', response.userPluginsDir || '');

        setState({
            plugins: response.plugins || [],
            pluginsDir: resolvedPluginsDir,
            loading: false,
            error: null,
        });
    } catch (err) {
        setState({
            plugins: [],
            loading: false,
            error:
                err instanceof Error ? err.message : 'Failed to load plugins',
        });
    }
};

export const refresh = (): Promise<void> => {
    if (!pendingFetch) {
        pendingFetch = doFetch().finally(() => {
            pendingFetch = null;
        });
    }
    return pendingFetch;
};

const ensureControllerListener = () => {
    if (controllerListenerAttached) return;
    controllerListenerAttached = true;
    controller.addListener('plugins:changed', onPluginsChanged);
};

function onPluginsChanged() {
    refresh();
}

export const subscribe = (listener: () => void): (() => void) => {
    const isFirstSubscriber = listeners.size === 0;
    listeners.add(listener);

    ensureControllerListener();
    if (isFirstSubscriber) {
        refresh();
    }

    return () => {
        listeners.delete(listener);
        // intentionally keep the controller listener attached,
        // bc it is unable to be duplicated (controllerListenerAttached stays true forever)
    };
};

export const getSnapshot = (): PluginStoreState => state;

export const setEnabled = async (
    id: string,
    enabled: boolean,
): Promise<{ restartRequired?: boolean }> => {
    const { data } = await api.plugins.update(id, { enabled });
    await refresh();
    return data as { restartRequired?: boolean };
};

export const openPluginsDir = async (pluginPath?: string): Promise<void> => {
    await api.plugins.openDirectory(pluginPath);
};

// Test-only: module singletons leak state across jest test files that don't
// each get a fresh module registry. Not used in application code.
export const __resetPluginStore = (): void => {
    state = initialState;
    listeners.clear();
    pendingFetch = null;
    controllerListenerAttached = false;
    controller.removeListener('plugins:changed', onPluginsChanged);
};
