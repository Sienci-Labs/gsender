import PluginToolCard from 'app/components/PluginToolCard';
import ToolCard from 'app/components/ToolCard';
import { usePinnedTools } from 'app/features/ToolsPage/usePinnedTools';

const ToolsPage = () => {
    const { tools, pinnedIds, togglePin } = usePinnedTools({ pendant: false });

    return (
        <div className="py-4 px-16 max-xl:px-8 pb-12 fixed-content-area w-full flex flex-col overflow-y-auto">
            <h1 className="text-3xl font-bold dark:text-content-primary mb-2">
                Tools
            </h1>
            <p className="text-sm text-gray-600 dark:text-content-muted mb-4">
                Tools are plugins that can be installed and used to extend the
                functionality of gSender. Some are built in to gSender, some are
                third party plugins. Star a tool to pin it to the top.
            </p>

            <div className="flex-1 grid lg:grid-cols-3 grid-cols-2 gap-4 overflow-y-auto overflow-x-hidden">
                {tools.map((tool) => {
                    const pinned = pinnedIds.has(tool.id);
                    const onTogglePin = () => togglePin(tool.id);

                    if (tool.plugin) {
                        return (
                            <PluginToolCard
                                key={tool.id}
                                title={tool.title}
                                description={tool.description}
                                blurb={tool.blurb}
                                icon={tool.icon}
                                link={tool.link}
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
                            link={tool.link}
                            pinned={pinned}
                            onTogglePin={onTogglePin}
                        />
                    );
                })}
            </div>
        </div>
    );
};

export default ToolsPage;
