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

// Inset ring keyed to the mode; G-code line colours never change with state
const RING: Partial<Record<CarveMode, string>> = {
    running: 'shadow-state-run/30',
    holdJob: 'shadow-state-hold/30',
    holdIdle: 'shadow-state-hold/30',
    alarm: 'shadow-state-alarm/35',
    toolchange: 'shadow-state-tool/35',
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
                        'absolute inset-0 pointer-events-none shadow-[inset_0_0_14px_1px_var(--tw-shadow-color)]',
                        ring,
                    )}
                    aria-hidden
                />
            )}
        </div>
    );
}
