import { useSyncExternalStore } from 'react';
import {
    getSnapshot,
    openPluginsDir,
    refresh,
    setEnabled,
    subscribe,
} from './pluginStore';

// wrapper around the plugin store
// data is fetched once by the store and shared to every component that uses this wrapper
export const usePlugins = () => {
    const state = useSyncExternalStore(subscribe, getSnapshot);

    return {
        plugins: state.plugins,
        pluginsDir: state.pluginsDir,
        loading: state.loading,
        error: state.error,
        refresh,
        setEnabled,
        openPluginsDir,
        activePlugins: state.activePlugins,
        toolsPagePlugins: state.toolsPagePlugins,
        toolsTabPlugins: state.toolsTabPlugins,
        visualizerOverlayPlugins: state.visualizerOverlayPlugins,
    };
};
