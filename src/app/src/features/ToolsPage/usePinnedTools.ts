import { usePlugins } from 'app/features/Plugins/hooks/usePlugins';
import { useWorkspaceState } from 'app/hooks/useWorkspaceState';
import { translateKey, useAppTranslation } from 'app/i18n';
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
    // Built-in titles/descriptions are tk() keys; re-translate on language change
    const { i18n } = useAppTranslation();
    const language = i18n.language;

    const pinnedIds = useMemo(
        () => new Set<string>(pinnedToolIds ?? []),
        [pinnedToolIds],
    );

    // biome-ignore lint/correctness/useExhaustiveDependencies: language re-translates the titles
    const { tools, pinnedTools } = useMemo(() => {
        const available = [
            ...BUILT_IN_TOOLS,
            ...pluginToolEntries(toolsPagePlugins),
        ]
            .filter((tool) =>
                pendant ? !tool.hideOnPendant : !tool.pendantOnly,
            )
            .map((tool) => ({
                ...tool,
                title: translateKey(tool.title),
                description: tool.description && translateKey(tool.description),
            }));
        const pinned = available
            .filter((tool) => pinnedIds.has(tool.id))
            .sort(byTitle);
        const unpinned = available.filter((tool) => !pinnedIds.has(tool.id));

        return { tools: [...pinned, ...unpinned], pinnedTools: pinned };
    }, [toolsPagePlugins, pinnedIds, pendant, language]);

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
