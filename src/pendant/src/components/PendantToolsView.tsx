import { AccessoryInstaller } from 'app/features/AccessoryInstaller';
import PluginToolCard from 'app/components/PluginToolCard';
import ToolCard from 'app/components/ToolCard';
import KeyboardShortcuts from 'app/features/Keyboard';
import Gamepad from 'app/features/Gamepad';
import MovementTuning from 'app/features/MovementTuning';
import { PluginManager } from 'app/features/Plugins';
import PluginPanel from 'app/features/Plugins/components/PluginPanel';
import { usePlugins } from 'app/features/Plugins/hooks/usePlugins';
import type { PluginRecord } from 'app/features/Plugins/types';
import RotarySurfacing from 'app/features/Rotary/RotarySurfacing';
import SDCard from 'app/features/SDCard';
import Squaring from 'app/features/Squaring';
import Surfacing from 'app/features/Surfacing';
import { useState } from 'react';
import { MemoryRouter } from 'react-router';
import { BiSolidCylinder } from 'react-icons/bi';
import { FaGamepad, FaKeyboard, FaSdCard } from 'react-icons/fa';
import { GiFlatPlatform } from 'react-icons/gi';
import { LuArrowLeft, LuDrill } from 'react-icons/lu';
import { MdSquareFoot } from 'react-icons/md';
import { PiPuzzlePiece } from 'react-icons/pi';
import { TbPuzzle, TbRulerMeasure } from 'react-icons/tb';

// react-router hooks (useNavigate/useParams) used inside several of these
// need *some* Router context - the pendant shell mounts no top-level Router
// (see entry-pendant.tsx), so each opened tool gets its own MemoryRouter, the
// same way PendantConfigView.tsx already does for Config. A tool's own
// internal "exit"/"navigate('/')" calls only move that isolated MemoryRouter,
// not this view's state, so the Back button below is the real way out.
type BuiltInToolKey =
    | 'surfacing'
    | 'rotary-surfacing'
    | 'movement-tuning'
    | 'squaring'
    | 'keyboard-shortcuts'
    | 'gamepad'
    | 'sd'
    | 'accessoryInstall'
    | 'plugins';

const BUILT_IN_TOOLS: Record<
    BuiltInToolKey,
    { title: string; Component: React.ComponentType }
> = {
    surfacing: { title: 'Surfacing', Component: Surfacing },
    'rotary-surfacing': {
        title: 'Rotary Surfacing',
        Component: RotarySurfacing,
    },
    'movement-tuning': { title: 'Movement Tuning', Component: MovementTuning },
    squaring: { title: 'XY Squaring', Component: Squaring },
    'keyboard-shortcuts': {
        title: 'Keyboard Shortcuts',
        Component: KeyboardShortcuts,
    },
    gamepad: { title: 'Gamepad', Component: Gamepad },
    sd: { title: 'SD Card Manager', Component: SDCard },
    accessoryInstall: {
        title: 'Accessory Installation',
        Component: AccessoryInstaller,
    },
    plugins: { title: 'Plugins', Component: PluginManager },
};

export default function PendantToolsView() {
    const { toolsPagePlugins } = usePlugins();
    const [activeTool, setActiveTool] = useState<BuiltInToolKey | null>(null);
    const [activePlugin, setActivePlugin] = useState<PluginRecord | null>(null);

    if (activeTool) {
        const { title, Component } = BUILT_IN_TOOLS[activeTool];

        return (
            <div className="flex-1 flex flex-col min-h-0 p-3">
                <div className="flex items-center justify-between mb-2">
                    <h1 className="text-xl font-bold dark:text-content-primary">
                        {title}
                    </h1>
                    <button
                        type="button"
                        onClick={() => setActiveTool(null)}
                        className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-md border border-gray-300 dark:border-outline dark:text-content-primary"
                    >
                        <LuArrowLeft className="w-4 h-4" />
                        Back
                    </button>
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto">
                    <MemoryRouter>
                        <Component />
                    </MemoryRouter>
                </div>
            </div>
        );
    }

    if (activePlugin) {
        const contribution = activePlugin.contributions.find(
            (c) => c.slot === 'tools-page',
        );

        return (
            <div className="flex-1 flex flex-col min-h-0 p-3">
                <div className="flex items-center justify-between mb-2">
                    <h1 className="text-xl font-bold dark:text-content-primary">
                        {contribution?.label || activePlugin.name}
                    </h1>
                    <button
                        type="button"
                        onClick={() => setActivePlugin(null)}
                        className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-md border border-gray-300 dark:border-outline dark:text-content-primary"
                    >
                        <LuArrowLeft className="w-4 h-4" />
                        Back
                    </button>
                </div>
                <PluginPanel plugin={activePlugin} className="flex-1" />
            </div>
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
                third party plugins.
            </p>

            <div className="grid grid-cols-2 gap-3">
                <ToolCard
                    title="Surfacing"
                    description="Flatten your wasteboard or other non-flat stock"
                    icon={GiFlatPlatform}
                    onClick={() => setActiveTool('surfacing')}
                />

                <ToolCard
                    title="Rotary Surfacing"
                    description="Turn square material into round stock for rotary cutting"
                    icon={BiSolidCylinder}
                    onClick={() => setActiveTool('rotary-surfacing')}
                />

                <ToolCard
                    title="Movement Tuning"
                    description="Ensure that each axis of your machine is moving accurately"
                    icon={TbRulerMeasure}
                    onClick={() => setActiveTool('movement-tuning')}
                />

                <ToolCard
                    title="XY Squaring"
                    description="Get your CNC accurately aligned to make square cuts"
                    icon={MdSquareFoot}
                    onClick={() => setActiveTool('squaring')}
                />

                <ToolCard
                    title="Keyboard Shortcuts"
                    description="Set up keyboard shortcuts for easy navigation and control"
                    icon={FaKeyboard}
                    onClick={() => setActiveTool('keyboard-shortcuts')}
                />

                <ToolCard
                    title="Gamepad"
                    description="Easy hand-held CNC control using pre-made or custom profiles"
                    icon={FaGamepad}
                    onClick={() => setActiveTool('gamepad')}
                />

                <ToolCard
                    title={'SD Card Manager'}
                    description={'Manage and view files on your SD card'}
                    icon={FaSdCard}
                    onClick={() => setActiveTool('sd')}
                />
                <ToolCard
                    title={'Accessory Installation'}
                    description={'Install various CNC Accessories'}
                    icon={LuDrill}
                    onClick={() => setActiveTool('accessoryInstall')}
                />

                <ToolCard
                    title="Plugins"
                    description="Manage installed UI plugins"
                    icon={PiPuzzlePiece}
                    onClick={() => setActiveTool('plugins')}
                />

                {toolsPagePlugins.map((plugin) => {
                    const contribution = plugin.contributions.find(
                        (c) => c.slot === 'tools-page',
                    );
                    if (!contribution?.route) {
                        return null;
                    }

                    return (
                        <PluginToolCard
                            key={plugin.id}
                            title={contribution.label || plugin.name}
                            description={`Plugin · v${plugin.version}`}
                            blurb={plugin.description}
                            icon={TbPuzzle}
                            onClick={() => setActivePlugin(plugin)}
                            official={plugin.id.startsWith('com.sienci.')}
                        />
                    );
                })}
            </div>
        </div>
    );
}
