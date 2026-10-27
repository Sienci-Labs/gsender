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
import type { GcodeFilePayload } from '../../electron-bridge';
import { saveRecentFileEntry } from '../../hooks/useFileActions';
import { applyGcodeFile } from '../../utils/fileLoader';
import HoldButton from '../carve/setup/HoldButton';
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
    // onOpenFile is wired per render in PendantToolHost - it needs onClose
    'remote-file-receive': { Component: RemoteFileReceive },
};

// Loading replaces the current job, so it takes a full hold like Recent Files
function HoldToLoadButton(props: React.ComponentProps<typeof HoldButton>) {
    return <HoldButton {...props} aria-label="Hold to load" />;
}

// react-router hooks (useNavigate/useParams) used inside several of these
// need *some* Router context - the pendant shell mounts no top-level Router
// (see entry-pendant.tsx), so each opened tool gets its own MemoryRouter, the
// same way PendantConfigView.tsx already does for Config. A tool's own
// internal "exit"/"navigate('/')" calls only move that isolated MemoryRouter,
// not the caller's state, so the Back button below is the real way out.
export default function PendantToolHost({
    tool,
    onClose,
    onShowCarve,
}: {
    tool: ToolEntry;
    onClose: () => void;
    /** Switches the shell to the Carve page; unset when already on it. */
    onShowCarve?: () => void;
}) {
    const builtIn = BUILT_IN_TOOLS[tool.id];

    // Leaves the tool for Carve first, then loads on the next frame so the
    // file is parsed and drawn into a visible visualizer.
    const openRemoteFile = (
        payload: GcodeFilePayload & { savedName?: string },
    ) => {
        onClose();
        onShowCarve?.();
        requestAnimationFrame(() => {
            void applyGcodeFile(payload);
        });
        saveRecentFileEntry({
            fileName: payload.name,
            fileSize: payload.size,
            timeLoaded: Date.now(),
            source: 'remote',
            savedName: payload.savedName || '',
        });
    };
    const extraProps =
        tool.id === 'remote-file-receive'
            ? { onOpenFile: openRemoteFile, OpenButton: HoldToLoadButton }
            : undefined;

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
                            <builtIn.Component
                                {...builtIn.props}
                                {...extraProps}
                            />
                        </MemoryRouter>
                    )}
                </div>
            )}
        </div>
    );
}
