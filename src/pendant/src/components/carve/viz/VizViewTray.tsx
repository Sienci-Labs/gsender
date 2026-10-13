import { useTypedSelector } from 'app/hooks/useTypedSelector';
import type { RootState } from 'app/store/redux';
import cn from 'classnames';
import { Crosshair, Scan, Waypoints } from 'lucide-react';
import type { RefObject } from 'react';
import type { VisualizerHandle } from '../../Visualizer';

interface Props {
    visualizerRef: RefObject<VisualizerHandle>;
    jogArmed: boolean;
}

const BUTTON =
    'flex h-11 w-11 items-center justify-center rounded border border-transparent text-content-secondary transition-colors hover:border-outline-subtle hover:text-content-primary disabled:opacity-40 disabled:pointer-events-none';
const BUTTON_ARMED = 'border-robin-500 bg-robin-500/20 text-robin-400';

/** Left-center floating tray on the visualizer: tap-to-jog, center on the
 * loaded toolpath, center on the machine bed. */
export default function VizViewTray({ visualizerRef, jogArmed }: Props) {
    const fileLoaded = useTypedSelector((s: RootState) => s.file.fileLoaded);

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
                disabled={!fileLoaded}
                aria-label="Center on toolpath"
                onClick={() => visualizerRef.current?.focusToModel()}
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
        </div>
    );
}
