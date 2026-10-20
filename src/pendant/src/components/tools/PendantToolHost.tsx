import { AccessoryInstaller } from 'app/features/AccessoryInstaller';
import KeyboardShortcuts from 'app/features/Keyboard';
import Gamepad from 'app/features/Gamepad';
import MovementTuning from 'app/features/MovementTuning';
import { PluginManager } from 'app/features/Plugins';
import PluginPanel from 'app/features/Plugins/components/PluginPanel';
import RemoteFileReceive from 'app/features/RemoteFileReceive';
import RotarySurfacing from 'app/features/Rotary/RotarySurfacing';
import SDCard from 'app/features/SDCard';
import Squaring from 'app/features/Squaring';
import Surfacing from 'app/features/Surfacing';
import type { ToolEntry } from 'app/features/ToolsPage/registry';
import { LuArrowLeft } from 'react-icons/lu';
import { MemoryRouter } from 'react-router';
import { applyGcodeFile } from '../../utils/fileLoader';
import GcodeToolPreviewVisualizer from '../GcodeToolPreviewVisualizer';

// Keyed by the registry's tool IDs. Tools take different, tool-specific props.
const BUILT_IN_TOOLS: Record<
    string,
    // biome-ignore lint/suspicious/noExplicitAny: tools take different, tool-specific prop shapes
    { Component: React.ComponentType<any>; props?: Record<string, unknown> }
> = {
    surfacing: {
        Component: Surfacing,
        props: { PreviewComponent: GcodeToolPreviewVisualizer },
    },
    'rotary-surfacing': {
        Component: RotarySurfacing,
        props: { PreviewComponent: GcodeToolPreviewVisualizer },
    },
    'movement-tuning': { Component: MovementTuning },
    squaring: { Component: Squaring },
    'keyboard-shortcuts': { Component: KeyboardShortcuts },
    gamepad: { Component: Gamepad },
    sd: { Component: SDCard },
    accessoryInstall: { Component: AccessoryInstaller },
    plugins: { Component: PluginManager },
    'remote-file-receive': {
        Component: RemoteFileReceive,
        props: { onOpenFile: applyGcodeFile },
    },
};

// react-router hooks (useNavigate/useParams) used inside several of these
// need *some* Router context - the pendant shell mounts no top-level Router
// (see entry-pendant.tsx), so each opened tool gets its own MemoryRouter, the
// same way PendantConfigView.tsx already does for Config. A tool's own
// internal "exit"/"navigate('/')" calls only move that isolated MemoryRouter,
// not the caller's state, so the Back button below is the real way out.
export default function PendantToolHost({
    tool,
    onClose,
}: {
    tool: ToolEntry;
    onClose: () => void;
}) {
    const builtIn = BUILT_IN_TOOLS[tool.id];

    return (
        <div className="flex-1 flex flex-col min-h-0 p-3">
            <div className="flex items-center justify-between mb-2">
                <h1 className="text-xl font-bold dark:text-content-primary">
                    {tool.title}
                </h1>
                <button
                    type="button"
                    onClick={onClose}
                    className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-md border border-gray-300 dark:border-outline dark:text-content-primary"
                >
                    <LuArrowLeft className="w-4 h-4" />
                    Back
                </button>
            </div>
            {tool.plugin ? (
                <PluginPanel plugin={tool.plugin.record} className="flex-1" />
            ) : (
                <div className="flex-1 min-h-0 overflow-y-auto">
                    {builtIn && (
                        <MemoryRouter>
                            <builtIn.Component {...builtIn.props} />
                        </MemoryRouter>
                    )}
                </div>
            )}
        </div>
    );
}
