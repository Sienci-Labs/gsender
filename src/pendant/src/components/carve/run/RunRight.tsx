import { WORKFLOW_STATE_PAUSED } from 'app/constants';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import { convertMillisecondsToTimeStamp } from 'app/lib/datetime';
import type { RootState } from 'app/store/redux';
import cn from 'classnames';
import { useEffect, useMemo, useState } from 'react';
import { useJobProgress } from '../../../hooks/useJobProgress';
import { formatClock } from '../../../utils/format';
import ReadOnlyConsole from './ReadOnlyConsole';

/** Seconds since the job was paused; resets whenever it resumes. */
function usePausedSeconds(paused: boolean) {
    const [pausedAt, setPausedAt] = useState<number | null>(null);
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        setPausedAt(paused ? Date.now() : null);
    }, [paused]);

    useEffect(() => {
        if (!paused) return;
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, [paused]);

    return pausedAt ? Math.max(0, (now - pausedAt) / 1000) : 0;
}

/** Lines-sent progress pinned above a read-only console (panels 07, 11). */
export default function RunRight() {
    const {
        senderStatus,
        workflowState,
        displaySent,
        totalLines,
        received,
        progressPercent,
        isFlashingComplete,
        onFlashAnimationEnd,
    } = useJobProgress();
    const fileContent = useTypedSelector((s: RootState) => s.file.content);
    const lines = useMemo(
        () => (fileContent ? fileContent.split('\n') : []),
        [fileContent],
    );

    const paused = workflowState === WORKFLOW_STATE_PAUSED;
    const pausedSeconds = usePausedSeconds(paused);
    const elapsedMs = Number(senderStatus?.elapsedTime) || 0;
    const remainingSeconds = Number(senderStatus?.remainingTime) || 0;
    const currentLine = received > 0 ? (lines[received - 1] ?? '').trim() : '';

    return (
        <div className="flex flex-col flex-1 min-h-0 p-2.5">
            <div className="shrink-0 flex flex-col gap-2 mb-[9px] p-[11px] rounded-lg border border-outline-subtle bg-surface-raised">
                <div className="flex justify-between items-baseline">
                    <span className="font-mono text-[9.5px] tracking-[0.08em] uppercase text-content-disabled">
                        Lines sent
                    </span>
                    <span className="font-mono text-[13px] font-semibold text-content-primary tabular-nums">
                        {displaySent.toLocaleString()} /{' '}
                        {totalLines.toLocaleString()}
                    </span>
                </div>
                <div className="h-[7px] rounded-sm bg-surface-elevated overflow-hidden">
                    <div
                        className={cn(
                            'h-full rounded-sm transition-[width] duration-200 ease-out',
                            paused ? 'bg-state-hold' : 'bg-state-run',
                            isFlashingComplete && 'pendant-progress-complete',
                        )}
                        style={{ width: `${progressPercent}%` }}
                        onAnimationEnd={onFlashAnimationEnd}
                    />
                </div>
                <div className="flex justify-between font-mono text-[10px] text-content-muted tabular-nums">
                    {paused ? (
                        <span>Paused {formatClock(pausedSeconds)}</span>
                    ) : (
                        <span>
                            Elapsed {convertMillisecondsToTimeStamp(elapsedMs)}
                        </span>
                    )}
                    <span>
                        Remaining ~
                        {remainingSeconds > 0
                            ? formatClock(remainingSeconds)
                            : '—'}
                    </span>
                </div>
                <div className="font-mono text-[10.5px] text-blue-400 bg-surface-sunken border border-outline-subtle rounded-md px-2 py-[7px] truncate">
                    {currentLine || '—'}
                </div>
            </div>
            <ReadOnlyConsole />
        </div>
    );
}
