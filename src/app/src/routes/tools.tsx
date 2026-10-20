import PluginToolCard from 'app/components/PluginToolCard';
import ToolCard from 'app/components/ToolCard';
import { usePlugins } from 'app/features/Plugins/hooks/usePlugins';
import { useWorkspaceState } from 'app/hooks/useWorkspaceState';
import store from 'app/store';
import { useMemo } from 'react';
import type { IconType } from 'react-icons';
import { BiSolidCylinder } from 'react-icons/bi';
import { FaGamepad, FaKeyboard, FaSdCard } from 'react-icons/fa';
import { GiFlatPlatform } from 'react-icons/gi';
import { LuDrill } from 'react-icons/lu';
import { MdSquareFoot } from 'react-icons/md';
import { PiPuzzlePiece } from 'react-icons/pi';
import { TbPuzzle, TbRulerMeasure } from 'react-icons/tb';

type ToolEntry = {
    id: string;
    title: string;
    description?: string;
    blurb?: string;
    icon: IconType;
    link: string;
    plugin?: { official: boolean };
};

// IDs are persisted in workspace.pinnedTools, so keep them stable
const BUILT_IN_TOOLS: ToolEntry[] = [
    {
        id: 'surfacing',
        title: 'Surfacing',
        description: 'Flatten your wasteboard or other non-flat stock',
        icon: GiFlatPlatform,
        link: '/tools/surfacing',
    },
    {
        id: 'rotary-surfacing',
        title: 'Rotary Surfacing',
        description: 'Turn square material into round stock for rotary cutting',
        icon: BiSolidCylinder,
        link: '/tools/rotary-surfacing',
    },
    {
        id: 'movement-tuning',
        title: 'Movement Tuning',
        description:
            'Ensure that each axis of your machine is moving accurately',
        icon: TbRulerMeasure,
        link: '/tools/movement-tuning',
    },
    {
        id: 'squaring',
        title: 'XY Squaring',
        description: 'Get your CNC accurately aligned to make square cuts',
        icon: MdSquareFoot,
        link: '/tools/squaring',
    },
    {
        id: 'keyboard-shortcuts',
        title: 'Keyboard Shortcuts',
        description:
            'Set up keyboard shortcuts for easy navigation and control',
        icon: FaKeyboard,
        link: '/tools/keyboard-shortcuts',
    },
    {
        id: 'gamepad',
        title: 'Gamepad',
        description:
            'Easy hand-held CNC control using pre-made or custom profiles',
        icon: FaGamepad,
        link: '/tools/gamepad',
    },
    {
        id: 'sd',
        title: 'SD Card Manager',
        description: 'Manage and view files on your SD card',
        icon: FaSdCard,
        link: '/tools/sd',
    },
    {
        id: 'accessoryInstall',
        title: 'Accessory Installation',
        description: 'Install various CNC Accessories',
        icon: LuDrill,
        link: '/tools/accessoryInstall',
    },
    {
        id: 'plugins',
        title: 'Plugins',
        description: 'Manage installed UI plugins',
        icon: PiPuzzlePiece,
        link: '/tools/plugins',
    },
];

const ToolsPage = () => {
    const { toolsPagePlugins } = usePlugins();
    const { pinnedTools } = useWorkspaceState();

    const pinnedIds = useMemo(() => new Set(pinnedTools ?? []), [pinnedTools]);

    const tools = useMemo(() => {
        const pluginTools = toolsPagePlugins.flatMap((plugin): ToolEntry[] => {
            const contribution = plugin.contributions.find(
                (c) => c.slot === 'tools-page',
            );
            if (!contribution?.route) {
                return [];
            }

            return [
                {
                    id: `plugin:${plugin.id}`,
                    title: contribution.label || plugin.name,
                    description: `Plugin · v${plugin.version}`,
                    blurb: plugin.description,
                    icon: TbPuzzle,
                    link: `/tools/plugin/${contribution.route}`,
                    plugin: { official: plugin.id.startsWith('com.sienci.') },
                },
            ];
        });

        const all = [...BUILT_IN_TOOLS, ...pluginTools];
        const pinned = all
            .filter((tool) => pinnedIds.has(tool.id))
            .sort((a, b) =>
                a.title.localeCompare(b.title, undefined, {
                    sensitivity: 'base',
                }),
            );
        const unpinned = all.filter((tool) => !pinnedIds.has(tool.id));

        return [...pinned, ...unpinned];
    }, [toolsPagePlugins, pinnedIds]);

    const togglePin = (id: string) => {
        const current: string[] = store.get('workspace.pinnedTools', []);
        const next = current.includes(id)
            ? current.filter((pinnedId) => pinnedId !== id)
            : [...current, id];
        // replace, not set: set deep-merges arrays by index, so removals are lost
        store.replace('workspace.pinnedTools', next);
    };

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
