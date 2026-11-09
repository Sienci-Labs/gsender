import { WORKFLOW_STATE_IDLE } from 'app/constants';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import type { RootState } from 'app/store/redux';
import { useEffect, useMemo, useRef, useState } from 'react';

export const clamp = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value));

/**
 * Lines-sent progress with the end-of-job completion flash, from
 * ProgressAreaWrapper; shared with the carve screen's run panel.
 */
export function useJobProgress() {
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
    const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        if (
            !fileLoaded ||
            totalLines <= 0 ||
            isFlashingComplete ||
            completedThisRun
        ) {
            previousReceivedRef.current = received;
            return;
        }

        const reachedEnd =
            received >= totalLines || currentLineRunning >= totalLines;
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

    // Primary reset mechanism: guaranteed timer so onAnimationEnd is not load-bearing.
    // 180ms * 6 iterations = 1080ms animation; give it a 200ms buffer.
    useEffect(() => {
        if (!isFlashingComplete) return;
        flashTimerRef.current = setTimeout(() => {
            setIsFlashingComplete(false);
            setCompletedThisRun(true);
            setDisplaySent(0);
        }, 1280);
        return () => {
            if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
        };
    }, [isFlashingComplete]);

    /** Wire to the flashing fill's onAnimationEnd. */
    const onFlashAnimationEnd = () => {
        if (!isFlashingComplete) return;
        if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
        setIsFlashingComplete(false);
        setCompletedThisRun(true);
        setDisplaySent(0);
    };

    const progressPercent =
        totalLines > 0 ? clamp((displaySent / totalLines) * 100, 0, 100) : 0;

    return {
        senderStatus,
        workflowState,
        displaySent,
        totalLines,
        received,
        progressPercent,
        isFlashingComplete,
        onFlashAnimationEnd,
    };
}
