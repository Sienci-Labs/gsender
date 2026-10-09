import { useTypedSelector } from 'app/hooks/useTypedSelector';
import type { RootState } from 'app/store/redux';
import { FileCode2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import pubsub from 'pubsub-js';
import { applyPickedFile, openGcodeFileOrPrompt } from '../utils/fileLoader';
import { WORKSHOP_VISUALIZER_COLORS } from 'app/features/Visualizer/viewerTheme';
import { PENDANT_CUT_COLOR, PENDANT_RAPID_COLOR } from '../visualizerTheme';
import DepthGauge from './DepthGauge';
import FeedOverrideWrapper from './FeedOverrideWrapper';
import FileLoadingOverlay from './FileLoadingOverlay';
import JobControls from './JobControls';
import ProgressAreaWrapper from './ProgressAreaWrapper';
import Visualizer from './Visualizer';
import WorkspaceSelector from './WorkspaceSelector';

// gcodeProcessing.ts dispatches processingProgress/processingName into
// fileInfo.slice, but updateFileProcessing's reducer only ever assigns
// fileProcessing - those fields aren't even part of FileInfoState, so they
// always read back as undefined. Progress instead comes from the same
// 'toolpath:progress' pubsub event the desktop Visualizer's Loading.tsx
// subscribes to (gcodeProcessing.ts already publishes it correctly). Mounted
// only while a file is processing, so it starts fresh at 0 for each load.
export function LiveFileLoadingOverlay({ fileName }: { fileName: string }) {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const token = pubsub.subscribe(
            'toolpath:progress',
            (_msg: string, value: number) => setProgress(value),
        );
        return () => pubsub.unsubscribe(token);
    }, []);

    return <FileLoadingOverlay fileName={fileName} progress={progress} />;
}

export default function VisualizerCard() {
    const fileLoaded = useTypedSelector((s: RootState) => s.file.fileLoaded);
    const fileProcessing = useTypedSelector(
        (s: RootState) => s.file.fileProcessing,
    );
    const fileName = useTypedSelector((s: RootState) =>
        s.file.fileProcessing
            ? s.file.processingName || s.file.name || ''
            : s.file.name || '',
    );
    const fileInputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="flex flex-col gap-3">
            {/* Visualizer canvas */}
            <div className="rounded-xl border border-gray-300 dark:border-outline dark:bg-surface-raised flex flex-col">
                {/* Top toolbar */}
                <div className="flex items-center px-3 py-2 bg-gray-100 dark:bg-surface-raised border-b border-gray-200 dark:border-outline rounded-t-xl">
                    <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-content-muted flex-1">
                        <span className="flex items-center gap-1">
                            <span
                                className="w-2 h-2 rounded-full inline-block"
                                style={{ backgroundColor: PENDANT_CUT_COLOR }}
                            />
                            Cut
                        </span>
                        <span className="flex items-center gap-1">
                            <span
                                className="w-2 h-2 rounded-full inline-block"
                                style={{ backgroundColor: PENDANT_RAPID_COLOR }}
                            />
                            Rapid
                        </span>
                        <span className="flex items-center gap-1">
                            <span
                                className="w-2.5 h-2 rounded-[2px] border inline-block"
                                style={{
                                    borderColor:
                                        WORKSHOP_VISUALIZER_COLORS.machineBed,
                                }}
                            />
                            Bed
                        </span>
                    </div>
                    <WorkspaceSelector />
                </div>

                <div className="relative h-56 overflow-hidden rounded-b-xl dark:bg-surface-sunken">
                    <Visualizer />
                    {fileLoaded && !fileProcessing && <DepthGauge />}
                    {fileProcessing && (
                        <div className="absolute inset-0 flex items-center justify-center p-3 bg-dark-darker/95">
                            <LiveFileLoadingOverlay fileName={fileName} />
                        </div>
                    )}
                    {!fileLoaded && !fileProcessing && (
                        <button
                            type="button"
                            onClick={() =>
                                openGcodeFileOrPrompt(fileInputRef.current)
                            }
                            className="absolute inset-2 rounded-lg flex flex-col items-center justify-center gap-2 bg-gray-100 dark:bg-transparent border border-dashed border-gray-300 dark:border-white/25 cursor-pointer"
                            aria-label="Open G-code file"
                        >
                            <FileCode2
                                size={44}
                                className="text-gray-400/60 dark:text-blue-300/30"
                            />
                            <span className="text-[13px] font-medium text-gray-400 dark:text-content-muted">
                                No file loaded
                            </span>
                            <span className="text-[11px] text-gray-600 dark:text-content-muted">
                                Tap here to open a G-code file
                            </span>
                        </button>
                    )}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".gcode,.nc,.tap,.cnc,.g,.gc"
                        className="hidden"
                        onChange={(e) => {
                            const f = e.target.files?.[0];
                            e.target.value = '';
                            if (f) void applyPickedFile(f);
                        }}
                    />
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
