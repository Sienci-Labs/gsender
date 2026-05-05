import { useEffect, useMemo, useRef, useState } from 'react';
import { useTypedSelector } from '@gsender/controller-client/hooks/useTypedSelector';
import type { RootState } from '@gsender/controller-client/store/redux';
import { WORKFLOW_STATE_IDLE, WORKFLOW_STATE_RUNNING } from 'app/constants';

const clamp = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value));

const interpolateProgressGreen = (percent: number): string => {
    const t = clamp(percent, 0, 100) / 100;
    const from = { r: 134, g: 239, b: 172 }; // green-300
    const to = { r: 34, g: 197, b: 94 }; // green-500

    const r = Math.round(from.r + (to.r - from.r) * t);
    const g = Math.round(from.g + (to.g - from.g) * t);
    const b = Math.round(from.b + (to.b - from.b) * t);

    return `rgb(${r} ${g} ${b})`;
};

export default function ProgressAreaWrapper() {
    const senderStatus = useTypedSelector(
        (s: RootState) => s.controller.sender.status,
    ) as any;
    const workflowState = useTypedSelector(
        (s: RootState) => s.controller.workflow.state,
    ) as string;
    const fileLoaded = useTypedSelector((s: RootState) => s.file.fileLoaded);
    const fileTotal = useTypedSelector((s: RootState) => s.file.total);
    const fileContent = useTypedSelector((s: RootState) => s.file.content);

    const [displaySent, setDisplaySent] = useState(0);
    const [isFlashingComplete, setIsFlashingComplete] = useState(false);
    const [completedThisRun, setCompletedThisRun] = useState(false);
    const previousReceivedRef = useRef(0);

    const totalFromContent = useMemo(() => {
        if (!fileContent) {
            return 0;
        }
        return fileContent.split('\n').filter((line) => line.trim()).length;
    }, [fileContent]);

    const senderTotal = Number(senderStatus?.total) || 0;
    const totalLines = Math.max(fileTotal || 0, totalFromContent, senderTotal);

    const received = Number(senderStatus?.received) || 0;
    const currentLineRunning = Number(senderStatus?.currentLineRunning) || 0;
    const finishTime = Number(senderStatus?.finishTime) || 0;

    useEffect(() => {
        if (!fileLoaded) {
            setDisplaySent(0);
            setIsFlashingComplete(false);
            setCompletedThisRun(false);
            previousReceivedRef.current = 0;
            return;
        }

        if (totalLines <= 0) {
            setDisplaySent(0);
            return;
        }

        if (received > 0) {
            setCompletedThisRun(false);
        }

        if (!isFlashingComplete) {
            setDisplaySent(clamp(received, 0, totalLines));
        }
    }, [fileLoaded, totalLines, received, isFlashingComplete]);

    useEffect(() => {
        if (!fileLoaded || totalLines <= 0 || isFlashingComplete || completedThisRun) {
            previousReceivedRef.current = received;
            return;
        }

        const reachedEnd = received >= totalLines || currentLineRunning >= totalLines;
        const finishedAndReset =
            finishTime > 0 &&
            received === 0 &&
            previousReceivedRef.current > 0 &&
            workflowState === WORKFLOW_STATE_IDLE;

        if (reachedEnd || finishedAndReset) {
            setDisplaySent(totalLines);
            setIsFlashingComplete(true);
        }

        previousReceivedRef.current = received;
    }, [
        fileLoaded,
        totalLines,
        received,
        currentLineRunning,
        finishTime,
        workflowState,
        isFlashingComplete,
        completedThisRun,
    ]);

    const progressPercent = totalLines > 0
        ? clamp((displaySent / totalLines) * 100, 0, 100)
        : 0;
    const roundedProgress = Math.round(progressPercent);
    const fillWidth = progressPercent <= 0
        ? '0%'
        : `min(100%, max(${progressPercent}%, 56px))`;
    const showExpandedBar =
        workflowState === WORKFLOW_STATE_RUNNING || isFlashingComplete;
    const fillColor = interpolateProgressGreen(progressPercent);

    return (
        <div className="flex flex-col gap-1 px-1">
            <div className="flex justify-between text-xs text-gray-400 dark:text-gray-400">
                <span>Progress</span>
                <span>{`Line ${displaySent} / ${totalLines}`}</span>
            </div>
            <div className="h-7 flex items-center">
                <div
                    className={`relative w-full overflow-hidden transition-all duration-300 ease-out ${
                        showExpandedBar
                            ? 'h-7 rounded-md bg-gray-200 dark:bg-dark-lighter opacity-100 pendant-progress-track'
                            : 'h-2 rounded-full bg-gray-300 dark:bg-dark-lighter opacity-100'
                    }`}
                >
                    <div
                        className={`relative h-full rounded-md transition-[width,background-color] duration-200 ease-out ${
                            isFlashingComplete ? 'pendant-progress-complete' : ''
                        }`}
                        style={{ width: fillWidth, backgroundColor: fillColor }}
                        onAnimationEnd={() => {
                            if (!isFlashingComplete) return;
                            setIsFlashingComplete(false);
                            setCompletedThisRun(true);
                            setDisplaySent(0);
                        }}
                    >
                        {progressPercent > 0 && (
                            <div className="absolute right-1 top-1/2 -translate-y-1/2 h-6 min-w-8 px-1 rounded-[5px] border border-white/55 bg-white/28 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.22)] text-[11px] leading-none text-white font-semibold tabular-nums flex items-center justify-center">
                                {roundedProgress}%
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
