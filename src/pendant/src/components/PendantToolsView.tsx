import PluginToolCard from 'app/components/PluginToolCard';
import ToolCard from 'app/components/ToolCard';
import type { ToolEntry } from 'app/features/ToolsPage/registry';
import { usePinnedTools } from 'app/features/ToolsPage/usePinnedTools';
import { useState } from 'react';
import PendantToolHost from './tools/PendantToolHost';

export default function PendantToolsView({
    onShowCarve,
}: {
    onShowCarve?: () => void;
}) {
    const { tools, pinnedIds, togglePin } = usePinnedTools({ pendant: true });
    const [activeTool, setActiveTool] = useState<ToolEntry | null>(null);

    if (activeTool) {
        return (
            <PendantToolHost
                tool={activeTool}
                onClose={() => setActiveTool(null)}
                onShowCarve={onShowCarve}
            />
        );
    }

    return (
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-3">
            <h1 className="text-xl font-bold dark:text-content-primary mb-1">
                Tools
            </h1>
            <p className="text-sm text-gray-600 dark:text-content-muted mb-3">
                Tools are plugins that can be installed and used to extend the
                functionality of gSender. Some are built in to gSender, some are
                third party plugins. Star a tool to pin it to the carve screen.
            </p>

            <div className="grid grid-cols-2 gap-3">
                {tools.map((tool) => {
                    const pinned = pinnedIds.has(tool.id);
                    const onTogglePin = () => togglePin(tool.id);
                    const onClick = () => setActiveTool(tool);

                    if (tool.plugin) {
                        return (
                            <PluginToolCard
                                key={tool.id}
                                title={tool.title}
                                description={tool.description}
                                blurb={tool.blurb}
                                icon={tool.icon}
                                onClick={onClick}
                                official={tool.plugin.official}
                                pinned={pinned}
                                onTogglePin={onTogglePin}
                            />
                        );
                    }

                    return (
                        <ToolCard
                            key={tool.id}
                            title={tool.title}
                            description={tool.description}
                            icon={tool.icon}
                            onClick={onClick}
                            pinned={pinned}
                            onTogglePin={onTogglePin}
                        />
                    );
                })}
            </div>
        </div>
    );
}
