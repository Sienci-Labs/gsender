import { FileCode2 } from 'lucide-react';
import { useTypedSelector } from '@gsender/controller-client/hooks/useTypedSelector';
import type { RootState } from '@gsender/controller-client/store/redux';
import { openGcodeFile } from '../utils/fileLoader';
import Visualizer from './Visualizer';
import JobControls from './JobControls';
import FeedOverrideWrapper from './FeedOverrideWrapper';
import WorkspaceSelector from './WorkspaceSelector';
import ProgressAreaWrapper from './ProgressAreaWrapper';
import FileLoadingOverlay from './FileLoadingOverlay';

export default function VisualizerCard() {
    const fileLoaded = useTypedSelector((s: RootState) => s.file.fileLoaded);
    const fileProcessing = useTypedSelector((s: RootState) => s.file.fileProcessing);
    const processingName = useTypedSelector((s: RootState) => s.file.processingName ?? '');
    const processingProgress = useTypedSelector((s: RootState) => s.file.processingProgress ?? 0);
    const fileName = useTypedSelector((s: RootState) =>
        s.file.fileProcessing ? (s.file.processingName || s.file.name || '') : (s.file.name || ''),
    );

    return (
        <div className="flex flex-col gap-3">
            {/* Visualizer canvas */}
            <div className="rounded-xl border border-gray-300 dark:border-outline dark:bg-surface-raised flex flex-col">
                {/* Top toolbar */}
                <div className="flex items-center px-3 py-2 bg-gray-100 dark:bg-surface-raised border-b border-gray-200 dark:border-outline rounded-t-xl">
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 flex-1">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: '#3e85c7' }} />Cut</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: '#0ef6ae' }} />Rapid</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />Bounds</span>
                    </div>
                    <WorkspaceSelector />
                </div>

                <div className="relative h-56 overflow-hidden rounded-b-xl dark:bg-surface-sunken">
                    <Visualizer />
                    {fileProcessing && (
                        <div className="absolute inset-0 flex items-center justify-center p-3 bg-dark-darker/95">
                            <FileLoadingOverlay
                                fileName={processingName || fileName}
                                progress={processingProgress}
                            />
                        </div>
                    )}
                    {!fileLoaded && !fileProcessing && (
                        <button
                            type="button"
                            onClick={() => openGcodeFile()}
                            className="absolute inset-2 rounded-lg flex flex-col items-center justify-center gap-2 bg-gray-100 dark:bg-transparent border border-dashed border-gray-300 dark:border-white/25 cursor-pointer"
                            aria-label="Open G-code file"
                        >
                            <FileCode2 size={44} className="text-gray-400/60 dark:text-blue-300/30" />
                            <span className="text-[13px] font-medium text-gray-400 dark:text-gray-500">No file loaded</span>
                            <span className="text-[11px] text-gray-500 dark:text-gray-600">Tap here to open a G-code file</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Job controls */}
            <JobControls />

            <ProgressAreaWrapper />

            {/* Override sliders */}
            <FeedOverrideWrapper />
        </div>
    );
}
