import type { ToolEntry } from 'app/features/ToolsPage/registry';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import type { RootState } from 'app/store/redux';
import cn from 'classnames';
import { Crosshair, Scan, Waypoints } from 'lucide-react';
import type { RefObject } from 'react';
import type { VisualizerHandle } from '../../Visualizer';
import PinnedToolsMenu from './PinnedToolsMenu';

interface Props {
    visualizerRef: RefObject<VisualizerHandle>;
    jogArmed: boolean;
    toolsDisabled: boolean;
    onOpenTool: (tool: ToolEntry) => void;
}

const BUTTON =
    'flex h-11 w-11 items-center justify-center rounded border border-transparent text-content-secondary transition-colors hover:border-outline-subtle hover:text-content-primary disabled:opacity-40 disabled:pointer-events-none';
const BUTTON_ARMED = 'border-robin-500 bg-robin-500/20 text-robin-400';

/** Left-center floating tray on the visualizer: tap-to-jog, center on the
 * loaded toolpath, center on the machine bed, pinned tools. */
export default function VizViewTray({
    visualizerRef,
    jogArmed,
    toolsDisabled,
    onOpenTool,
}: Props) {
    const fileLoaded = useTypedSelector((s: RootState) => s.file.fileLoaded);
    const isConnected = useTypedSelector(
        (s: RootState) => s.connection.isConnected,
    );

    return (
        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 p-1.5 rounded-md border border-outline-subtle bg-surface-sunken/[0.72] backdrop-blur-md">
            <button
                type="button"
                className={cn(BUTTON, jogArmed && BUTTON_ARMED)}
                aria-pressed={jogArmed}
                aria-label="Tap the canvas to jog there"
                onClick={() => {
                    const v = visualizerRef.current;
                    if (!v) return;
                    if (jogArmed) v.disarmJog();
                    else v.armJog();
                }}
            >
                <Crosshair className="h-5 w-5" aria-hidden />
            </button>
            <button
                type="button"
                className={BUTTON}
                disabled={!fileLoaded && !isConnected}
                aria-label={
                    fileLoaded
                        ? 'Center on toolpath'
                        : 'Center on current position'
                }
                onClick={() => {
                    const v = visualizerRef.current;
                    if (!v) return;
                    if (fileLoaded) v.focusToModel();
                    else v.focusToBit();
                }}
            >
                <Waypoints className="h-5 w-5" aria-hidden />
            </button>
            <button
                type="button"
                className={BUTTON}
                aria-label="Center on machine"
                onClick={() => visualizerRef.current?.focusToMachineBed()}
            >
                <Scan className="h-5 w-5" aria-hidden />
            </button>
            <PinnedToolsMenu
                className={BUTTON}
                disabled={toolsDisabled}
                onOpen={onOpenTool}
            />
        </div>
    );
}
