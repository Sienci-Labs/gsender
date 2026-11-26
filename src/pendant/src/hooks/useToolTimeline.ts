import type { ToolChange } from 'app/features/ATC/components/ToolTimeline/components/types.ts';
import { getToolpathColor } from 'app/features/ATC/utils/ATCFunctions.ts';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import type { RootState } from 'app/store/redux';
import { useSyncExternalStore } from 'react';
import { PENDANT_CUT_COLOR } from '../visualizerTheme';

export type TimelineTool = ToolChange & { startLine: number; endLine: number };

const EMPTY: TimelineTool[] = [];
let latest: TimelineTool[] = EMPTY;
const listeners = new Set<() => void>();

/**
 * Tool segments for the loaded file, in sender line numbers. Colors follow
 * the visualize worker's rule: the first tool uses the pendant cut color,
 * later ones getToolpathColor(n), so segments match the drawn toolpaths.
 */
export function buildToolTimeline(
    toolEvents: Record<string, any>,
    total: number,
): TimelineTool[] {
    const tools: TimelineTool[] = [];
    Object.entries(toolEvents ?? {}).forEach(([line, value]) => {
        if (!value || !Object.hasOwn(value, 'M') || !Object.hasOwn(value, 'T'))
            return;
        const count = tools.length;
        tools.push({
            index: count + 1,
            toolNumber: value.T,
            label: `T${value.T}`,
            color:
                count === 0
                    ? PENDANT_CUT_COLOR
                    : `#${getToolpathColor(count).getHexString()}`,
            startLine: Number(line),
            endLine: total,
            ...(value.comment ? { comment: value.comment } : {}),
        });
    });

    for (let i = 0; i < tools.length - 1; i++) {
        tools[i].endLine = tools[i + 1].startLine - 1;
    }
    // Preamble before the first change belongs to the first tool
    if (tools.length > 0) tools[0].startLine = 0;
    return tools;
}

/** Called on every file load (see gcodeProcessing applyWorkerResult). */
export function setToolTimeline(
    toolEvents: Record<string, any>,
    total: number,
) {
    latest = buildToolTimeline(toolEvents, total);
    listeners.forEach((l) => l());
}

const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};

/** Tool segments of the loaded file; empty when no file is loaded. Cached
 * so panels that mount mid-job (the run panel) still get it. */
export function useToolTimeline(): TimelineTool[] {
    const fileLoaded = useTypedSelector((s: RootState) => s.file.fileLoaded);
    const tools = useSyncExternalStore(subscribe, () => latest);
    return fileLoaded ? tools : EMPTY;
}
