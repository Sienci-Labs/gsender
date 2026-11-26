import { WORKFLOW_STATE_PAUSED } from 'app/constants';
import { convertMillisecondsToTimeStamp } from 'app/lib/datetime';
import cn from 'classnames';
import { useEffect, useState } from 'react';
import { useJobProgress } from '../../../hooks/useJobProgress';
import {
    type TimelineTool,
    useToolTimeline,
} from '../../../hooks/useToolTimeline';
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

/** Multi-tool progress: one colored segment per tool (toolpath colors), a
 * tick at each change, and the unsent part dimmed. */
function SegmentedTrack({
    tools,
    totalLines,
    progressPercent,
    paused,
    isFlashingComplete,
    onFlashAnimationEnd,
}: {
    tools: TimelineTool[];
    totalLines: number;
    progressPercent: number;
    paused: boolean;
    isFlashingComplete: boolean;
    onFlashAnimationEnd: () => void;
}) {
    const pct = (line: number) =>
        Math.min(100, Math.max(0, (line / totalLines) * 100));

    return (
        <div
            className={cn(
                'relative h-7 rounded-md border border-outline bg-surface-elevated overflow-hidden',
                paused && 'ring-2 ring-state-hold',
                isFlashingComplete && 'pendant-progress-complete',
            )}
            onAnimationEnd={onFlashAnimationEnd}
        >
            {tools.map((tool, i) => (
                <div
                    key={`${tool.startLine}-${tool.toolNumber}`}
                    className={cn(
                        'absolute inset-y-0',
                        i > 0 && 'border-l-2 border-surface-base',
                    )}
                    style={{
                        left: `${pct(tool.startLine)}%`,
                        width: `${pct(tool.endLine + 1) - pct(tool.startLine)}%`,
                        backgroundColor: tool.color,
                    }}
                />
            ))}
            {/* Unsent part, faded */}
            <div
                className="absolute inset-y-0 right-0 bg-surface-elevated/70 transition-[left] duration-200 ease-out"
                style={{ left: `${progressPercent}%` }}
            />
            {progressPercent > 0 && (
                <div
                    className="absolute top-1/2 -translate-y-1/2 h-[22px] min-w-8 px-1 rounded-[5px] border border-white/80 bg-white/75 text-[11px] leading-none text-gray-900 font-semibold tabular-nums flex items-center justify-center transition-[left] duration-200 ease-out"
                    style={{
                        left: `clamp(4px, calc(${progressPercent}% - 36px), calc(100% - 36px))`,
                    }}
                >
                    {Math.round(progressPercent)}%
                </div>
            )}
        </div>
    );
}

/** Current tool and the distance to the next change. */
function ToolStatusRow({
    tools,
    received,
}: {
    tools: TimelineTool[];
    received: number;
}) {
    const currentIndex = Math.max(
        0,
        tools.findIndex((t) => received <= t.endLine),
    );
    const current = tools[currentIndex];
    const next = tools[currentIndex + 1];

    return (
        <div className="flex items-center justify-between gap-2 font-mono text-[11px] tabular-nums">
            <span className="flex items-center gap-1.5 min-w-0">
                <span
                    aria-hidden
                    className="w-2.5 h-2.5 shrink-0 rounded-sm"
                    style={{ backgroundColor: current.color }}
                />
                <span className="font-bold text-content-primary">
                    {current.label}
                </span>
                {current.comment && (
                    <span className="text-content-muted truncate">
                        {current.comment}
                    </span>
                )}
            </span>
            <span className="shrink-0 flex items-center gap-1.5 text-content-muted">
                {next ? (
                    <>
                        Next:
                        <span
                            aria-hidden
                            className="w-2.5 h-2.5 rounded-sm"
                            style={{ backgroundColor: next.color }}
                        />
                        <span className="font-semibold text-content-primary">
                            {next.label}
                        </span>
                        in{' '}
                        {Math.max(
                            0,
                            next.startLine - received,
                        ).toLocaleString()}{' '}
                        lines
                    </>
                ) : (
                    'Last tool'
                )}
            </span>
        </div>
    );
}

/** Lines-sent progress pinned above a read-only console (panels 07, 11). */
export default function RunRight() {
    const {
        senderStatus,
        workflowState,
        displaySent,
        totalLines,
        progressPercent,
        received,
        isFlashingComplete,
        onFlashAnimationEnd,
    } = useJobProgress();
    const tools = useToolTimeline();
    const multiTool = tools.length > 1 && totalLines > 0;

    const paused = workflowState === WORKFLOW_STATE_PAUSED;
    const pausedSeconds = usePausedSeconds(paused);
    const elapsedMs = Number(senderStatus?.elapsedTime) || 0;
    const remainingSeconds = Number(senderStatus?.remainingTime) || 0;
    // Keep a minimum fill width so the percent pill always fits
    const fillWidth =
        progressPercent <= 0
            ? '0%'
            : `min(100%, max(${progressPercent}%, 56px))`;

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
                {multiTool ? (
                    <>
                        <SegmentedTrack
                            tools={tools}
                            totalLines={totalLines}
                            progressPercent={progressPercent}
                            paused={paused}
                            isFlashingComplete={isFlashingComplete}
                            onFlashAnimationEnd={onFlashAnimationEnd}
                        />
                        <ToolStatusRow tools={tools} received={received} />
                    </>
                ) : (
                    <div className="h-7 rounded-md border border-outline bg-surface-elevated pendant-progress-track overflow-hidden">
                        <div
                            className={cn(
                                'relative h-full rounded-md transition-[width] duration-200 ease-out',
                                paused ? 'bg-state-hold' : 'bg-state-run',
                                isFlashingComplete &&
                                    'pendant-progress-complete',
                            )}
                            style={{ width: fillWidth }}
                            onAnimationEnd={onFlashAnimationEnd}
                        >
                            {progressPercent > 0 && (
                                <div className="absolute right-1 top-1/2 -translate-y-1/2 h-[22px] min-w-8 px-1 rounded-[5px] border border-white/80 bg-white/75 text-[11px] leading-none text-gray-900 font-semibold tabular-nums flex items-center justify-center">
                                    {Math.round(progressPercent)}%
                                </div>
                            )}
                        </div>
                    </div>
                )}
                <div className="flex justify-between items-end font-mono tabular-nums">
                    <span className="text-xs text-content-muted pb-1">
                        {paused
                            ? `Paused ${formatClock(pausedSeconds)}`
                            : `Elapsed ${convertMillisecondsToTimeStamp(elapsedMs)}`}
                    </span>
                    <span className="flex flex-col items-end">
                        <span className="text-[9.5px] tracking-[0.08em] uppercase text-content-disabled">
                            Remaining
                        </span>
                        <span
                            className={cn(
                                'text-2xl font-bold leading-7',
                                paused ? 'text-state-hold' : 'text-state-run',
                            )}
                        >
                            {remainingSeconds > 0
                                ? `~${formatClock(remainingSeconds)}`
                                : '—'}
                        </span>
                    </span>
                </div>
            </div>
            <ReadOnlyConsole />
        </div>
    );
}
