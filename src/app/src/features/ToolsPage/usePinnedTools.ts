import { usePlugins } from 'app/features/Plugins/hooks/usePlugins';
import { useWorkspaceState } from 'app/hooks/useWorkspaceState';
import store from 'app/store';
import { useCallback, useMemo } from 'react';
import { BUILT_IN_TOOLS, pluginToolEntries, type ToolEntry } from './registry';

const byTitle = (a: ToolEntry, b: ToolEntry) =>
    a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });

/**
 * The tools available on this platform, pinned ones first (alphabetically),
 * then the rest in their default order.
 */
export const usePinnedTools = ({ pendant }: { pendant: boolean }) => {
    const { toolsPagePlugins } = usePlugins();
    const { pinnedTools: pinnedToolIds } = useWorkspaceState();

    const pinnedIds = useMemo(
        () => new Set<string>(pinnedToolIds ?? []),
        [pinnedToolIds],
    );

    const { tools, pinnedTools } = useMemo(() => {
        const available = [
            ...BUILT_IN_TOOLS,
            ...pluginToolEntries(toolsPagePlugins),
        ].filter((tool) => (pendant ? !tool.hideOnPendant : !tool.pendantOnly));
        const pinned = available
            .filter((tool) => pinnedIds.has(tool.id))
            .sort(byTitle);
        const unpinned = available.filter((tool) => !pinnedIds.has(tool.id));

        return { tools: [...pinned, ...unpinned], pinnedTools: pinned };
    }, [toolsPagePlugins, pinnedIds, pendant]);

    const togglePin = useCallback((id: string) => {
        const current: string[] = store.get('workspace.pinnedTools', []);
        const next = current.includes(id)
            ? current.filter((pinnedId) => pinnedId !== id)
            : [...current, id];
        // replace, not set: set deep-merges arrays by index, so removals are lost
        store.replace('workspace.pinnedTools', next);
    }, []);

    return { tools, pinnedTools, pinnedIds, togglePin };
};
