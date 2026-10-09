import { useTypedSelector } from 'app/hooks/useTypedSelector';
import type { RootState } from 'app/store/redux';
import cn from 'classnames';
import DepthGauge from '../../DepthGauge';
import Visualizer from '../../Visualizer';
import { LiveFileLoadingOverlay } from '../../VisualizerCard';
import type { CarveMode } from '../carveMode';
import FileChip from './FileChip';
import InfoGlass from './InfoGlass';
import VizJobControls from './VizJobControls';

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

export default function VizStage({
    mode,
    onLoadFile,
    onCloseFile,
}: {
    mode: CarveMode;
    onLoadFile: () => void;
    onCloseFile: () => void;
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
    const ring = RING[mode];

    return (
        <div className="relative h-[42vh] shrink-0 border-b border-outline-subtle bg-surface-base overflow-hidden">
            <Visualizer />

            {fileLoaded && !fileProcessing && (
                // Below the info glass so the two never overlap
                <div className="absolute right-0 top-[52px] bottom-0 w-[76px] pointer-events-none">
                    <DepthGauge />
                </div>
            )}

            <FileChip mode={mode} onLoad={onLoadFile} onClose={onCloseFile} />
            <InfoGlass />
            <VizJobControls mode={mode} />

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
