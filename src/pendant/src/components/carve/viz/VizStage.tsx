import type { ToolEntry } from 'app/features/ToolsPage/registry';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import type { RootState } from 'app/store/redux';
import cn from 'classnames';
import { Crosshair, X } from 'lucide-react';
import { useRef, useState } from 'react';
import DepthGauge from '../../DepthGauge';
import Visualizer, { type VisualizerHandle } from '../../Visualizer';
import { LiveFileLoadingOverlay } from '../../VisualizerCard';
import WorkspaceSelector from '../../WorkspaceSelector';
import type { CarveMode } from '../carveMode';
import InfoGlass from './InfoGlass';
import VizJobControls from './VizJobControls';
import VizViewTray from './VizViewTray';

// State glow around the stage, keyed to the mode; G-code line colours never
// change with state. The mockup's 14px/30% ring disappears against the
// near-black canvas, so this is a wider glow with a thin inner edge. Run and
// alarm breathe at the status badge's own pace (2s / 1s).
const RING: Partial<Record<CarveMode, string>> = {
    running:
        'shadow-state-run/45 border-state-run/40 animate-[viz-glow_2s_ease-in-out_infinite]',
    holdJob: 'shadow-state-hold/45 border-state-hold/40',
    holdIdle: 'shadow-state-hold/45 border-state-hold/40',
    alarm: 'shadow-state-alarm/50 border-state-alarm/45 animate-[viz-glow_1s_ease-in-out_infinite]',
    toolchange: 'shadow-state-tool/50 border-state-tool/45',
};

// Tap-to-move armed: the next hold on the canvas moves the machine, so it
// gets its own unmistakable breathing glow. Only armable while idle, so it
// never competes with the run/alarm rings.
const ARMED_RING =
    'border-2 shadow-robin-500/55 border-robin-500/60 animate-[viz-glow_1.2s_ease-in-out_infinite]';

export default function VizStage({
    mode,
    onOpenTool,
}: {
    mode: CarveMode;
    onOpenTool: (tool: ToolEntry) => void;
}) {
    const fileLoaded = useTypedSelector((s: RootState) => s.file.fileLoaded);
    const fileProcessing = useTypedSelector(
        (s: RootState) => s.file.fileProcessing,
    );
    const fileName = useTypedSelector((s: RootState) =>
        s.file.fileProcessing
            ? (s.file as any).processingName || s.file.name || ''
            : s.file.name || '',
    );
    const visualizerRef = useRef<VisualizerHandle>(null);
    const [jogArmed, setJogArmed] = useState(false);
    const ring = jogArmed ? ARMED_RING : RING[mode];

    return (
        <div className="relative h-[42vh] shrink-0 border-b border-outline-subtle bg-surface-base overflow-hidden">
            <Visualizer ref={visualizerRef} onJogArmedChange={setJogArmed} />
            <VizViewTray
                visualizerRef={visualizerRef}
                jogArmed={jogArmed}
                // Pinned tools only launch from Setup, like the setup tabs
                toolsDisabled={mode !== 'setup' && mode !== 'disconnected'}
                onOpenTool={onOpenTool}
            />

            {fileLoaded && !fileProcessing && (
                // Below the info glass so the two never overlap
                <div className="absolute right-0 top-[52px] bottom-0 w-[76px] pointer-events-none">
                    <DepthGauge />
                </div>
            )}

            {/* File name + close live in the File tab */}
            <div className="absolute left-2.5 top-2.5 z-10">
                <WorkspaceSelector menuAlign="left" />
            </div>
            <InfoGlass />
            <VizJobControls mode={mode} />

            {jogArmed && !fileProcessing && (
                // Only the dismiss button takes pointer events, so presses
                // beside the pill still reach the canvas
                <div className="absolute left-1/2 top-2.5 z-10 -translate-x-1/2 flex items-center gap-2 pl-2.5 pr-1 py-1 rounded-md border border-robin-500/70 bg-surface-sunken/[0.8] backdrop-blur-md text-xs font-medium text-robin-300 whitespace-nowrap pointer-events-none">
                    <Crosshair className="h-4 w-4 shrink-0" aria-hidden />
                    <span>Move armed — hold on a spot to move</span>
                    <button
                        type="button"
                        aria-label="Cancel move"
                        onClick={() => visualizerRef.current?.disarmJog()}
                        className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded text-content-secondary hover:text-content-primary"
                    >
                        <X className="h-4 w-4" aria-hidden />
                    </button>
                </div>
            )}

            {fileProcessing && (
                <div className="absolute inset-0 flex items-center justify-center p-3 bg-dark-darker/95">
                    <LiveFileLoadingOverlay fileName={fileName} />
                </div>
            )}

            {ring && (
                <div
                    className={cn(
                        'absolute inset-0 pointer-events-none border shadow-[inset_0_0_28px_2px_var(--tw-shadow-color)] motion-reduce:animate-none',
                        ring,
                    )}
                    aria-hidden
                />
            )}
        </div>
    );
}
